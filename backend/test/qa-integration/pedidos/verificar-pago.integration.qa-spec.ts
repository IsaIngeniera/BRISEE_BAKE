/* eslint-disable */
/**
 * PRUEBAS DE INTEGRACIÓN QA — Verificar pago
 *
 * Cubre tres historias de usuario que convergen en el endpoint
 * GET /pedidos/verificar-pago/:transactionId:
 *
 *   - HU-21: Confirmación de pago exitoso
 *       → status APPROVED de Wompi actualiza el pago a APROBADO en BD y
 *         dispara la notificación al administrador.
 *
 *   - HU-22: Manejo de pago rechazado
 *       → DECLINED → RECHAZADO, ERROR → RECHAZADO, VOIDED → CANCELADO.
 *         En TODOS los flujos de rechazo NO debe enviarse correo.
 *
 *   - HU-24: Notificación de nueva orden
 *       → el correo tiene formato correcto: destinatario, asunto con ID
 *         corto, HTML con productos y datos de entrega.
 *
 * Mocks aplicados:
 *   - `fetch` global: simula la respuesta de la API de Wompi.
 *   - `nodemailer.createTransport`: captura los parámetros del correo
 *     sin enviarlo realmente.
 */

import request from 'supertest';
import * as nodemailer from 'nodemailer';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Pedido } from '@prisma/client';
import { PrismaService } from '../../../src/prisma.service';
import { createTestApp } from '../helpers/test-app';
import { cleanDatabase } from '../helpers/test-db';
import { seedUser, seedProduct } from '../helpers/test-fixtures';

// Mock del transporte de nodemailer. jest.mock se "hoistea" al top del
// archivo antes de los imports, por eso no se puede referenciar nada
// externo dentro de la fábrica.
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

