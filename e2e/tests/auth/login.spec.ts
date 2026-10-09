/**
 * PRUEBAS E2E QA — HU-15: Inicio de sesión tradicional
 *
 * Según la estrategia:
 *   "La E2E valida que el usuario pueda iniciar sesión desde la UI y que
 *    la sesión se mantenga correctamente al navegar."
 *
 * Validamos:
 *   - Happy: cliente puede loguearse y queda autenticado.
 *   - Error: credenciales inválidas muestran mensaje genérico (seguridad).
 *   - Error: campos vacíos activan validación local.
 *   - Persistencia: la sesión se mantiene al navegar entre páginas.
 */

import { test, expect } from '@playwright/test';
import { cleanDatabase, disconnectPrisma } from '../../helpers/db';
import {
  buildUserData,
  registerUserViaAPI,
  expectLoggedIn,
} from '../../helpers/auth';

test.beforeEach(async () => {
  await cleanDatabase();
});

test.afterAll(async () => {
  await disconnectPrisma();
});

test.describe('HU-15 Login [E2E]', () => {
  test('happy path: cliente inicia sesión y es redirigido al home', async ({
    page,
  }) => {
    const user = buildUserData({ correo: 'login-ok@e2e.test.com' });
    await registerUserViaAPI(user);

    await page.goto('/login');

    await page.locator('#login-correo').fill(user.correo);
    await page.locator('#login-password').fill(user.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // Un CLIENTE autenticado va a la raíz (/).
    await expect(page).toHaveURL(/\/$|\/\?/, { timeout: 10_000 });
    await expectLoggedIn(page);
  });

  test('persistencia: la sesión sigue activa al navegar a otra página', async ({
    page,
  }) => {
    const user = buildUserData({ correo: 'persist@e2e.test.com' });
    await registerUserViaAPI(user);

    await page.goto('/login');
    await page.locator('#login-correo').fill(user.correo);
    await page.locator('#login-password').fill(user.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/\/$|\/\?/);

    // Navego a otra página: la sesión debe seguir activa.
    await page.goto('/cuenta');
    await expectLoggedIn(page);
    // `.first()` porque /cuenta muestra el correo en el sidebar y en los
    // detalles — ambos son el mismo dato, nos basta con uno.
    await expect(page.getByText(user.correo).first()).toBeVisible();
  });

  test('error: credenciales inválidas muestran mensaje genérico', async ({
    page,
  }) => {
    await page.goto('/login');

    await page.locator('#login-correo').fill('nadie@test.com');
    await page.locator('#login-password').fill('passwordIncorrecta123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // Seguridad: el mensaje NO revela si el usuario existe o no.
    // `.first()` para evitar el route-announcer invisible de Next.
    await expect(page.getByRole('alert').first()).toContainText(
      /nombre de usuario y\/o contraseñas incorrectas/i,
    );
    await expect(page).toHaveURL(/\/login/);
  });

  test('error: campos vacíos activan validación local', async ({ page }) => {
    await page.goto('/login');

    // Intento enviar sin rellenar nada.
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // El frontend muestra errores inline bajo cada campo.
    await expect(page.getByText(/ingresa tu correo/i)).toBeVisible();
  });
});
