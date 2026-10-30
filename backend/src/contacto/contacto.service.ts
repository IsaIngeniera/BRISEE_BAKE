import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { ContactoDto } from './contacto.dto';

@Injectable()
export class ContactoService {
  async enviar(contactoDto: ContactoDto) {
    const recipient = process.env.ADMIN_EMAIL?.trim();
    if (!recipient) {
      throw new InternalServerErrorException(
        'El correo administrativo no está configurado.',
      );
    }

    const subject = `Nuevo mensaje de contacto de ${contactoDto.nombre}`;
    const html = `
      <h2>Nuevo mensaje de contacto</h2>
      <p><strong>Nombre:</strong> ${this.escapeHtml(contactoDto.nombre)}</p>
      <p><strong>Correo:</strong> ${this.escapeHtml(contactoDto.email)}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${this.escapeHtml(contactoDto.mensaje).replace(/\n/g, '<br>')}</p>
    `;

    try {
      if (process.env.RESEND_API_KEY?.trim()) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: '"Brisée Bake" <onboarding@resend.dev>',
          to: recipient,
          replyTo: contactoDto.email,
          subject,
          html,
        });
      } else if (
        process.env.EMAIL_USER?.trim() &&
        process.env.EMAIL_PASS?.trim()
      ) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: recipient,
          replyTo: contactoDto.email,
          subject,
          html,
        });
      } else {
        throw new Error('No hay proveedor de correo configurado.');
      }
    } catch (error) {
      console.error('Error enviando mensaje de contacto:', error);
      throw new InternalServerErrorException(
        'No fue posible enviar el mensaje. Inténtalo nuevamente.',
      );
    }

    return {
      message: 'Mensaje enviado correctamente.',
    };
  }

  private escapeHtml(value: string): string {
    return value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;',
        })[character] ?? character,
    );
  }
}
