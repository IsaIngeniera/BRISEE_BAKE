/**
 * PRUEBAS E2E QA — HU-26: Historial de pedidos
 *
 * Según la estrategia:
 *   "La E2E valida que el cliente solo vea sus pedidos y el admin pueda
 *    cambiar estados desde la UI."
 *
 * Validamos:
 *   - CLIENTE en /cuenta/pedidos ve el estado "aún no tienes pedidos" o
 *     el listado de los suyos (y SOLO los suyos).
 *   - ADMIN en /admin/pedidos ve TODOS los pedidos del sistema.
 *   - El ADMIN puede cambiar el estado de entrega desde el <select>.
 */

import { test, expect } from '@playwright/test';
import {
  cleanDatabase,
  disconnectPrisma,
  getPrisma,
  seedProduct,
} from '../../helpers/db';
import {
  buildUserData,
  loginViaAPI,
  registerUserViaAPI,
  setAuthToken,
} from '../../helpers/auth';

test.beforeEach(async () => {
  await cleanDatabase();
});

test.afterAll(async () => {
  await disconnectPrisma();
});

async function seedAdminUser(correo = 'admin-hist@e2e.test.com'): Promise<{
  correo: string;
  password: string;
}> {
  const bcrypt = (await import('bcrypt')) as unknown as {
    hash: (p: string, s: number) => Promise<string>;
  };
  const password = 'AdminPass123!';
  const hash = await bcrypt.hash(password, 10);
  await getPrisma().usuario.create({
    data: {
      nombre: 'Admin',
      apellido: 'E2E',
      correo,
      password: hash,
      rol: 'ADMIN',
      celular: '3000000000',
      estado: 'ACTIVO',
      fechaNacimiento: new Date('1990-01-01'),
    },
  });
  return { correo, password };
}

