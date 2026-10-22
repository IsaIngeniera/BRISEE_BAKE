import {
  Controller,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario cliente' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o correo ya registrado',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión con correo y contraseña' })
  @ApiResponse({
    status: 201,
    description: 'Inicio de sesión exitoso, retorna el token JWT',
  })
  @ApiResponse({
    status: 401,
    description: 'Nombre de Usuario y/o contraseñas incorrectas',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('login-admin')
  @ApiOperation({ summary: 'Obtener un Token de Administrador para pruebas' })
  @ApiResponse({ status: 201, description: 'Token generado' })
  async loginAdmin() {
    return this.authService.loginMockAdmin();
  }

  @Post(['google', 'google-login'])
  @ApiOperation({
    summary: 'Iniciar sesión o registrarse automáticamente con Google (SSO)',
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticación con Google exitosa, retorna el token JWT',
  })
  @ApiResponse({
    status: 400,
    description: 'Token no proporcionado o proceso cancelado por el usuario',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales de Google inválidas o cuenta inactiva/bloqueada',
  })
  async googleLogin(@Body() googleAuthDto: GoogleAuthDto) {
    return this.authService.loginGoogle(googleAuthDto);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o correo ya en uso',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async updateProfile(
    @Req() req: Request & { user?: { sub: string } },
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Usuario no válido');
    }
    return this.authService.updateProfile(userId, updateProfileDto);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Solicitar enlace de recuperación de contraseña',
  })
  @ApiResponse({
    status: 200,
    description: 'Enlace enviado o mensaje genérico de confirmación',
  })
  @ApiResponse({
    status: 400,
    description: 'Correo electrónico inválido',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Restablecer contraseña usando token de recuperación',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña restablecida exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido o expirado, o datos incorrectos',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
