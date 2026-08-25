import { Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login-admin')
  @ApiOperation({ summary: 'Obtener un Token de Administrador para pruebas' })
  @ApiResponse({ status: 201, description: 'Token generado' })
  async loginAdmin() {
    return this.authService.loginMockAdmin();
  }
}
