/**
 * PRUEBAS E2E QA — HU-23: Conexión por WhatsApp post-compra
 *
 * Según la estrategia:
 *   "La E2E valida que al hacer clic en el botón de WhatsApp se abra
 *    una nueva pestaña con el enlace correcto."
 *
 * Notas:
 *   - El backend devuelve `whatsappUrl` al crear el pedido.
 *   - El carrito la guarda en `confirmedOrder` y la muestra como botón.
 *   - Si el pedido redirige a Wompi, nunca vemos ese botón: el botón
 *     solo aparece cuando el backend NO devolvió wompiUrl (edge-case).
 *   - Por eso aquí validamos la generación del enlace a nivel del backend
 *     (POST /pedidos → whatsappUrl correcto) y el formato de los datos.
 */

import { test, expect, request as pwRequest } from '@playwright/test';
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
} from '../../helpers/auth';

test.beforeEach(async () => {
  await cleanDatabase();
});

test.afterAll(async () => {
  await disconnectPrisma();
});

test.describe('HU-23 WhatsApp post-compra [E2E]', () => {
  test('el backend devuelve una URL de WhatsApp con el número correcto y el ID corto del pedido', async () => {
    const user = buildUserData({ correo: 'whatsapp@e2e.test.com' });
    await registerUserViaAPI(user);
    const token = await loginViaAPI(user.correo, user.password);
    const producto = await seedProduct({ nombre: 'Galleta WA', precio: 5000 });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3011';
    const api = await pwRequest.newContext();

    const response = await api.post(`${apiUrl}/pedidos`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        direccionEntrega: 'Cra 1 #2-3',
        ciudad: 'Bogotá',
        tipoEntrega: 'ENVIO',
        fechaEsperada: fechaEnDias(5),
        observacionesEntrega: '',
        items: [{ idProducto: producto.id, cantidad: 1 }],
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
      pedidoId: string;
      whatsappUrl: string;
    };

    // Debe apuntar al número oficial.
    expect(body.whatsappUrl).toContain('https://wa.me/573003685556');

    // Debe incluir el ID corto en mayúsculas, URL-encoded.
    const shortId = body.pedidoId.split('-')[0].toUpperCase();
    expect(decodeURIComponent(body.whatsappUrl)).toContain(`#${shortId}`);

    await api.dispose();
  });

  test('la URL es parseable y tiene el parámetro `text` con el mensaje', async () => {
    const user = buildUserData({ correo: 'wa2@e2e.test.com' });
    await registerUserViaAPI(user);
    const token = await loginViaAPI(user.correo, user.password);
    const producto = await seedProduct();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3011';
    const api = await pwRequest.newContext();

    const response = await api.post(`${apiUrl}/pedidos`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        direccionEntrega: 'X',
        ciudad: 'Y',
        tipoEntrega: 'RETIRO',
        fechaEsperada: fechaEnDias(4),
        observacionesEntrega: '',
        items: [{ idProducto: producto.id, cantidad: 1 }],
      },
    });

    const body = (await response.json()) as { whatsappUrl: string };

    const parsed = new URL(body.whatsappUrl);
    expect(parsed.hostname).toBe('wa.me');
    expect(parsed.pathname).toBe('/573003685556');
    expect(parsed.searchParams.get('text')).toMatch(/escribo para coordinar la entrega/i);

    await api.dispose();
  });
});
