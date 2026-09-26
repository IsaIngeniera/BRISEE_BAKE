import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { Rol, EstadoUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.usuario.findUnique({
      where: { correo: registerDto.correo },
    });

    if (existingUser) {
      throw new BadRequestException('Este correo ya está registrado');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    const newUser = await this.prisma.usuario.create({
      data: {
        nombre: registerDto.nombre,
        apellido: registerDto.apellido,
        correo: registerDto.correo,
        password: hashedPassword,
        rol: Rol.CLIENTE,
        celular: registerDto.celular,
        estado: EstadoUsuario.ACTIVO,
        fechaNacimiento: new Date(registerDto.fechaNacimiento),
        createdAt: new Date(),
      },
    });

    const payload = {
      sub: newUser.id,
      correo: newUser.correo,
      rol: newUser.rol,
    };
    return {
      message: 'Registro exitoso',
      access_token: await this.jwtService.signAsync(payload),
    };
  }

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