test.describe('HU-26 Historial de pedidos [E2E]', () => {
  test('cliente sin pedidos ve el estado "Aún no tienes pedidos"', async ({
    page,
  }) => {
    const user = buildUserData({ correo: 'hist-vacio@e2e.test.com' });
    await registerUserViaAPI(user);
    const token = await loginViaAPI(user.correo, user.password);
    await setAuthToken(page, token);

    await page.goto('/cuenta/pedidos');

    await expect(page.getByRole('heading', { name: /mis pedidos/i })).toBeVisible();
    await expect(page.getByText(/aún no tienes pedidos/i)).toBeVisible();
  });

  test('cliente con pedidos propios ve su listado (y solo el suyo)', async ({
    page,
    request,
  }) => {
    const cliente1 = buildUserData({ correo: 'c1@e2e.test.com' });
    const cliente2 = buildUserData({ correo: 'c2@e2e.test.com' });
    await registerUserViaAPI(cliente1);
    await registerUserViaAPI(cliente2);

    const token1 = await loginViaAPI(cliente1.correo, cliente1.password);
    const token2 = await loginViaAPI(cliente2.correo, cliente2.password);
    const producto = await seedProduct({ nombre: 'Pedido-Visible' });
    const productoOculto = await seedProduct({ nombre: 'Pedido-Ajeno' });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3011';
    const fechaEsperada = new Date();
    fechaEsperada.setDate(fechaEsperada.getDate() + 5);
    const fecha = fechaEsperada.toISOString().slice(0, 10);

    // Pedido del cliente 1 (debe verse)
    const res1 = await request.post(`${apiUrl}/pedidos`, {
      headers: { Authorization: `Bearer ${token1}` },
      data: {
        direccionEntrega: 'A',
        ciudad: 'B',
        tipoEntrega: 'RETIRO',
        fechaEsperada: fecha,
        observacionesEntrega: '',
        items: [{ idProducto: producto.id, cantidad: 1 }],
      },
    });
    // Si la creación falla (ej. por BUG-001), el test aborta aquí con
    // mensaje claro en vez de continuar y fallar luego en la UI con
    // "aún no tienes pedidos", lo que ocultaría la causa real.
    expect(res1.status(), `POST /pedidos (cliente1) devolvio ${res1.status()}: ${await res1.text()}`).toBe(201);

    // Pedido del cliente 2 (NO debe verse en el historial del cliente 1)
    const res2 = await request.post(`${apiUrl}/pedidos`, {
      headers: { Authorization: `Bearer ${token2}` },
      data: {
        direccionEntrega: 'C',
        ciudad: 'D',
        tipoEntrega: 'RETIRO',
        fechaEsperada: fecha,
        observacionesEntrega: '',
        items: [{ idProducto: productoOculto.id, cantidad: 1 }],
      },
    });
    expect(res2.status(), `POST /pedidos (cliente2) devolvio ${res2.status()}: ${await res2.text()}`).toBe(201);

    await setAuthToken(page, token1);
    await page.goto('/cuenta/pedidos');

    await expect(page.getByText('Pedido-Visible', { exact: false })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Pedido-Ajeno');
  });

  test('ADMIN en /admin/pedidos ve TODOS los pedidos del sistema', async ({
    page,
    request,
  }) => {
    const cliente = buildUserData({ correo: 'cli-admin@e2e.test.com' });
    await registerUserViaAPI(cliente);
    const tokenCliente = await loginViaAPI(cliente.correo, cliente.password);
    const producto = await seedProduct({ nombre: 'Producto-Admin-View' });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3011';
    const fechaEsperada = new Date();
    fechaEsperada.setDate(fechaEsperada.getDate() + 5);
    const fecha = fechaEsperada.toISOString().slice(0, 10);

    const createRes = await request.post(`${apiUrl}/pedidos`, {
      headers: { Authorization: `Bearer ${tokenCliente}` },
      data: {
        direccionEntrega: 'Cra 1',
        ciudad: 'Bogotá',
        tipoEntrega: 'ENVIO',
        fechaEsperada: fecha,
        observacionesEntrega: '',
        items: [{ idProducto: producto.id, cantidad: 1 }],
      },
    });
    expect(createRes.status(), `POST /pedidos devolvio ${createRes.status()}: ${await createRes.text()}`).toBe(201);

    const admin = await seedAdminUser('admin-view@e2e.test.com');
    const tokenAdmin = await loginViaAPI(admin.correo, admin.password);
    await setAuthToken(page, tokenAdmin);

    await page.goto('/admin/pedidos');

    await expect(page.getByRole('heading', { name: /administrar pedidos/i })).toBeVisible();
    await expect(page.getByText('Producto-Admin-View', { exact: false })).toBeVisible({ timeout: 10_000 });
    // Y el correo del cliente.
    await expect(page.getByText(cliente.correo)).toBeVisible();
  });

  test('ADMIN puede cambiar el estado de un pedido desde el <select>', async ({
    page,
    request,
  }) => {
    const cliente = buildUserData({ correo: 'cambio-estado@e2e.test.com' });
    await registerUserViaAPI(cliente);
    const tokenCliente = await loginViaAPI(cliente.correo, cliente.password);
    const producto = await seedProduct();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3011';
    const fechaEsperada = new Date();
    fechaEsperada.setDate(fechaEsperada.getDate() + 5);
    const fecha = fechaEsperada.toISOString().slice(0, 10);

    const createRes = await request.post(`${apiUrl}/pedidos`, {
      headers: { Authorization: `Bearer ${tokenCliente}` },
      data: {
        direccionEntrega: 'X',
        ciudad: 'Y',
        tipoEntrega: 'RETIRO',
        fechaEsperada: fecha,
        observacionesEntrega: '',
        items: [{ idProducto: producto.id, cantidad: 1 }],
      },
    });
    expect(createRes.status(), `POST /pedidos devolvio ${createRes.status()}: ${await createRes.text()}`).toBe(201);
    const createBody = (await createRes.json()) as { pedidoId: string };

    const admin = await seedAdminUser('admin-estado@e2e.test.com');
    const tokenAdmin = await loginViaAPI(admin.correo, admin.password);
    await setAuthToken(page, tokenAdmin);

    await page.goto('/admin/pedidos');

    const selectId = `#estado-${createBody.pedidoId}`;

    // Esperamos la respuesta del PATCH en vez de usar un sleep fijo.
    // Un waitForTimeout(N) es fragil: puede fallar en equipos lentos
    // o esperar de mas en equipos rapidos.
    const patchResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/pedidos/${createBody.pedidoId}/estado`) &&
        res.request().method() === 'PATCH',
    );
    await page.locator(selectId).selectOption('PREPARANDO');
    const patchResponse = await patchResponsePromise;
    expect(patchResponse.status()).toBe(200);

    // Verificamos en BD que el estado se persistio realmente.
    const pedidoBd = await getPrisma().pedido.findUnique({
      where: { id: createBody.pedidoId },
    });
    expect(pedidoBd?.estadoEntrega).toBe('PREPARANDO');
  });
});
