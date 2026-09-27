import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Rol } from '@prisma/client';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllClientes() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true,
        celular: true,
        estado: true,
        rol: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateRol(id: string, nuevoRol: Rol) {
    return this.prisma.usuario.update({
      where: { id },
      data: { rol: nuevoRol },
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
      },
    });
  }
}
