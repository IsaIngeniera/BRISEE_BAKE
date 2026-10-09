/**
 * PRUEBAS E2E QA — HU-21: Confirmación de pago exitoso
 *
 * Según la estrategia:
 *   "La E2E valida la experiencia del cliente: ver la pantalla de
 *    confirmación con el resumen correcto, carrito vacío e historial
 *    actualizado. Se usa un mock de Wompi en E2E para controlar
 *    la respuesta."
 *
 * Validamos:
 *   - Mock de Wompi devuelve APPROVED.
 *   - El cliente ve "¡Pago exitoso!" en /finalizar-compra.
 *   - El carrito queda vacío después del pago.
 */

import { test, expect } from '@playwright/test';
import {
  cleanDatabase,
  disconnectPrisma,
  seedProduct,
  fechaEnDias,
} from '../../helpers/db';
import {
  buildUserData,
  loginViaAPI,
  registerUserViaAPI,
  setAuthToken,
} from '../../helpers/auth';
import { seedCartForUser, completarFlujoEntrega } from '../../helpers/cart';
import { mockWompi } from '../../helpers/wompi-mock';

test.beforeEach(async () => {
  await cleanDatabase();
});

test.afterAll(async () => {
  await disconnectPrisma();
});

async function setupCartAndCheckout(page: import('@playwright/test').Page) {
  const user = buildUserData({
    correo: `pago-${Date.now()}@e2e.test.com`,
  });
  await registerUserViaAPI(user);
  const token = await loginViaAPI(user.correo, user.password);
  const producto = await seedProduct({ nombre: 'Macaron Test', precio: 8000 });

  await setAuthToken(page, token);
  const payload = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64url').toString(),
  ) as { sub: string };
  await seedCartForUser(page, payload.sub, [
    {
      productId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1,
    },
  ]);

  return { user, token, producto, userId: payload.sub };
}

test.describe('HU-21 Pago aprobado [E2E]', () => {
  test('APPROVED: el cliente ve la pantalla "¡Pago exitoso!"', async ({
    page,
  }) => {
    await setupCartAndCheckout(page);
    await mockWompi(page, { status: 'APPROVED' });

    await page.goto('/carrito');
    await page
      .getByRole('button', { name: /continuar con la compra/i })
      .click();
    await completarFlujoEntrega(page, {
      metodo: 'RETIRO',
      fecha: fechaEnDias(5),
    });

    // Esperamos la landing de finalizar-compra con el pago aprobado.
    await expect(page).toHaveURL(/\/finalizar-compra/, { timeout: 15_000 });
    await expect(
      page.getByRole('heading', { name: /¡pago exitoso!/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('después del pago aprobado, el carrito queda vacío', async ({
    page,
  }) => {
    const { userId } = await setupCartAndCheckout(page);
    await mockWompi(page, { status: 'APPROVED' });

    await page.goto('/carrito');
    await page
      .getByRole('button', { name: /continuar con la compra/i })
      .click();
    await completarFlujoEntrega(page, {
      metodo: 'RETIRO',
      fecha: fechaEnDias(5),
    });

    await expect(page.getByRole('heading', { name: /¡pago exitoso!/i })).toBeVisible({ timeout: 15_000 });

    // Verificamos que localStorage del carrito quedó vacío (o removido).
    const cartState = await page.evaluate((key) => localStorage.getItem(key), `brisee_cart_${userId}`);
    expect(cartState === null || cartState === '[]').toBe(true);
  });

  test('la página muestra un link a /cuenta/pedidos tras el pago aprobado', async ({
    page,
  }) => {
    await setupCartAndCheckout(page);
    await mockWompi(page, { status: 'APPROVED' });

    await page.goto('/carrito');
    await page
      .getByRole('button', { name: /continuar con la compra/i })
      .click();
    await completarFlujoEntrega(page, {
      metodo: 'RETIRO',
      fecha: fechaEnDias(5),
    });

    await expect(page.getByRole('heading', { name: /¡pago exitoso!/i })).toBeVisible({ timeout: 15_000 });

    await expect(
      page.getByRole('link', { name: /ver mis pedidos/i }),
    ).toBeVisible();
  });
});
