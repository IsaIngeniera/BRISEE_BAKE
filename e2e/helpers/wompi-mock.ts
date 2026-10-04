/**
 * Mock de Wompi para tests E2E.
 *
 * Problema: el flujo real redirige al checkout de Wompi (una URL externa
 * que no controlamos), el usuario paga con una tarjeta de prueba y Wompi
 * nos redirige de vuelta. En E2E no podemos interactuar con la UI de
 * Wompi, así que interceptamos a nivel de red.
 *
 * Estrategia:
 *   1. Interceptamos la navegación a `checkout.wompi.co/p/*` y la
 *      redirigimos directamente al `redirect-url` que el backend arma
 *      con los parámetros que simulan un retorno de Wompi.
 *   2. Interceptamos la llamada del frontend a `/pedidos/verificar-pago/:id`
 *      (que el backend a su vez hace a `sandbox.wompi.co`) y devolvemos
 *      la respuesta mockeada que queramos (APPROVED, DECLINED, etc.).
 *
 * Así el test controla el "pago" sin depender de la red externa.
 */

import { Page } from '@playwright/test';

export type WompiStatus = 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';

interface MockWompiOptions {
  status: WompiStatus;
  /**
   * Si se provee, se usa como transactionId en el mock. Si no, se genera
   * uno con timestamp para evitar colisiones.
   */
  transactionId?: string;
}

/**
 * Configura TODAS las interceptaciones necesarias en una sola llamada.
 * Debe invocarse ANTES de navegar al carrito/checkout.
 */
export async function mockWompi(
  page: Page,
  options: MockWompiOptions,
): Promise<void> {
  const transactionId =
    options.transactionId ?? `trx-mock-${Date.now()}`;

  // ---- 1. Intercepta la navegación al checkout de Wompi ----
  // El frontend hace `window.location.href = wompiUrl` tras crear el
  // pedido. Esa URL es externa (checkout.wompi.co). La interceptamos y,
  // en vez de dejar que el navegador la cargue, redirigimos directamente
  // al redirect-url que Wompi usaría al volver.
  await page.route('https://checkout.wompi.co/p/**', async (route) => {
    const url = new URL(route.request().url());
    const reference = url.searchParams.get('reference') ?? '';
    const rawRedirect = url.searchParams.get('redirect-url') ?? '';
    const redirectUrl = decodeURIComponent(rawRedirect);

    // Wompi añade los parámetros `id` y `status` al redirect-url cuando
    // devuelve al usuario. Simulamos ese retorno.
    const separator = redirectUrl.includes('?') ? '&' : '?';
    const finalRedirect = `${redirectUrl}${separator}id=${transactionId}&env=test&status=${options.status}&reference=${reference}`;

    // Como localhost se reemplaza por localtest.me en el backend para que
    // Wompi acepte el redirect, revertimos para que el navegador vuelva
    // al frontend que levantó Playwright.
    const normalized = finalRedirect
      .replace('localtest.me', 'localhost')
      .replace('127.0.0.1.nip.io', 'localhost');

    await route.fulfill({
      status: 302,
      headers: { Location: normalized },
    });
  });

  // ---- 2. Intercepta la verificación en el backend ----
  // El frontend, al volver de Wompi, llama a GET /pedidos/verificar-pago/:id
  // El backend internamente hace fetch a sandbox.wompi.co.
  //
  // Opción A (más clean): interceptar el fetch del backend a sandbox.wompi.co
  //   → NO funciona, Playwright solo intercepta pedidos del navegador.
  //
  // Opción B (usada aquí): interceptar la respuesta del backend al frontend.
  //   Reemplazamos la respuesta de /pedidos/verificar-pago/:id con la
  //   que queremos para controlar el flujo.
  await page.route('**/pedidos/verificar-pago/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: options.status,
        reference: '', // el frontend lo lee del query string, no de aquí
        amount: 0,
      }),
    });
  });
}
