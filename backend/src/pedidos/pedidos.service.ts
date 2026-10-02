import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { Prisma, EstadoEntrega } from '@prisma/client';
import * as crypto from 'crypto';
@Injectable()
export class PedidosService {
  private readonly WHATSAPP_NUMBER = '573003685556';

  constructor(private readonly prisma: PrismaService) {}

  async createPedido(userId: string, createPedidoDto: CreatePedidoDto) {
    if (!createPedidoDto.items || createPedidoDto.items.length === 0) {
      throw new BadRequestException('El carrito está vacío o no existe.');
    }

    const productosDb = await this.prisma.producto.findMany({
      where: {
        id: { in: createPedidoDto.items.map((item) => item.idProducto) },
        estado: 'ACTIVO',
      },
    });

    if (productosDb.length === 0) {
      throw new BadRequestException(
        'No hay productos disponibles en el carrito.',
      );
    }

    let total = new Prisma.Decimal(0);
    const validItems: {
      idProducto: string;
      cantidad: number;
      precioUnitario: Prisma.Decimal;
    }[] = [];

    for (const item of createPedidoDto.items) {
      const productoDb = productosDb.find((p) => p.id === item.idProducto);
      if (productoDb) {
        total = total.add(productoDb.precio.mul(item.cantidad));
        validItems.push({
          idProducto: item.idProducto,
          cantidad: item.cantidad,
          precioUnitario: productoDb.precio,
        });
      }
    }

    const [year, month, day] = createPedidoDto.fechaEsperada.split('-');
    const fechaEsperadaDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minValidDate = new Date(today);
    minValidDate.setDate(today.getDate() + 3);

    if (fechaEsperadaDate < minValidDate) {
      throw new BadRequestException(
        'La fecha de entrega debe ser al menos 3 días después de la fecha actual.',
      );
    }

    const pedido = await this.prisma.$transaction(async (tx) => {
      const nuevoPedido = await tx.pedido.create({
        data: {
          idCliente: userId,
          estadoEntrega: 'PENDIENTE',
          total: total,
          fechaEsperada: fechaEsperadaDate,
          direccionEntrega: createPedidoDto.direccionEntrega,
          ciudad: createPedidoDto.ciudad,
          tipoEntrega: createPedidoDto.tipoEntrega,
          observacionesEntrega: createPedidoDto.observacionesEntrega || '',
        },
      });

      const orderProducts = validItems.map((item) => ({
        idPedido: nuevoPedido.id,
        idProducto: item.idProducto,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
      }));

      await tx.pedidoProducto.createMany({
        data: orderProducts,
      });

      await tx.pago.create({
        data: {
          idPedido: nuevoPedido.id,
          estado: 'PENDIENTE',
          metodo: 'WOMPI',
          total: total,
        },
      });

      return nuevoPedido;
    });

    const shortId = pedido.id.split('-')[0].toUpperCase();
    const mensaje = `Hola, acabo de realizar el pedido #${shortId}, escribo para coordinar la entrega`;
    const whatsappUrl = `https://wa.me/${this.WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;

    const wompiPublicKey =
      process.env.WOMPI_PUBLIC_KEY || 'pub_test_placeholder';
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET || '';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const amountInCents = Math.round(Number(total) * 100);
    const reference = pedido.id;
    const redirectUrl = `${frontendUrl}/finalizar-compra?status=APPROVED&reference=${reference}`;

    let signatureStr = '';
    if (integritySecret) {
      const concatStr = `${reference}${amountInCents}COP${integritySecret}`;
      const hash = crypto.createHash('sha256').update(concatStr).digest('hex');
      signatureStr = `&signature%3Aintegrity=${hash}`;
    }

    let finalRedirectUrl = redirectUrl;
    if (finalRedirectUrl.includes('localhost')) {
      finalRedirectUrl = finalRedirectUrl.replace('localhost', 'localtest.me');
    }
    const redirectStr = `&redirect-url=${encodeURIComponent(finalRedirectUrl)}`;

    const wompiUrl = `https://checkout.wompi.co/p/?public-key=${wompiPublicKey}&currency=COP&amount-in-cents=${amountInCents}&reference=${reference}${signatureStr}${redirectStr}`;

    return {
      message: 'Pedido creado exitosamente',
      pedidoId: pedido.id,
      whatsappUrl,
      wompiUrl,
    };
  }

  async findByUser(userId: string) {
    return this.prisma.pedido.findMany({
      where: { idCliente: userId },
      include: {
        productos: {
          select: {
            cantidad: true,
            precioUnitario: true,
            producto: {
              select: {
                id: true,
                nombre: true,
                categoria: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.pedido.findMany({
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
        productos: {
          include: {
            producto: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateEstado(id: string, estadoEntrega: EstadoEntrega) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    return this.prisma.pedido.update({
      where: { id },
      data: { estadoEntrega },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
      },
    });
  }

  async verificarPagoWompi(transactionId: string) {
    try {
      const response = await fetch(
        `https://sandbox.wompi.co/v1/transactions/${transactionId}`,
      );
      if (!response.ok) {
        throw new Error('No se pudo verificar la transacción');
      }

      interface WompiTransactionResponse {
        data: {
          status: string;
          reference: string;
          amount_in_cents: number;
        };
      }
      const data = (await response.json()) as WompiTransactionResponse;

      const status = data.data.status;
      const reference = data.data.reference;

      let nuevoEstado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'CANCELADO' =
        'PENDIENTE';
      if (status === 'APPROVED') {
        nuevoEstado = 'APROBADO';
      } else if (status === 'DECLINED' || status === 'ERROR') {
        nuevoEstado = 'RECHAZADO';
      } else if (status === 'VOIDED') {
        nuevoEstado = 'CANCELADO';
      }

      await this.prisma.pago
        .update({
          where: { idPedido: reference },
          data: {
            estado: nuevoEstado,
            transaccionId: transactionId,
          },
        })
        .catch((err) =>
          console.error('No se pudo actualizar la tabla Pago:', err),
        );

      return {
        status: status,
        reference: reference,
        amount: data.data.amount_in_cents / 100,
      };
    } catch {
      throw new Error('Error de conexión con Wompi al verificar el pago');
    }
  }
}
