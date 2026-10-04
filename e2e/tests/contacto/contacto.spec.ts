/**
 * PRUEBAS E2E QA — HU-27: Página de contacto
 *
 * Según la estrategia:
 *   "La E2E valida la experiencia completa del usuario: navegar a
 *    /contacto, visualizar el mapa, completar y enviar el formulario."
 *
 * Nota de implementación:
 *   El Footer de la app también muestra información de contacto y un
 *   mapa, así que todos los selectores viven dentro del `<main>` para
 *   evitar colisiones con el footer. Esto respeta el modo strict de
 *   Playwright, que exige que un locator matchee a UN elemento único.
 */

import { test, expect } from '@playwright/test';

test.describe('HU-27 Página de contacto [E2E]', () => {
  test('la información de contacto está visible', async ({ page }) => {
    await page.goto('/contacto');

    // Scopeado al main para no colisionar con el footer, que también
    // tiene "Contacto" como título.
    const main = page.locator('main').first();

    await expect(
      main.getByRole('heading', { name: /^contacto$/i }),
    ).toBeVisible();

    // Datos de la tienda (dentro de main).
    await expect(main.getByText(/Medellín/i).first()).toBeVisible();
    await expect(main.getByText(/briseebake@gmail\.com/i).first()).toBeVisible();
    await expect(main.getByText(/\+57 300 3685556/i).first()).toBeVisible();
  });

  test('el mapa de Google Maps está embebido', async ({ page }) => {
    await page.goto('/contacto');

    // Hay 2 iframes con el mismo título (main + footer); el relevante
    // para HU-27 es el del main.
    const main = page.locator('main').first();
    const iframe = main.locator('iframe[title="Ubicación de Brisée Bake"]');

    await expect(iframe).toBeAttached();

    const src = await iframe.getAttribute('src');
    expect(src).toContain('google.com/maps/embed');
  });

  test('el formulario rechaza envíos vacíos (HTML5 required)', async ({
    page,
  }) => {
    await page.goto('/contacto');

    const main = page.locator('main').first();

    await main
      .getByRole('button', { name: /enviar mensaje/i })
      .click();

    // Al dejar los campos vacíos, HTML5 bloquea el submit. El input de
    // nombre debe quedar como :invalid.
    const nombreInput = main.locator('input[type="text"]').first();
    const isInvalid = await nombreInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid,
    );
    expect(isInvalid).toBe(true);

    // El mensaje de confirmación NO debe aparecer.
    await expect(
      main.getByText(/¡Gracias! Tu mensaje fue registrado/i),
    ).not.toBeVisible();
  });

  test('happy path: enviar un mensaje válido muestra confirmación', async ({
    page,
  }) => {
    await page.goto('/contacto');

    const main = page.locator('main').first();

    await main
      .locator('input[type="text"]')
      .first()
      .fill('Samuel QA');
    await main
      .locator('input[type="email"]')
      .fill('qa@brisee.test');
    await main
      .locator('textarea')
      .fill('Mensaje de prueba E2E del formulario de contacto.');

    await main
      .getByRole('button', { name: /enviar mensaje/i })
      .click();

    // El frontend muestra el status "¡Gracias!" (role="status").
    await expect(main.getByRole('status')).toContainText(
      /¡Gracias! Tu mensaje fue registrado/i,
    );

    // Y los campos se limpian.
    await expect(main.locator('input[type="text"]').first()).toHaveValue('');
    await expect(main.locator('input[type="email"]')).toHaveValue('');
  });
});
