import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CarritoService } from './carrito.service';
import { AddItemDto } from './dto/add-item.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('carrito')
@Controller('carrito')
export class CarritoController {
  constructor(private readonly carritoService: CarritoService) {}

  // Usuario simulado para pruebas de desarrollo sin Auth (mismo que HU-7)
  private readonly dummyUserId = '00000000-0000-0000-0000-000000000000';

  @Get()
  getCart() {
    return this.carritoService.getCart(this.dummyUserId);
  }

  @Post('items')
  addItem(@Body() addItemDto: AddItemDto) {
    return this.carritoService.addItem(this.dummyUserId, addItemDto);
  }

  @Patch('items/:productId')
  updateItemQuantity(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body('cantidad') cantidad: number,
  ) {
    return this.carritoService.updateItemQuantity(
      this.dummyUserId,
      productId,
      cantidad,
    );
  }

  @Delete('items/:productId')
  removeItem(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.carritoService.removeItem(this.dummyUserId, productId);
  }
}
