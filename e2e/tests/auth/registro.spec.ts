/**
 * PRUEBAS E2E QA — HU-13: Registro de nuevo usuario
 *
 * Según la estrategia:
 *   "El registro es la puerta de entrada del cliente, se requiere validar
 *    la experiencia completa desde el formulario web hasta la creación
 *    de la cuenta y redirección al catálogo."
 *
 * Flujo que validamos aquí:
 *   1. Usuario navega a /registro.
 *   2. Rellena el formulario completo.
 *   3. Hace clic en "Crear cuenta".
 *   4. El frontend llama a POST /auth/register → backend crea el usuario
 *      en la BD de E2E y responde con un JWT.
 *   5. El frontend guarda el token en localStorage y navega a /cuenta.
 */

import { test, expect } from '@playwright/test';
import { cleanDatabase, disconnectPrisma } from '../../helpers/db';
import { buildUserData, expectLoggedIn } from '../../helpers/auth';

test.beforeEach(async () => {
  await cleanDatabase();
});

test.afterAll(async () => {
  await disconnectPrisma();
});

test.describe('HU-13 Registro [E2E]', () => {
  test('happy path: usuario completa el formulario y queda autenticado', async ({
    page,
  }) => {
    const user = buildUserData();

    await page.goto('/registro');

    // Rellenamos campos usando los ids reales del formulario.
    await page.locator('#registro-nombre').fill(user.nombre);
    await page.locator('#registro-apellido').fill(user.apellido);
    await page.locator('#registro-celular').fill(user.celular);
    await page.locator('#registro-fecha').fill(user.fechaNacimiento);
    await page.locator('#registro-correo').fill(user.correo);
    await page.locator('#registro-password').fill(user.password);
    await page.locator('#registro-confirmar').fill(user.password);

    await page.getByRole('button', { name: /crear cuenta/i }).click();

    // Tras un registro exitoso, el frontend hace router.replace('/cuenta').
    await expect(page).toHaveURL(/\/cuenta$/, { timeout: 10_000 });

    // Y el token queda guardado en localStorage.
    await expectLoggedIn(page);

    // El correo del usuario debe verse en la página de cuenta.
    // `.first()` porque /cuenta renderiza el correo en 2 lugares (sidebar y detalles).
    await expect(page.getByText(user.correo).first()).toBeVisible();
  });

  test('error: contraseñas que no coinciden muestran mensaje de validación', async ({
    page,
  }) => {
    const user = buildUserData();

    await page.goto('/registro');

    await page.locator('#registro-nombre').fill(user.nombre);
    await page.locator('#registro-apellido').fill(user.apellido);
    await page.locator('#registro-celular').fill(user.celular);
    await page.locator('#registro-fecha').fill(user.fechaNacimiento);
    await page.locator('#registro-correo').fill(user.correo);
    await page.locator('#registro-password').fill('Password123!');
    await page.locator('#registro-confirmar').fill('OtroPassword999!');

    await page.getByRole('button', { name: /crear cuenta/i }).click();

    // El frontend muestra el error como un párrafo con role="alert".
    // Nota: Next.js inyecta un `<div id="__next-route-announcer__" role="alert">`
    // invisible para accesibilidad en todas las páginas; usamos `.first()`
    // para quedarnos con la alerta visible del formulario.
    await expect(page.getByRole('alert').first()).toContainText(
      /contraseñas no coinciden/i,
    );

    // La URL NO debe cambiar: seguimos en /registro.
    await expect(page).toHaveURL(/\/registro/);
  });

  test('error: correo duplicado rechaza el registro con mensaje del backend', async ({
    page,
    request,
  }) => {
    const user = buildUserData({ correo: 'duplicado@e2e.test.com' });
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3011';

    // Primero creamos el usuario con el mismo correo via API (así
    // garantizamos que exista antes de abrir el navegador).
    const firstRegister = await request.post(`${apiUrl}/auth/register`, {
      data: user,
    });
    expect(firstRegister.ok()).toBeTruthy();

    // Ahora el intento del navegador debe fallar.
    await page.goto('/registro');

    await page.locator('#registro-nombre').fill('Otro');
    await page.locator('#registro-apellido').fill('Usuario');
    await page.locator('#registro-celular').fill('3109999999');
    await page.locator('#registro-fecha').fill('1995-03-10');
    await page.locator('#registro-correo').fill(user.correo);
    await page.locator('#registro-password').fill('OtraPassword123!');
    await page.locator('#registro-confirmar').fill('OtraPassword123!');

    await page.getByRole('button', { name: /crear cuenta/i }).click();

    // El backend responde con "Este correo ya está registrado".
    // `.first()` para evitar el route-announcer de Next (ver test anterior).
    await expect(page.getByRole('alert').first()).toContainText(
      /ya está registrado/i,
    );

    // No debe navegar a /cuenta.
    await expect(page).toHaveURL(/\/registro/);
  });
});