/**
 * Espera a que las promesas pendientes de la event loop se resuelvan.
 * Lo necesitamos porque `sendAdminNotification` se dispara en modo
 * fire-and-forget desde el service (`.catch(console.error)` sin await).
 */
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('Verificar pago [Integración] (HU-21, HU-22, HU-24)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let teardown: () => Promise<void>;

  // Spies globales (se setean en beforeEach para resetear entre tests)
  let fetchSpy: jest.SpyInstance;
  let sendMailMock: jest.Mock;

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
    prisma = ctx.prisma;
    teardown = ctx.teardown;
    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    await teardown();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);

    // Mock del transporte: devuelve un objeto con sendMail como jest.fn.
    sendMailMock = jest.fn().mockResolvedValue({ messageId: 'mock-id' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    // Spy sobre fetch (lo definimos por test según el escenario).
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Crea en BD un pedido en PENDIENTE para que `verificarPagoWompi`
   * tenga algo que actualizar. Devuelve el pedido para que el test
   * pueda consultar su id.
   */
  async function seedPedidoPendiente(): Promise<Pedido> {
    const cliente = await seedUser(prisma, jwt, {
      nombre: 'Laura',
      apellido: 'Ramírez',
      correo: `cliente-${Date.now()}@test.com`,
    });
    const producto = await seedProduct(prisma, {
      nombre: 'Galleta de Chocolate',
      precio: 8000,
    });

    const pedido = await prisma.pedido.create({
      data: {
        idCliente: cliente.id,
        estadoEntrega: 'PENDIENTE',
        total: 16000,
        fechaEsperada: new Date(Date.now() + 5 * 86400000),
        direccionEntrega: 'Cra 15 #45-30',
        ciudad: 'Bogotá',
        tipoEntrega: 'ENVIO',
        observacionesEntrega: 'Casa roja',
      },
    });

    await prisma.pedidoProducto.create({
      data: {
        idPedido: pedido.id,
        idProducto: producto.id,
        cantidad: 2,
        precioUnitario: 8000,
      },
    });

    await prisma.pago.create({
      data: {
        idPedido: pedido.id,
        estado: 'PENDIENTE',
        metodo: 'WOMPI',
        total: 16000,
      },
    });

    return pedido;
  }

  /**
   * Factory para mockear la respuesta de la API de Wompi.
   */
  function mockWompiResponse(args: {
    status: 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED' | 'PENDING';
    reference: string;
    amountInCents?: number;
  }): void {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          status: args.status,
          reference: args.reference,
          amount_in_cents: args.amountInCents ?? 1600000,
        },
      }),
    });
  }

  // ==============================================================
  // HU-21: PAGO APROBADO
  // ==============================================================
  describe('HU-21: Pago aprobado', () => {
    it('APPROVED debe actualizar el pago a APROBADO y disparar la notificación', async () => {
      const pedido = await seedPedidoPendiente();
      mockWompiResponse({ status: 'APPROVED', reference: pedido.id });

      const response = await request(app.getHttpServer())
        .get('/pedidos/verificar-pago/trx-approved-123')
        .expect(200);

      // 1. Respuesta HTTP correcta
      expect(response.body).toMatchObject({
        status: 'APPROVED',
        reference: pedido.id,
      });

      // 2. BD actualizada: pago APROBADO con transactionId guardado
      const pago = await prisma.pago.findUnique({
        where: { idPedido: pedido.id },
      });
      expect(pago!.estado).toBe('APROBADO');
      expect(pago!.transaccionId).toBe('trx-approved-123');

      // 3. Notificación disparada (fire-and-forget → esperamos un tick)
      await flushPromises();
      await flushPromises();
      expect(sendMailMock).toHaveBeenCalledTimes(1);
    });

    it('debe devolver status, reference y amount en pesos (no centavos)', async () => {
      const pedido = await seedPedidoPendiente();
      mockWompiResponse({
        status: 'APPROVED',
        reference: pedido.id,
        amountInCents: 2500000,
      });

      const response = await request(app.getHttpServer())
        .get('/pedidos/verificar-pago/trx-xyz')
        .expect(200);

      expect(response.body.amount).toBe(25000); // 2500000 / 100
    });
  });

  // ==============================================================
  // HU-22: PAGO RECHAZADO / CANCELADO
  // ==============================================================
  describe('HU-22: Pago rechazado o cancelado', () => {
    it('DECLINED debe actualizar a RECHAZADO y NO enviar notificación', async () => {
      const pedido = await seedPedidoPendiente();
      mockWompiResponse({ status: 'DECLINED', reference: pedido.id });

      await request(app.getHttpServer())
        .get('/pedidos/verificar-pago/trx-declined')
        .expect(200);

      const pago = await prisma.pago.findUnique({
        where: { idPedido: pedido.id },
      });
      expect(pago!.estado).toBe('RECHAZADO');
      expect(pago!.transaccionId).toBe('trx-declined');

      // Esperamos un tick para asegurar que el admin NO reciba correo.
      await flushPromises();
      await flushPromises();
      expect(sendMailMock).not.toHaveBeenCalled();
    });

    it('ERROR debe actualizar a RECHAZADO y NO enviar notificación', async () => {
      const pedido = await seedPedidoPendiente();
      mockWompiResponse({ status: 'ERROR', reference: pedido.id });

      await request(app.getHttpServer())
        .get('/pedidos/verificar-pago/trx-error')
        .expect(200);

      const pago = await prisma.pago.findUnique({
        where: { idPedido: pedido.id },
      });
      expect(pago!.estado).toBe('RECHAZADO');

      await flushPromises();
      await flushPromises();
      expect(sendMailMock).not.toHaveBeenCalled();
    });

    it('VOIDED debe actualizar a CANCELADO y NO enviar notificación', async () => {
      const pedido = await seedPedidoPendiente();
      mockWompiResponse({ status: 'VOIDED', reference: pedido.id });

      await request(app.getHttpServer())
        .get('/pedidos/verificar-pago/trx-voided')
        .expect(200);

      const pago = await prisma.pago.findUnique({
        where: { idPedido: pedido.id },
      });
      expect(pago!.estado).toBe('CANCELADO');

      await flushPromises();
      await flushPromises();
      expect(sendMailMock).not.toHaveBeenCalled();
    });
  });

  // ==============================================================
  // HU-24: FORMATO DEL CORREO
  // ==============================================================
  describe('HU-24: Notificación al admin', () => {
    it('el correo debe tener destinatario, asunto y HTML correctos', async () => {
      const pedido = await seedPedidoPendiente();
      mockWompiResponse({ status: 'APPROVED', reference: pedido.id });

      await request(app.getHttpServer())
        .get('/pedidos/verificar-pago/trx-mail')
        .expect(200);

      await flushPromises();
      await flushPromises();

      expect(sendMailMock).toHaveBeenCalledTimes(1);
      const mailArgs = sendMailMock.mock.calls[0][0] as {
        from: string;
        to: string;
        subject: string;
        html: string;
      };

      // 1. Destinatario = ADMIN_EMAIL (de .env.test)
      expect(mailArgs.to).toBe('admin-test@briseebake.com');

      // 2. Asunto incluye el ID corto en mayúsculas
      const shortId = pedido.id.split('-')[0].toUpperCase();
      expect(mailArgs.subject).toContain(shortId);
      expect(mailArgs.subject).toContain('Nuevo Pago');

      // 3. HTML contiene datos de entrega (de HU-19)
      expect(mailArgs.html).toContain('Cra 15 #45-30');
      expect(mailArgs.html).toContain('Bogotá');
      expect(mailArgs.html).toContain('ENVIO');
      expect(mailArgs.html).toContain('Casa roja');

      // 4. HTML contiene el nombre del cliente
      expect(mailArgs.html).toContain('Laura');
      expect(mailArgs.html).toContain('Ramírez');

      // 5. HTML contiene al menos un producto con cantidad y precio
      expect(mailArgs.html).toContain('Galleta de Chocolate');
      expect(mailArgs.html).toContain('2x');
    });

    it('createTransport debe recibir las credenciales de EMAIL_USER/EMAIL_PASS', async () => {
      const pedido = await seedPedidoPendiente();
      mockWompiResponse({ status: 'APPROVED', reference: pedido.id });

      await request(app.getHttpServer())
        .get('/pedidos/verificar-pago/trx-cfg')
        .expect(200);

      await flushPromises();
      await flushPromises();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'gmail',
          auth: expect.objectContaining({
            user: 'test-user@gmail.com',
            pass: 'test-password',
          }),
        }),
      );
    });
  });
});
