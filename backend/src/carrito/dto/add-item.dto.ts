import { IsInt, IsPositive, IsUUID } from 'class-validator';

export class AddItemDto {
  @IsUUID('all', { message: 'El idProducto debe ser un UUID válido' })
  idProducto: string;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @IsPositive({ message: 'La cantidad debe ser mayor a cero' })
  cantidad: number;
}
