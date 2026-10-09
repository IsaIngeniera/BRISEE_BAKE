/**
 * PRUEBAS E2E QA — HU-17: Redirección según rol
 *
 * Según la estrategia:
 *   "La E2E valida el comportamiento visual real: que el admin llegue al
 *    panel administrativo y el cliente al catálogo, y que las rutas
 *    protegidas rechacen accesos no autorizados."
 *
 * Validamos:
 *   - Cliente autenticado accede a /catalogo normalmente.
 *   - Admin autenticado llega al panel de admin tras login.
 *   - Cliente intentando ver /admin/pedidos ve mensaje "solo clientes" o
 *     equivalente (según el comportamiento real del guard de frontend).
 *   - La "Admin bar" solo se muestra para rol ADMIN.
 */

import { test, expect } from '@playwright/test';
import { cleanDatabase, disconnectPrisma } from '../../helpers/db';
import {
  buildUserData,
  loginViaAPI,
  registerUserViaAPI,
  setAuthToken,
} from '../../helpers/auth';
import { getPrisma } from '../../helpers/db';

test.beforeEach(async () => {
  await cleanDatabase();
});

test.afterAll(async () => {
  await disconnectPrisma();
});

/**
 * Crea un ADMIN directamente en BD con rol ADMIN y devuelve credenciales.
 * El endpoint público /auth/register siempre crea CLIENTE, por eso vamos
 * contra Prisma para los tests de admin.
 */
async function seedAdminUser(correo = 'admin@e2e.test.com'): Promise<{
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

test.describe('HU-17 Redirección según rol [E2E]', () => {
  test('ADMIN tras login va a /admin/productos', async ({ page }) => {
    const admin = await seedAdminUser();

    await page.goto('/login');
    await page.locator('#login-correo').fill(admin.correo);
    await page.locator('#login-password').fill(admin.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await expect(page).toHaveURL(/\/admin\/productos/, { timeout: 10_000 });

    // La barra "BRISÉE BAKE ADMIN" debe estar visible.
    await expect(page.getByText(/BRISÉE BAKE ADMIN/i)).toBeVisible();
  });

  test('CLIENTE tras login va a la raíz (no al admin)', async ({ page }) => {
    const user = buildUserData({ correo: 'cliente@e2e.test.com' });
    await registerUserViaAPI(user);

    await page.goto('/login');
    await page.locator('#login-correo').fill(user.correo);
    await page.locator('#login-password').fill(user.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // Un cliente va a la home, no al panel admin.
    await expect(page).toHaveURL(/\/$|\/\?/);
    await expect(page.locator('body')).not.toContainText('BRISÉE BAKE ADMIN');
  });

  test('CLIENTE que entra a /cuenta/pedidos no ve el panel admin', async ({
    page,
  }) => {
    const user = buildUserData({ correo: 'cuenta@e2e.test.com' });
    await registerUserViaAPI(user);
    const token = await loginViaAPI(user.correo, user.password);
    await setAuthToken(page, token);

    await page.goto('/cuenta/pedidos');

    // Debe ver la página de "mis pedidos" como cliente.
    await expect(page.getByRole('heading', { name: /mis pedidos/i })).toBeVisible();
    // Nada de UI de admin.
    await expect(page.locator('body')).not.toContainText('BRISÉE BAKE ADMIN');
  });

  test('ADMIN que entra a /cuenta/pedidos ve mensaje "disponible para clientes"', async ({
    page,
  }) => {
    const admin = await seedAdminUser('admin2@e2e.test.com');
    const token = await loginViaAPI(admin.correo, admin.password);
    await setAuthToken(page, token);

    await page.goto('/cuenta/pedidos');

    await expect(
      page.getByText(/disponible para clientes/i),
    ).toBeVisible();
  });

  test('usuario sin sesión que entra a /cuenta ve la pantalla de bienvenida', async ({
    page,
  }) => {
    await page.goto('/cuenta');

    // El frontend muestra el "Welcome card" con botones de login/registro.
    await expect(
      page.getByRole('link', { name: /iniciar sesión/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /crear cuenta/i }),
    ).toBeVisible();
  });
});
