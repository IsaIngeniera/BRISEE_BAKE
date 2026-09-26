import {
  IsString,
  IsEmail,
  MinLength,
  IsNotEmpty,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const missingDataMsg = 'Faltan datos por completar';

export class RegisterDto {
  @ApiProperty({ example: 'Juan' })
  @IsString({ message: missingDataMsg })
  @IsNotEmpty({ message: missingDataMsg })
  @MaxLength(50)
  nombre: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString({ message: missingDataMsg })
  @IsNotEmpty({ message: missingDataMsg })
  @MaxLength(50)
  apellido: string;

  @ApiProperty({ example: '1990-01-01' })
  @IsDateString({}, { message: 'Fecha de nacimiento inválida' })
  @IsNotEmpty({ message: missingDataMsg })
  fechaNacimiento: string;

  @ApiProperty({ example: 'juan.perez@example.com' })
  @IsEmail({}, { message: 'El correo debe tener un formato válido' })
  @IsNotEmpty({ message: missingDataMsg })
  @MaxLength(150)
  correo: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString({ message: missingDataMsg })
  @IsNotEmpty({ message: missingDataMsg })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(255)
  password: string;

  @ApiProperty({ example: '3001234567' })
  @IsString({ message: missingDataMsg })
  @IsNotEmpty({ message: missingDataMsg })
  @MaxLength(20)
  celular: string;
}
