import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AddItemDto } from './dto/add-item.dto';

@Injectable()
export class CarritoService {
  constructor(private readonly prisma: PrismaService) {}

  async addItem(userId: string, addItemDto: AddItemDto) {
    const { idProducto, cantidad } = addItemDto;

    // Verificar si el producto existe y tiene existencias
    const producto = await this.prisma.producto.findUnique({
      where: { id: idProducto },
    });

    if (!producto) {
      throw new NotFoundException(`El producto con ID ${idProducto} no existe`);
    }

    if (producto.estado !== 'ACTIVO') {
      throw new BadRequestException('El producto no está disponible');
    }

    // Buscar o crear el carrito activo del usuario
    let carrito = await this.prisma.carrito.findFirst({
      where: { idUsuario: userId, estado: 'ACTIVO' },
    });

    if (!carrito) {
      carrito = await this.prisma.carrito.create({
        data: {
          idUsuario: userId,
          estado: 'ACTIVO',
        },
      });
    }

    // Buscar si el item ya existe en el carrito
    const itemExistente = await this.prisma.itemCarrito.findFirst({
      where: {
        idCarrito: carrito.id,
        idProducto: idProducto,
      },
    });

    if (itemExistente) {
      // Regla HU-7: Sumar la nueva cantidad a la cantidad existente
      const nuevaCantidad = itemExistente.cantidad + cantidad;

      const itemActualizado = await this.prisma.itemCarrito.update({
        where: { id: itemExistente.id },
        data: { cantidad: nuevaCantidad },
        include: { producto: true },
      });
      return {
        message: 'Cantidad actualizada en el carrito',
        item: itemActualizado,
      };
    } else {
      // Crear nuevo item
      const nuevoItem = await this.prisma.itemCarrito.create({
        data: {
          idCarrito: carrito.id,
          idProducto: idProducto,
          cantidad: cantidad,
        },
        include: { producto: true },
      });
      return { message: 'Producto agregado al carrito', item: nuevoItem };
    }
  }

  async getCart(userId: string) {
    const carrito = await this.prisma.carrito.findFirst({
      where: { idUsuario: userId, estado: 'ACTIVO' },
      include: {
        items: {
          include: {
            producto: {
              include: {
                imagenes: true,
              },
            },
          },
        },
      },
    });

    if (!carrito) {
      return { items: [], removed: [] };
    }

    // Filtra los productos inactivos/eliminados y los sacamos del carrito
    const removed: string[] = [];
    const validItems: typeof carrito.items = [];

    for (const item of carrito.items) {
      if (item.producto.estado === 'INACTIVO') {
        removed.push(item.producto.nombre);
        await this.prisma.itemCarrito.delete({ where: { id: item.id } });
      } else {
        validItems.push(item);
      }
    }

    // Dar formato similar a CartItem del frontend
    const mappedItems = validItems.map((item) => {
      const firstImage =
        item.producto.imagenes && item.producto.imagenes.length > 0
          ? item.producto.imagenes[0].urlImagen
          : undefined;

      return {
        productId: item.idProducto,
        nombre: item.producto.nombre,
        precio: Number(item.producto.precio), // convert Decimal to number
        imagenUrl: firstImage,
        cantidad: item.cantidad,
      };
    });

    return { items: mappedItems, removed };
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    cantidad: number,
  ) {
    if (cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a cero');
    }

    const carrito = await this.prisma.carrito.findFirst({
      where: { idUsuario: userId, estado: 'ACTIVO' },
    });

    if (!carrito) {
      throw new NotFoundException('Carrito no encontrado');
    }

    const item = await this.prisma.itemCarrito.findFirst({
      where: { idCarrito: carrito.id, idProducto: productId },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado en el carrito');
    }

    const itemActualizado = await this.prisma.itemCarrito.update({
      where: { id: item.id },
      data: { cantidad },
      include: { producto: true },
    });

    return { message: 'Cantidad actualizada', item: itemActualizado };
  }

  async removeItem(userId: string, productId: string) {
    const carrito = await this.prisma.carrito.findFirst({
      where: { idUsuario: userId, estado: 'ACTIVO' },
    });

    if (!carrito) {
      throw new NotFoundException('Carrito no encontrado');
    }

    const item = await this.prisma.itemCarrito.findFirst({
      where: { idCarrito: carrito.id, idProducto: productId },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado en el carrito');
    }

    await this.prisma.itemCarrito.delete({
      where: { id: item.id },
    });

    return { message: 'Item eliminado del carrito' };
  }
}
