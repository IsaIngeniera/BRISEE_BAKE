import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { Prisma, EstadoEntrega } from '@prisma/client';

@Injectable()
export class PedidosService {
  // Número oficial de WhatsApp de la empresa
  private readonly WHATSAPP_NUMBER = '573003685556';

  constructor(private readonly prisma: PrismaService) {}

  async createPedido(userId: string, createPedidoDto: CreatePedidoDto) {
    if (!createPedidoDto.items || createPedidoDto.items.length === 0) {
      throw new BadRequestException('El carrito está vacío o no existe.');
    }

    // 1. Obtener los productos desde la base de datos para calcular el total real
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

    // 2. Calcular total
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

    // 3. Crear el Pedido y los PedidoProductos
    const pedido = await this.prisma.$transaction(async (tx) => {
      const nuevoPedido = await tx.pedido.create({
        data: {
          idCliente: userId, // Dummy user for now
          estadoEntrega: 'PENDIENTE',
          total: total,
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

      return nuevoPedido;
    });

    // 4. Formatear el mensaje y URL de WhatsApp
    const shortId = pedido.id.split('-')[0].toUpperCase();
    const mensaje = `Hola, acabo de realizar el pedido #${shortId}, escribo para coordinar la entrega`;
    const whatsappUrl = `https://wa.me/${this.WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;

    return {
      message: 'Pedido creado exitosamente',
      pedidoId: pedido.id,
      whatsappUrl,
    };
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
}
