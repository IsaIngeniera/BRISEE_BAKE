/**
 * Helpers de carrito para tests E2E.
 *
 * El carrito del frontend vive en localStorage con la clave:
 *   - `brisee_cart_<userId>` si hay sesión iniciada
 *   - `brisee_cart_guest`    si es visitante
 *
 * En vez de pasar por el flujo UI "/catalogo → agregar producto", que
 * involucra varios clics y es ortogonal al flujo que estamos probando,
 * inyectamos los items directamente en localStorage antes de navegar.
 */

import { Page } from '@playwright/test';

export interface CartItemFixture {
  productId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  tematica?: string;
  imagenUrl?: string;
}

/**
 * Inyecta items en el carrito del usuario autenticado ANTES de la 1ra
 * navegación. El JWT debe estar seteado previamente con `setAuthToken()`.
 */
export async function seedCartForUser(
  page: Page,
  userId: string,
  items: CartItemFixture[],
): Promise<void> {
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    {
      key: `brisee_cart_${userId}`,
      value: JSON.stringify(items),
    },
  );
}

/**
 * Avanza por el flujo del modal de entrega: selecciona método, acepta
 * aviso (si DOMICILIO), elige fecha y hace clic en "Confirmar y pagar".
 *
 * El llamador debe haber hecho clic antes en "Continuar con la compra".
 */
export async function completarFlujoEntrega(
  page: Page,
  options: {
    metodo: 'RETIRO' | 'DOMICILIO';
    fecha: string;
  },
): Promise<void> {
  // Paso 1: método
  await page
    .getByRole('radio', {
      name: options.metodo === 'RETIRO' ? /recogida en tienda/i : /envío a domicilio/i,
    })
    .check();

  if (options.metodo === 'DOMICILIO') {
    // Hay que aceptar el aviso del pago del domicilio por WhatsApp.
    await page
      .getByRole('checkbox', { name: /entiendo que el pago/i })
      .check();
  }

  await page.getByRole('button', { name: /^continuar$/i }).click();

  // Paso 2: fecha
  await page.locator('input[type="date"]').fill(options.fecha);
  await page.getByRole('button', { name: /confirmar y pagar/i }).click();
}
