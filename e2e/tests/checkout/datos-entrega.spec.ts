/**
 * PRUEBAS E2E QA — HU-19: Ingreso de datos de entrega
 *
 * Según la estrategia:
 *   "La E2E valida el flujo completo del usuario: completar el formulario,
 *    elegir entre envío o retiro, y continuar al pago."
 *
 * Validamos:
 *   - El modal de método de entrega aparece al dar "Continuar con la compra".
 *   - RETIRO: se puede continuar sin aviso adicional.
 *   - DOMICILIO: requiere aceptar el aviso del pago por WhatsApp.
 *   - La fecha mínima es 3 días en el futuro (atributo min del input date).
 *   - Al confirmar, se intenta crear el pedido (POST /pedidos).
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
import { seedCartForUser } from '../../helpers/cart';

test.beforeEach(async () => {
  await cleanDatabase();
});

test.afterAll(async () => {
  await disconnectPrisma();
});

test.describe('HU-19 Datos de entrega [E2E]', () => {
  test('el modal se abre al hacer clic en "Continuar con la compra"', async ({
    page,
  }) => {
    const user = buildUserData({ correo: 'entrega1@e2e.test.com' });
    const { user: created } = await registerUserViaAPI(user);
    const token = await loginViaAPI(user.correo, user.password);
    const producto = await seedProduct({ nombre: 'Macaron' });

    await setAuthToken(page, token);
    // Decodifico el sub del token para armar la clave del carrito.
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
    void created; // silencia linter

    await page.goto('/carrito');

    await page
      .getByRole('button', { name: /continuar con la compra/i })
      .click();

    // Aparece el diálogo "¿Cómo quieres recibir tu pedido?"
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: /¿cómo quieres recibir tu pedido?/i,
      }),
    ).toBeVisible();
  });

  test('DOMICILIO sin aceptar el aviso del pago muestra error', async ({
    page,
  }) => {
    const user = buildUserData({ correo: 'entrega2@e2e.test.com' });
    await registerUserViaAPI(user);
    const token = await loginViaAPI(user.correo, user.password);
    const producto = await seedProduct();

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

    await page.goto('/carrito');
    await page
      .getByRole('button', { name: /continuar con la compra/i })
      .click();

    // Selecciono DOMICILIO pero NO acepto el aviso.
    const dialog = page.getByRole('dialog');
    await dialog
      .getByRole('radio', { name: /envío a domicilio/i })
      .check();

    await dialog.getByRole('button', { name: /^continuar$/i }).click();

    // El frontend muestra el mensaje de error DENTRO del dialog
    // (no en la sección padre ni en el route-announcer de Next).
    await expect(dialog.getByRole('alert')).toContainText(
      /pago del domicilio por whatsapp/i,
    );
  });

  test('la fecha mínima del input es 3 días en el futuro', async ({
    page,
  }) => {
    const user = buildUserData({ correo: 'entrega3@e2e.test.com' });
    await registerUserViaAPI(user);
    const token = await loginViaAPI(user.correo, user.password);
    const producto = await seedProduct();

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

    await page.goto('/carrito');
    await page
      .getByRole('button', { name: /continuar con la compra/i })
      .click();
    await page
      .getByRole('radio', { name: /recogida en tienda/i })
      .check();
    await page.getByRole('button', { name: /^continuar$/i }).click();

    const dateInput = page.locator('input[type="date"]');
    const minAttr = await dateInput.getAttribute('min');
    expect(minAttr).toBe(fechaEnDias(3));
  });

  test('RETIRO con fecha válida intenta crear el pedido', async ({
    page,
  }) => {
    const user = buildUserData({ correo: 'entrega4@e2e.test.com' });
    await registerUserViaAPI(user);
    const token = await loginViaAPI(user.correo, user.password);
    const producto = await seedProduct();

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

    // Interceptamos POST /pedidos para capturar el payload sin depender
    // de que el backend realmente lo acepte (BUG-001 lo rompe).
    const pedidoRequest = page.waitForRequest(
      (req) =>
        req.url().endsWith('/pedidos') && req.method() === 'POST',
    );

    await page.goto('/carrito');
    await page
      .getByRole('button', { name: /continuar con la compra/i })
      .click();
    await page
      .getByRole('radio', { name: /recogida en tienda/i })
      .check();
    await page.getByRole('button', { name: /^continuar$/i }).click();
    await page.locator('input[type="date"]').fill(fechaEnDias(5));
    await page
      .getByRole('button', { name: /confirmar y pagar/i })
      .click();

    const request = await pedidoRequest;
    const body = JSON.parse(request.postData() ?? '{}');

    expect(body.tipoEntrega).toBe('RETIRO');
    expect(body.fechaEsperada).toBe(fechaEnDias(5));
    expect(body.items).toHaveLength(1);
    expect(body.items[0].idProducto).toBe(producto.id);
    expect(body.items[0].cantidad).toBe(1);
  });
});
