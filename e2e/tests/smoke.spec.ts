/**
 * Smoke test: verifica que la infraestructura E2E arranca correctamente.
 *
 * Si este test falla, revisar en orden:
 *   1. ¿Postgres está corriendo? (`docker ps | grep postgres`)
 *   2. ¿Existe la BD brisee_bake_e2e con migraciones aplicadas?
 *   3. ¿El puerto 3001 (backend) está libre?
 *   4. ¿El puerto 3000 (frontend) está libre?
 *   5. ¿El `.env.e2e` existe en /e2e/?
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke [E2E]', () => {
  test('la página principal del frontend carga correctamente', async ({ page }) => {
    await page.goto('/');
    // El home de Next.js debe responder con un título o algún landmark.
    // Usamos un locator ancho para que el test sea estable aunque el
    // contenido evolucione.
    await expect(page.locator('body')).toBeVisible();
  });

  test('el backend responde en /api o en una ruta pública', async ({ request }) => {
    // GET /products es público y lista todos los productos. Si Nest está
    // arriba, debe responder 200 con un array (posiblemente vacío).
    const response = await request.get(
      // Fallback a 3011 porque esa es la URL del backend que levanta
      // Playwright en modo E2E (NO 3001, que es el backend de dev).
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3011'}/products`,
    );
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
