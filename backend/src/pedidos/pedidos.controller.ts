import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdateEstadoPedidoDto } from './dto/update-estado-pedido.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('pedidos')
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  // Usuario simulado para pruebas de desarrollo (mismo que carrito)
  private readonly dummyUserId = '00000000-0000-0000-0000-000000000000';

  @Post()
  createPedido(@Body() createPedidoDto: CreatePedidoDto) {
    return this.pedidosService.createPedido(this.dummyUserId, createPedidoDto);
  }

  @Get()
  findAll() {
    return this.pedidosService.findAll();
  }

  @Patch(':id/estado')
  updateEstado(
    @Param('id') id: string,
    @Body() updateEstadoDto: UpdateEstadoPedidoDto,
  ) {
    return this.pedidosService.updateEstado(id, updateEstadoDto.estadoEntrega);
  }
}
