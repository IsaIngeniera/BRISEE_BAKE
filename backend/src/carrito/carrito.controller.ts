import { Controller, Post, Body, Get } from '@nestjs/common';
import { CarritoService } from './carrito.service';
import { AddItemDto } from './dto/add-item.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('carrito')
@Controller('carrito')
export class CarritoController {
  constructor(private readonly carritoService: CarritoService) {}

  @Post('items')
  addItem(@Body() addItemDto: AddItemDto) {
    // Usar el ID del usuario de prueba (token basura)
    const dummyUserId = '00000000-0000-0000-0000-000000000000';
    return this.carritoService.addItem(dummyUserId, addItemDto);
  }
}

