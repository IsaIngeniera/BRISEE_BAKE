 
/**
 * PRUEBAS UNITARIAS QA - HU-27: Página de Contacto
 *
 * Historia de usuario:
 * Como usuario, quiero ver la información de contacto de la empresa,
 * para gestionar dudas y solicitar atención personalizada.
 *
 * Verifica:
 * - Visualización de la información de contacto (dirección, email, teléfono)
 * - Formulario de contacto funcional (validación requerida, envío)
 * - Confirmación visual al enviar
 * - Limpieza del formulario tras envío
 */

import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactoPage from '@/app/contacto/page';

describe('HU-27: Página de Contacto [QA]', () => {
  // ============================================================
  // VISUALIZACIÓN DE INFORMACIÓN
  // ============================================================
  describe('Información de contacto (visualización)', () => {
    it('[Happy Path] debe mostrar el título "Contacto"', () => {
      render(<ContactoPage />);
      expect(
        screen.getByRole('heading', { name: 'Contacto', level: 1 }),
      ).toBeInTheDocument();
    });

    it('[Happy Path] debe mostrar los horarios de atención', () => {
      render(<ContactoPage />);
      expect(screen.getByText(/8:00 AM - 4:00 PM/i)).toBeInTheDocument();
      expect(screen.getByText(/8:00 AM - 12:00 PM/i)).toBeInTheDocument();
    });

    it('[Happy Path] debe mostrar la dirección de la empresa', () => {
      render(<ContactoPage />);
      expect(
        screen.getByText(/Tv\. 54D Sur #52D-52/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Medellín/i)).toBeInTheDocument();
    });

    it('[Happy Path] debe mostrar el correo de la empresa', () => {
      render(<ContactoPage />);
      expect(screen.getByText('briseebake@gmail.com')).toBeInTheDocument();
    });

    it('[Happy Path] debe mostrar el teléfono de la empresa', () => {
      render(<ContactoPage />);
      expect(screen.getByText('+57 300 3685556')).toBeInTheDocument();
    });

    it('[Happy Path] debe tener un iframe con el mapa de ubicación', () => {
      render(<ContactoPage />);
      const iframe = screen.getByTitle('Ubicación de Brisée Bake');
      expect(iframe).toBeInTheDocument();
      expect(iframe.tagName).toBe('IFRAME');
    });
  });

  // ============================================================
  // FORMULARIO DE CONTACTO
  // ============================================================
  describe('Formulario de contacto', () => {
    it('[Happy Path] debe renderizar los campos del formulario', () => {
      render(<ContactoPage />);
      expect(screen.getByLabelText(/Nombre completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Mensaje/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Enviar mensaje/i }),
      ).toBeInTheDocument();
    });

    it('[Happy Path] debe permitir escribir en todos los campos', async () => {
      const user = userEvent.setup();
      render(<ContactoPage />);

      const nombreInput = screen.getByLabelText(
        /Nombre completo/i,
      ) as HTMLInputElement;
      const emailInput = screen.getByLabelText(
        /Email/i,
      ) as HTMLInputElement;
      const mensajeInput = screen.getByLabelText(
        /Mensaje/i,
      ) as HTMLTextAreaElement;

      await user.type(nombreInput, 'Juan Pérez');
      await user.type(emailInput, 'juan@example.com');
      await user.type(mensajeInput, 'Me gustaría saber más sobre sus productos');

      expect(nombreInput.value).toBe('Juan Pérez');
      expect(emailInput.value).toBe('juan@example.com');
      expect(mensajeInput.value).toBe(
        'Me gustaría saber más sobre sus productos',
      );
    });

    it('[Happy Path] debe mostrar confirmación al enviar el formulario', async () => {
      const user = userEvent.setup();
      render(<ContactoPage />);

      await user.type(
        screen.getByLabelText(/Nombre completo/i),
        'Juan Pérez',
      );
      await user.type(screen.getByLabelText(/Email/i), 'juan@example.com');
      await user.type(screen.getByLabelText(/Mensaje/i), 'Mensaje de prueba');
      await user.click(
        screen.getByRole('button', { name: /Enviar mensaje/i }),
      );

      expect(
        screen.getByText(/¡Gracias! Tu mensaje fue registrado/i),
      ).toBeInTheDocument();
    });

    it('[Happy Path] debe limpiar los campos tras enviar', async () => {
      const user = userEvent.setup();
      render(<ContactoPage />);

      const nombreInput = screen.getByLabelText(
        /Nombre completo/i,
      ) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
      const mensajeInput = screen.getByLabelText(
        /Mensaje/i,
      ) as HTMLTextAreaElement;

      await user.type(nombreInput, 'Juan');
      await user.type(emailInput, 'juan@example.com');
      await user.type(mensajeInput, 'Mensaje');
      await user.click(
        screen.getByRole('button', { name: /Enviar mensaje/i }),
      );

      expect(nombreInput.value).toBe('');
      expect(emailInput.value).toBe('');
      expect(mensajeInput.value).toBe('');
    });

    it('[Flujo Alternativo] no debe enviar el formulario si falta el nombre', async () => {
      const user = userEvent.setup();
      render(<ContactoPage />);

      await user.type(screen.getByLabelText(/Email/i), 'juan@example.com');
      await user.type(screen.getByLabelText(/Mensaje/i), 'Mensaje');
      await user.click(
        screen.getByRole('button', { name: /Enviar mensaje/i }),
      );

      // No debe mostrar confirmación porque el formulario tiene required
      expect(
        screen.queryByText(/¡Gracias! Tu mensaje fue registrado/i),
      ).not.toBeInTheDocument();
    });

    it('[Flujo Alternativo] no debe enviar el formulario si falta el email', async () => {
      const user = userEvent.setup();
      render(<ContactoPage />);

      await user.type(screen.getByLabelText(/Nombre completo/i), 'Juan');
      await user.type(screen.getByLabelText(/Mensaje/i), 'Mensaje');
      await user.click(
        screen.getByRole('button', { name: /Enviar mensaje/i }),
      );

      expect(
        screen.queryByText(/¡Gracias! Tu mensaje fue registrado/i),
      ).not.toBeInTheDocument();
    });

    it('[Flujo Alternativo] no debe enviar el formulario si falta el mensaje', async () => {
      const user = userEvent.setup();
      render(<ContactoPage />);

      await user.type(screen.getByLabelText(/Nombre completo/i), 'Juan');
      await user.type(screen.getByLabelText(/Email/i), 'juan@example.com');
      await user.click(
        screen.getByRole('button', { name: /Enviar mensaje/i }),
      );

      expect(
        screen.queryByText(/¡Gracias! Tu mensaje fue registrado/i),
      ).not.toBeInTheDocument();
    });

    it('[Flujo Alternativo] el campo email debe aceptar solo formato de correo', () => {
      render(<ContactoPage />);

      const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
      expect(emailInput.type).toBe('email');
    });

    it('[Flujo Alternativo] la confirmación debe desaparecer tras 4 segundos', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(<ContactoPage />);

      await user.type(screen.getByLabelText(/Nombre completo/i), 'Juan');
      await user.type(screen.getByLabelText(/Email/i), 'juan@example.com');
      await user.type(screen.getByLabelText(/Mensaje/i), 'Mensaje');
      await user.click(
        screen.getByRole('button', { name: /Enviar mensaje/i }),
      );

      expect(
        screen.getByText(/¡Gracias! Tu mensaje fue registrado/i),
      ).toBeInTheDocument();

      // Avanzar el timer dentro de act() para que React procese el cambio de estado
      await act(async () => {
        jest.advanceTimersByTime(4100);
      });

      expect(
        screen.queryByText(/¡Gracias! Tu mensaje fue registrado/i),
      ).not.toBeInTheDocument();

      jest.useRealTimers();
    });
  });
});
