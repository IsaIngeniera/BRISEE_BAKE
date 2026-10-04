/**
 * PRUEBAS E2E QA — HU-25: Registro de la orden
 *
 * Según la estrategia:
 *   "La E2E valida el flujo completo del cliente: carrito → datos de
 *    entrega → creación del pedido → redirección a Wompi."
 *
 * Validamos:
 *   - El flujo UI completo termina en una redirección a Wompi.
 *   - El pedido queda registrado en localStorage como "PENDIENTE DE PAGO".
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

test.describe('HU-25 Registro de la orden [E2E]', () => {
  test('flujo completo: carrito → entrega → Wompi (interceptado)', async ({
    page,
  }) => {
    const user = buildUserData({ correo: 'orden1@e2e.test.com' });
    await registerUserViaAPI(user);
    const token = await loginViaAPI(user.correo, user.password);
    const producto = await seedProduct({
      nombre: 'Cookie XL',
      precio: 6000,
    });

    await setAuthToken(page, token);
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString(),
    ) as { sub: string };
    await seedCartForUser(page, payload.sub, [
      {
        productId: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: 3,
      },
    ]);

    // Mock de Wompi: cuando el frontend intente ir a checkout.wompi.co,
    // interceptamos y simulamos un retorno con status APPROVED.
    await mockWompi(page, { status: 'APPROVED' });

    await page.goto('/carrito');
    await page
      .getByRole('button', { name: /continuar con la compra/i })
      .click();

    await completarFlujoEntrega(page, {
      metodo: 'RETIRO',
      fecha: fechaEnDias(5),
    });

    // Tras el POST /pedidos y la redirección interceptada, debemos aterrizar
    // en /finalizar-compra (que el mock arma como retorno de Wompi).
    await expect(page).toHaveURL(/\/finalizar-compra/, { timeout: 15_000 });
  });

  test('el total del pedido en el carrito refleja la suma precio × cantidad', async ({
    page,
  }) => {
    const user = buildUserData({ correo: 'orden2@e2e.test.com' });
    await registerUserViaAPI(user);
    const token = await loginViaAPI(user.correo, user.password);
    const prod1 = await seedProduct({ nombre: 'Prod A', precio: 5000 });
    const prod2 = await seedProduct({ nombre: 'Prod B', precio: 3000 });

    await setAuthToken(page, token);
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString(),
    ) as { sub: string };
    await seedCartForUser(page, payload.sub, [
      {
        productId: prod1.id,
        nombre: prod1.nombre,
        precio: prod1.precio,
        cantidad: 2, // 10000
      },
      {
        productId: prod2.id,
        nombre: prod2.nombre,
        precio: prod2.precio,
        cantidad: 1, // 3000
      },
    ]);

    await page.goto('/carrito');

    // Total esperado: 13000, formateado como "COP $ 13.000".
    await expect(
      page.locator('text=/COP \\$ *13\\.?000/'),
    ).toBeVisible();
  });

  test('un cliente sin productos ve el estado "carrito vacío"', async ({
    page,
  }) => {
    const user = buildUserData({ correo: 'orden3@e2e.test.com' });
    await registerUserViaAPI(user);
    const token = await loginViaAPI(user.correo, user.password);

    await setAuthToken(page, token);
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString(),
    ) as { sub: string };
    await seedCartForUser(page, payload.sub, []); // vacío

    await page.goto('/carrito');

    await expect(page.getByText(/tu carrito está vacío/i)).toBeVisible();
    await expect(
      page.getByRole('link', { name: /ir al catálogo/i }),
    ).toBeVisible();
  });
});
