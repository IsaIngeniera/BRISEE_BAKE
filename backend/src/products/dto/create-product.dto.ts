import {
  IsInt,
  IsString,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  Min,
  IsOptional,
  IsArray,
} from 'class-validator';
import { EstadoProducto, EtiquetaDietetica } from '@prisma/client';

const missingDataMsg = 'Faltan datos por completar';

export class CreateProductDto {
  @IsString({ message: missingDataMsg })
  @IsNotEmpty({ message: missingDataMsg })
  idCategoria: string;

  @IsString({ message: missingDataMsg })
  @IsNotEmpty({ message: missingDataMsg })
  @MaxLength(100)
  nombre: string;

  @IsString({ message: missingDataMsg })
  @IsNotEmpty({ message: missingDataMsg })
  descripcion: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'Formato de moneda aceptado por el sistema (ej. COP, sin decimales negativos, máximo 2 decimales)',
    },
  )
  @IsNotEmpty({ message: missingDataMsg })
  @Min(0, {
    message:
      'Formato de moneda aceptado por el sistema (ej. COP, sin decimales negativos, máximo 2 decimales)',
  })
  precio: number;

  @IsString({ message: missingDataMsg })
  @IsNotEmpty({ message: missingDataMsg })
  @MaxLength(50)
  presentacion: string;

  @IsInt({ message: missingDataMsg })
  @IsNotEmpty({ message: missingDataMsg })
  @Min(0)
  existencias: number;

  @IsEnum(EstadoProducto, { message: missingDataMsg })
  @IsNotEmpty({ message: missingDataMsg })
  estado: EstadoProducto;

  @IsArray({ message: missingDataMsg })
  @IsEnum(EtiquetaDietetica, { each: true, message: missingDataMsg })
  @IsOptional()
  etiquetas?: EtiquetaDietetica[];
}
