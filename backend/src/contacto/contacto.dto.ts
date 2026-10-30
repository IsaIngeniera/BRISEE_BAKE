import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ContactoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @IsEmail()
  @MaxLength(150)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  mensaje!: string;
}
