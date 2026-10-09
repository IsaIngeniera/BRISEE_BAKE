import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('clientes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener la lista de todos los clientes (Solo Admin)',
  })
  findAllClientes() {
    return this.usuariosService.findAllClientes();
  }

  @Patch(':id/rol')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar el rol de un usuario (Solo Admin)' })
  updateRol(
    @Param('id') id: string,
    @Body() body: { rol: Rol },
    @Req() req: { user: { sub: string } },
  ) {
    if (req.user.sub === id) {
      throw new BadRequestException('No puedes cambiar tus propios permisos.');
    }
    return this.usuariosService.updateRol(id, body.rol);
  }
}
