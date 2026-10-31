import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GoogleAuthDto {
  @ApiPropertyOptional({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
    description:
      'Credencial o ID Token emitido por Google Identity Services (GIS)',
  })
  @IsOptional()
  @IsString()
  credential?: string;

  @ApiPropertyOptional({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
    description: 'ID Token emitido por Google',
  })
  @IsOptional()
  @IsString()
  idToken?: string;

  @ApiPropertyOptional({
    example: 'ya29.a0AfH6SM...',
    description: 'Token de acceso o autenticación de Google',
  })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiPropertyOptional({
    example: 'access_denied',
    description:
      'Indica si el usuario canceló la ventana emergente o hubo un error del cliente',
  })
  @IsOptional()
  @IsString()
  error?: string;
}
