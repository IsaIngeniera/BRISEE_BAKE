import { Body, Controller, Post } from '@nestjs/common';
import { ContactoDto } from './contacto.dto';
import { ContactoService } from './contacto.service';

@Controller('contacto')
export class ContactoController {
  constructor(private readonly contactoService: ContactoService) {}

  @Post()
  enviar(@Body() contactoDto: ContactoDto) {
    return this.contactoService.enviar(contactoDto);
  }
}
