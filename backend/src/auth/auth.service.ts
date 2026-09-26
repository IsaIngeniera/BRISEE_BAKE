import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { Rol, EstadoUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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

  async login(loginDto: LoginDto) {
    const user = await this.prisma.usuario.findUnique({
      where: { correo: loginDto.correo },
    });

    if (!user) {
      throw new UnauthorizedException('Nombre de Usuario y/o contraseñas incorrectas');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Nombre de Usuario y/o contraseñas incorrectas');
    }

    const payload = {
      sub: user.id,
      correo: user.correo,
      rol: user.rol,
    };

    return {
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
