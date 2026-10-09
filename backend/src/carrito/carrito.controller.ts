import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CarritoService } from './carrito.service';
import { AddItemDto } from './dto/add-item.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('carrito')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('carrito')
export class CarritoController {
  constructor(private readonly carritoService: CarritoService) {}

  @Get()
  getCart(@Req() req: { user: { sub: string } }) {
    return this.carritoService.getCart(req.user.sub);
  }

  @Post('items')
  addItem(
    @Req() req: { user: { sub: string } },
    @Body() addItemDto: AddItemDto,
  ) {
    return this.carritoService.addItem(req.user.sub, addItemDto);
  }

  @Patch('items/:productId')
  updateItemQuantity(
    @Req() req: { user: { sub: string } },
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body('cantidad') cantidad: number,
  ) {
    return this.carritoService.updateItemQuantity(
      req.user.sub,
      productId,
      cantidad,
    );
  }

  @Delete('items/:productId')
  removeItem(
    @Req() req: { user: { sub: string } },
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.carritoService.removeItem(req.user.sub, productId);
  }
}
