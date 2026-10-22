import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de recuperación recibido en el enlace',
  })
  @IsNotEmpty({ message: 'El token de recuperación es requerido' })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'NuevaContrasena123',
    description: 'Nueva contraseña para la cuenta (mínimo 6 caracteres)',
  })
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
