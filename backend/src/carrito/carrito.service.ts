import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
      return { message: 'Cantidad actualizada en el carrito', item: itemActualizado };
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
}

