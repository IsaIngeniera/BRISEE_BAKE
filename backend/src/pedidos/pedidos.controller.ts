import { Controller, Post, Body } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
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
}
