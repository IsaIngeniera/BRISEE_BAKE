import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { Prisma, EstadoEntrega } from '@prisma/client';
import * as crypto from 'crypto';
import { Resend } from 'resend';

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
      include: {
        categoria: true,
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

    interface ProductoItem {
      nombre?: string;
      categoria?: { nombre?: string } | null;
    }

    const typedProducts = productosDb as unknown as ProductoItem[];

    const hasMacarons = typedProducts.some((p) => {
      const categoria = (p.categoria?.nombre || '').toLowerCase();
      const nombre = (p.nombre || '').toLowerCase();
      return categoria.includes('macaron') || nombre.includes('macaron');
    });

    const hasOtherProducts = typedProducts.some((p) => {
      const categoria = (p.categoria?.nombre || '').toLowerCase();
      const nombre = (p.nombre || '').toLowerCase();
      return !categoria.includes('macaron') && !nombre.includes('macaron');
    });

    const [year, month, day] = createPedidoDto.fechaEsperada.split('-');
    const fechaEsperadaDate = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day)),
    );
    const now = new Date();
    const todayDate = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
    );
    const daysUntilDelivery =
      (fechaEsperadaDate.getTime() - todayDate.getTime()) /
      (24 * 60 * 60 * 1000);
    if (daysUntilDelivery < 0) {
      throw new BadRequestException(
        'La fecha de entrega no puede ser en el pasado.',
      );
    }

    if (hasOtherProducts) {
      if (daysUntilDelivery < 3) {
        throw new BadRequestException(
          'La fecha de entrega debe ser al menos 3 días después de la fecha actual.',
        );
      }
    } else if (hasMacarons) {
      if (daysUntilDelivery < 2) {
        throw new BadRequestException(
          'Los pedidos con macarons deben tener al menos 2 días de anticipación.',
        );
      }
    }

    const wompiPublicKey = process.env.WOMPI_PUBLIC_KEY?.trim();
    if (process.env.NODE_ENV === 'production' && !wompiPublicKey) {
      throw new Error('WOMPI_PUBLIC_KEY must be configured in production');
    }
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET?.trim();
    if (process.env.NODE_ENV === 'production' && !integritySecret) {
      throw new Error(
        'WOMPI_INTEGRITY_SECRET must be configured in production',
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

    let frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    frontendBaseUrl = frontendBaseUrl.replace(/\/$/, '');

    const amountInCents = Math.round(Number(total) * 100);
    const reference = pedido.id;
    const redirectUrl = `${frontendBaseUrl}/finalizar-compra?status=APPROVED&reference=${reference}`;

    let signatureStr = '';
    if (integritySecret) {
      const concatStr = `${reference}${amountInCents}COP${integritySecret}`;
      const hash = crypto.createHash('sha256').update(concatStr).digest('hex');
      signatureStr = `&signature%3Aintegrity=${hash}`;
    }

    const finalRedirectUrl = redirectUrl.replace(
      /localhost|127\.0\.0\.1/g,
      'localtest.me',
    );
    const redirectStr = `&redirect-url=${encodeURIComponent(finalRedirectUrl)}`;

    const wompiUrl = `https://checkout.wompi.co/p/?public-key=${wompiPublicKey || 'pub_test_placeholder'}&currency=COP&amount-in-cents=${amountInCents}&reference=${reference}${signatureStr}${redirectStr}`;

    return {
      message: 'Pedido creado exitosamente',
      pedidoId: pedido.id,
      whatsappUrl,
      wompiUrl,
    };
  }

  async findByUser(userId: string) {
    try {
      return await this.prisma.pedido.findMany({
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
    } catch {
      throw new InternalServerErrorException(
        'Error al obtener el historial de pedidos',
      );
    }
  }

  async findAll() {
    try {
      return await this.prisma.pedido.findMany({
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
    } catch {
      throw new InternalServerErrorException(
        'Error al obtener la lista de pedidos',
      );
    }
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
      const isProd =
        process.env.WOMPI_PUBLIC_KEY?.startsWith('pub_prod_') ||
        process.env.WOMPI_ENV === 'production' ||
        process.env.NODE_ENV === 'production';

      const defaultApiUrl = isProd
        ? 'https://production.wompi.co/v1'
        : 'https://sandbox.wompi.co/v1';

      const wompiApiUrl = process.env.WOMPI_API_URL || defaultApiUrl;

      const headers: Record<string, string> = {};
      if (process.env.WOMPI_PRIVATE_KEY) {
        headers['Authorization'] = `Bearer ${process.env.WOMPI_PRIVATE_KEY}`;
      }

      const response =
        Object.keys(headers).length > 0
          ? await fetch(`${wompiApiUrl}/transactions/${transactionId}`, {
              headers,
            })
          : await fetch(`${wompiApiUrl}/transactions/${transactionId}`);
      if (!response.ok) {
        throw new Error('No se pudo verificar la transacción');
      }

      interface WompiTransactionResponse {
        data: {
          status: string;
          reference: string;
          amount_in_cents: number;
          currency?: string;
          signature?: {
            checksum?: string;
            properties?: string[];
          };
        };
      }
      const data = (await response.json()) as WompiTransactionResponse;

      const status = data.data.status;
      const reference = data.data.reference;
      const integritySecret = process.env.WOMPI_INTEGRITY_SECRET?.trim();
      if (process.env.NODE_ENV === 'production' && !integritySecret) {
        throw new Error(
          'WOMPI_INTEGRITY_SECRET must be configured in production',
        );
      }
      const pagoExistente = await this.prisma.pago.findUnique({
        where: { idPedido: reference },
        select: { estado: true, total: true },
      });

      if (!pagoExistente) {
        throw new Error('No existe un pago asociado a la transacción');
      }

      const expectedAmountInCents = Math.round(
        Number(pagoExistente.total) * 100,
      );
      if (
        status === 'APPROVED' &&
        (data.data.amount_in_cents !== expectedAmountInCents ||
          (data.data.currency && data.data.currency !== 'COP'))
      ) {
        throw new Error('El monto o la moneda de la transacción no coinciden');
      }

      if (integritySecret && data.data.signature?.checksum) {
        const properties = data.data.signature.properties ?? [
          'amount_in_cents',
          'reference',
          'currency',
        ];
        const signaturePayload = properties
          .map((property) => {
            if (property === 'amount_in_cents')
              return data.data.amount_in_cents;
            if (property === 'reference') return data.data.reference;
            if (property === 'currency') return data.data.currency ?? 'COP';
            return '';
          })
          .join('');
        const expectedChecksum = crypto
          .createHash('sha256')
          .update(`${signaturePayload}${integritySecret}`)
          .digest('hex');
        if (expectedChecksum !== data.data.signature.checksum) {
          throw new Error('La firma de la transacción no es válida');
        }
      } else if (process.env.NODE_ENV === 'production') {
        throw new Error('La transacción no incluye una firma válida');
      }

      let nuevoEstado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'CANCELADO' =
        'PENDIENTE';
      if (status === 'APPROVED') {
        nuevoEstado = 'APROBADO';
      } else if (status === 'DECLINED' || status === 'ERROR') {
        nuevoEstado = 'RECHAZADO';
      } else if (status === 'VOIDED') {
        nuevoEstado = 'CANCELADO';
      }

      const wasAlreadyApproved = pagoExistente?.estado === 'APROBADO';

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

      if (nuevoEstado === 'APROBADO' && !wasAlreadyApproved) {
        this.sendAdminNotification(reference).catch(console.error);
      }

      return {
        status: status,
        reference: reference,
        amount: data.data.amount_in_cents / 100,
      };
    } catch {
      throw new Error('Error de conexión con Wompi al verificar el pago');
    }
  }

  private async sendAdminNotification(pedidoId: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        cliente: true,
        productos: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!pedido) return;

    const resend = new Resend(process.env.RESEND_API_KEY);

    let productosHtml = '';
    pedido.productos.forEach((p) => {
      productosHtml += `<li>${p.cantidad}x ${p.producto?.nombre || 'Producto eliminado'} - $${p.precioUnitario.toString()}</li>`;
    });

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@briseebake.com';

    const mailOptions = {
      from: '"Brisee Bake" <onboarding@resend.dev>',
      to: adminEmail,
      subject: `🚨 Nuevo Pago Recibido - Pedido #${pedidoId.split('-')[0].toUpperCase()}`,
      html: `
        <h2>¡Nuevo pago confirmado!</h2>
        <p>El cliente <strong>${pedido.cliente?.nombre || 'Desconocido'} ${pedido.cliente?.apellido || ''}</strong> ha completado el pago de un pedido.</p>
        
        <h3>Detalles de Entrega:</h3>
        <ul>
          <li><strong>Dirección:</strong> ${pedido.direccionEntrega}</li>
          <li><strong>Ciudad:</strong> ${pedido.ciudad}</li>
          <li><strong>Tipo de entrega:</strong> ${pedido.tipoEntrega}</li>
          <li><strong>Observaciones:</strong> ${pedido.observacionesEntrega || 'N/A'}</li>
          <li><strong>Fecha Esperada:</strong> ${pedido.fechaEsperada.toLocaleDateString()}</li>
        </ul>

        <h3>Productos:</h3>
        <ul>
          ${productosHtml}
        </ul>
        <br/>
        <p><strong>Total pagado:</strong> $${pedido.total.toString()}</p>
        <p>Inicia la preparación lo antes posible.</p>
      `,
    };

    try {
      const { error } = await resend.emails.send(mailOptions);
      if (error) {
        console.error('Error de Resend enviando correo:', error);
      } else {
        console.log(`Notificación enviada al admin para el pedido ${pedidoId}`);
      }
    } catch (error) {
      console.error('Error enviando correo al admin:', error);
    }
  }
}
