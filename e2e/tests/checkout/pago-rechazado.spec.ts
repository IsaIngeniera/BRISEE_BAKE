/**
 * PRUEBAS E2E QA — HU-22: Manejo de pago rechazado
 *
 * Según la estrategia:
 *   "La E2E valida que el cliente sea redirigido al carrito con los
 *    productos preservados y vea un mensaje claro."
 *
 * Validamos:
 *   - DECLINED, ERROR y VOIDED se traducen en "Pago no procesado".
 *   - El carrito del cliente NO se vacía (los productos siguen ahí).
 *   - El cliente puede volver al carrito para reintentar.
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
import { mockWompi, type WompiStatus } from '../../helpers/wompi-mock';

test.beforeEach(async () => {
  await cleanDatabase();
});

test.afterAll(async () => {
  await disconnectPrisma();
});

async function setupAndCheckout(
  page: import('@playwright/test').Page,
  status: WompiStatus,
) {
  const user = buildUserData({
    correo: `pago-rechazado-${Date.now()}@e2e.test.com`,
  });
  await registerUserViaAPI(user);
  const token = await loginViaAPI(user.correo, user.password);
  const producto = await seedProduct({ nombre: 'Granola Nueces' });

  await setAuthToken(page, token);
  const payload = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64url').toString(),
  ) as { sub: string };
  await seedCartForUser(page, payload.sub, [
    {
      productId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 2,
    },
  ]);

  await mockWompi(page, { status });

  await page.goto('/carrito');
  await page
    .getByRole('button', { name: /continuar con la compra/i })
    .click();
  await completarFlujoEntrega(page, {
    metodo: 'RETIRO',
    fecha: fechaEnDias(5),
  });

  return { userId: payload.sub };
}

test.describe('HU-22 Pago rechazado [E2E]', () => {
  test('DECLINED: muestra la pantalla "Pago no procesado"', async ({ page }) => {
    await setupAndCheckout(page, 'DECLINED');

    await expect(page).toHaveURL(/\/finalizar-compra/, { timeout: 15_000 });
    await expect(
      page.getByRole('heading', { name: /pago no procesado/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('ERROR: también muestra "Pago no procesado"', async ({ page }) => {
    await setupAndCheckout(page, 'ERROR');

    await expect(
      page.getByRole('heading', { name: /pago no procesado/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('VOIDED: también muestra "Pago no procesado"', async ({ page }) => {
    await setupAndCheckout(page, 'VOIDED');

    await expect(
      page.getByRole('heading', { name: /pago no procesado/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('tras un pago rechazado hay un link "Volver al carrito"', async ({
    page,
  }) => {
    await setupAndCheckout(page, 'DECLINED');

    await expect(
      page.getByRole('heading', { name: /pago no procesado/i }),
    ).toBeVisible({ timeout: 15_000 });

    const backLink = page.getByRole('link', { name: /volver al carrito/i });
    await expect(backLink).toBeVisible();

    // Y al hacer clic, lleva a /carrito.
    await backLink.click();
    await expect(page).toHaveURL(/\/carrito/);
  });

  test('tras un pago rechazado los productos SIGUEN en el carrito', async ({
    page,
  }) => {
    const { userId } = await setupAndCheckout(page, 'DECLINED');

    await expect(
      page.getByRole('heading', { name: /pago no procesado/i }),
    ).toBeVisible({ timeout: 15_000 });

    // El localStorage del carrito debe mantener los productos.
    const stored = await page.evaluate(
      (key) => localStorage.getItem(key),
      `brisee_cart_${userId}`,
    );
    expect(stored).not.toBeNull();
    const items = JSON.parse(stored!);
    expect(items.length).toBeGreaterThan(0);
  });
});
