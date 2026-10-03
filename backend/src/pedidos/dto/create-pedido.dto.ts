import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoEntrega } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class PedidoItemDto {
  @IsString()
  @IsNotEmpty()
  idProducto: string;

  @IsNotEmpty()
  cantidad: number;
}

export class CreatePedidoDto {
  @ApiProperty({ description: 'Dirección de entrega para el pedido' })
  @IsString()
  @IsNotEmpty()
  direccionEntrega: string;

  @ApiProperty({ description: 'Ciudad de entrega' })
  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @ApiProperty({
    description: 'Tipo de entrega (ENVIO o RETIRO)',
    enum: TipoEntrega,
  })
  @IsEnum(TipoEntrega)
  @IsNotEmpty()
  tipoEntrega: TipoEntrega;

  @ApiProperty({
    description: 'Observaciones adicionales para la entrega',
    required: false,
  })
  @IsString()
  @IsOptional()
  observacionesEntrega?: string;

  @ApiProperty({
    description: 'Fecha esperada o deseada para la entrega del pedido',
  })
  @IsString()
  @IsNotEmpty()
  fechaEsperada: string;

  @ApiProperty({ description: 'Items del carrito' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PedidoItemDto)
  items: PedidoItemDto[];
}
