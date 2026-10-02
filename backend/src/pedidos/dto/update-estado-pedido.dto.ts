import { IsEnum, IsNotEmpty } from 'class-validator';
import { EstadoEntrega } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEstadoPedidoDto {
  @ApiProperty({ enum: EstadoEntrega })
  @IsEnum(EstadoEntrega)
  @IsNotEmpty()
  estadoEntrega: EstadoEntrega;
}
