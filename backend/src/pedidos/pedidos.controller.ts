import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdateEstadoPedidoDto } from './dto/update-estado-pedido.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Rol } from '@prisma/client';

@ApiTags('pedidos')
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createPedido(
    @Req() req: Request & { user?: { sub: string } },
    @Body() createPedidoDto: CreatePedidoDto,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException(
        'Debe iniciar sesión para hacer un pedido',
      );
    }
    return this.pedidosService.createPedido(userId, createPedidoDto);
  }

  @Get('mis-pedidos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findMisPedidos(@Req() req: Request & { user?: { sub: string } }) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Debe iniciar sesión para ver sus pedidos');
    }
    return this.pedidosService.findByUser(userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN)
  @ApiBearerAuth()
  findAll() {
    return this.pedidosService.findAll();
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN)
  @ApiBearerAuth()
  updateEstado(
    @Param('id') id: string,
    @Body() updateEstadoDto: UpdateEstadoPedidoDto,
  ) {
    return this.pedidosService.updateEstado(id, updateEstadoDto.estadoEntrega);
  }
}
