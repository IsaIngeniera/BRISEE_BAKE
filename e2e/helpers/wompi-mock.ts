/**
 * Mock de Wompi para tests E2E.
 *
 * ⚠️ LIMITACION CONOCIDA (ver `TRADE-OFFS` abajo):
 *   Este mock intercepta a nivel del NAVEGADOR dos endpoints:
 *     1. `checkout.wompi.co/p/*`  → URL EXTERNA de Wompi
 *     2. `/pedidos/verificar-pago/:id` → ENDPOINT PROPIO del backend
 *
 *   La interceptacion #2 es un trade-off. Lo ideal seria interceptar la
 *   llamada que el BACKEND hace a `sandbox.wompi.co/v1/transactions/*`,
 *   pero Playwright solo puede interceptar trafico del navegador, no del
 *   proceso Node del backend. Como el backend tiene la URL de Wompi
 *   hardcodeada (ver `pedidos.service.ts`), no podemos redirigirla sin
 *   modificar codigo de produccion.
 *
 * QUE SI PROBAMOS con este mock:
 *   - El flujo visual del usuario (clic en comprar → modal → Wompi →
 *     retorno a /finalizar-compra → pantalla de exito o rechazo).
 *   - Que el frontend lea correctamente los parametros de la URL de
 *     retorno y los pase al endpoint propio.
 *   - Que la UI reaccione correctamente a cada estado (APPROVED,
 *     DECLINED, VOIDED, ERROR).
 *
 * QUE NO PROBAMOS (gap de cobertura E2E):
 *   - La ejecucion real del endpoint /pedidos/verificar-pago.
 *   - La actualizacion del pago en BD (estado APROBADO/RECHAZADO).
 *   - El envio real de la notificacion al administrador.
 *   Estas tres cosas SI estan cubiertas por las PRUEBAS DE INTEGRACION
 *   (ver `backend/test/qa-integration/pedidos/verificar-pago.integration.qa-spec.ts`).
 *
 * HALLAZGO QA pendiente:
 *   Recomendacion para el equipo de desarrollo: hacer configurable la
 *   URL base de Wompi mediante una variable de entorno (ej. WOMPI_API_URL).
 *   Eso permitiria levantar un mock HTTP real en los tests E2E y cerrar
 *   el gap de cobertura.
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

  // ---- 1. Intercepta la navegacion al checkout de Wompi ----
  // El frontend hace `window.location.href = wompiUrl` tras crear el
  // pedido. Esa URL es externa (checkout.wompi.co). La interceptamos y,
  // en vez de dejar que el navegador la cargue, redirigimos directamente
  // al redirect-url que Wompi usaria al volver.
  await page.route('https://checkout.wompi.co/p/**', async (route) => {
    const url = new URL(route.request().url());
    const reference = url.searchParams.get('reference') ?? '';
    const rawRedirect = url.searchParams.get('redirect-url') ?? '';
    const redirectUrl = decodeURIComponent(rawRedirect);

    // Wompi anade los parametros `id` y `status` al redirect-url cuando
    // devuelve al usuario. Simulamos ese retorno.
    const separator = redirectUrl.includes('?') ? '&' : '?';
    const finalRedirect = `${redirectUrl}${separator}id=${transactionId}&env=test&status=${options.status}&reference=${reference}`;

    // Como localhost se reemplaza por localtest.me en el backend para que
    // Wompi acepte el redirect, revertimos para que el navegador vuelva
    // al frontend que levanto Playwright.
    const normalized = finalRedirect
      .replace('localtest.me', 'localhost')
      .replace('127.0.0.1.nip.io', 'localhost');

    await route.fulfill({
      status: 302,
      headers: { Location: normalized },
    });
  });

  // ---- 2. Intercepta la verificacion del backend ----
  // ⚠️ TRADE-OFF: este endpoint ES del backend propio. Idealmente
  // interceptariamos la llamada que el backend hace a sandbox.wompi.co,
  // pero Playwright no tiene esa capacidad (solo intercepta el navegador).
  //
  // La consecuencia es que esta linea OMITE probar:
  //   - La actualizacion real del pago en BD
  //   - El envio de notificacion al admin
  // Esos flujos quedan cubiertos a nivel INTEGRACION, no E2E.
  await page.route('**/pedidos/verificar-pago/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: options.status,
        reference: '', // el frontend lo lee del query string, no de aqui
        amount: 0,
      }),
    });
  });
}
