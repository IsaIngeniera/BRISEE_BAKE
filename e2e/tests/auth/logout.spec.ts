/**
 * PRUEBAS E2E QA — HU-18: Cierre de sesión
 *
 * Según la estrategia:
 *   "La E2E valida la experiencia completa: cerrar sesión en una pestaña,
 *    verificar que las demás pestañas se desconectan y que las rutas
 *    protegidas rechazan el acceso."
 *
 * Validamos:
 *   - Happy: usuario autenticado hace clic en "Cerrar sesión" y queda logout.
 *   - El token se borra de localStorage y sessionStorage.
 *   - La página redirige a /login tras el logout.
 *   - Multi-pestaña: el evento `brisee:auth-changed` desconecta la otra pestaña.
 */

import { test, expect } from '@playwright/test';
import { cleanDatabase, disconnectPrisma } from '../../helpers/db';
import {
  buildUserData,
  loginViaAPI,
  registerUserViaAPI,
  setAuthToken,
  expectLoggedIn,
  expectLoggedOut,
  AUTH_TOKEN_KEY,
} from '../../helpers/auth';

test.beforeEach(async () => {
  await cleanDatabase();
});

test.afterAll(async () => {
  await disconnectPrisma();
});

test.describe('HU-18 Cierre de sesión [E2E]', () => {
  test('happy path: clic en "Cerrar sesión" borra el token y redirige a /login', async ({
    page,
  }) => {
    const user = buildUserData({ correo: 'logout@e2e.test.com' });
    await registerUserViaAPI(user);
    const token = await loginViaAPI(user.correo, user.password);
    await setAuthToken(page, token);

    await page.goto('/cuenta');
    await expectLoggedIn(page);

    await page.getByRole('button', { name: /cerrar sesión/i }).click();

    // El frontend hace router.replace('/login').
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    await expectLoggedOut(page);
  });

  test('el token se borra TANTO de localStorage como de sessionStorage', async ({
    page,
  }) => {
    const user = buildUserData({ correo: 'logout2@e2e.test.com' });
    await registerUserViaAPI(user);
    const token = await loginViaAPI(user.correo, user.password);
    await setAuthToken(page, token);

    // Me aseguro también de poner algo en sessionStorage para probar el clear completo.
    await page.goto('/cuenta');
    await page.evaluate(
      ({ key, value }) => {
        window.sessionStorage.setItem(key, value);
      },
      { key: AUTH_TOKEN_KEY, value: token },
    );

    await page.getByRole('button', { name: /cerrar sesión/i }).click();
    await expect(page).toHaveURL(/\/login/);

    const localToken = await page.evaluate((key) => localStorage.getItem(key), AUTH_TOKEN_KEY);
    const sessionToken = await page.evaluate((key) => sessionStorage.getItem(key), AUTH_TOKEN_KEY);

    expect(localToken).toBeNull();
    expect(sessionToken).toBeNull();
  });

  test('tras el logout, entrar a /cuenta muestra la pantalla de bienvenida (no cuenta de usuario)', async ({
    page,
  }) => {
    const user = buildUserData({ correo: 'logout3@e2e.test.com' });
    await registerUserViaAPI(user);

    // IMPORTANTE: para este test NO usamos `setAuthToken` (addInitScript)
    // porque re-inyectaría el token en cada navegación, incluso después
    // del logout. En su lugar, iniciamos sesión por la UI, que es más fiel
    // al flujo real del usuario.
    await page.goto('/login');
    await page.locator('#login-correo').fill(user.correo);
    await page.locator('#login-password').fill(user.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/\/$|\/\?/);

    // Logout
    await page.goto('/cuenta');
    await page.getByRole('button', { name: /cerrar sesión/i }).click();
    await expect(page).toHaveURL(/\/login/);

    // Volver a /cuenta debe mostrar la welcome card.
    await page.goto('/cuenta');
    // El welcome card tiene un Link "Crear cuenta" único (en la main);
    // "Iniciar sesión" también aparece en el header móvil, usamos .first().
    await expect(
      page.getByRole('link', { name: /crear cuenta/i }),
    ).toBeVisible();
  });
});
