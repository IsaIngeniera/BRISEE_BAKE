import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { Rol, EstadoUsuario } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async loginMockAdmin() {
    // 1. Check if mock admin exists
    let admin = await this.prisma.usuario.findUnique({
      where: { correo: 'admin@briseebake.com' },
    });

    // 2. If not, create it
    if (!admin) {
      admin = await this.prisma.usuario.create({
        data: {
          nombre: 'Admin',
          apellido: 'Mock',
          correo: 'admin@briseebake.com',
          password: 'hashed_password_mock', // Fake password
          rol: Rol.ADMIN,
          celular: '1234567890',
          estado: EstadoUsuario.ACTIVO,
          fechaNacimiento: new Date('1990-01-01'),
          createdAt: new Date(),
        },
      });
    }

    // 3. Generate Token
    const payload = { sub: admin.id, correo: admin.correo, rol: admin.rol };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
