/* eslint-disable */
/**
 * PRUEBAS DE INTEGRACIÓN QA — Crear pedido
 *
 * Cubre tres historias de usuario que se entrelazan en el mismo endpoint
 * POST /pedidos:
 *
 *   - HU-19: Ingreso de datos de entrega
 *       → los datos (dirección, ciudad, tipo, observaciones, fecha) se
 *         persisten correctamente en la tabla `pedidos`.
 *
 *   - HU-20: Redirección a la pasarela de pagos
 *       → al crear el pedido, el controlador devuelve una URL de Wompi
 *         con todos los parámetros correctos: public_key, amount en
 *         centavos, reference, firma SHA-256 y redirect-url.
 *
 *   - HU-25: Registro de la orden (atomicidad)
 *       → el `$transaction` de Prisma debe crear `pedido`, `pedidosProducto`
 *         y `pago` de forma atómica. Si algo falla, nada queda a medias.
 */

import request from 'supertest';
import { createHash } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../src/prisma.service';
import { createTestApp } from '../helpers/test-app';
import { cleanDatabase } from '../helpers/test-db';
import { seedUser, seedProduct, fechaEnDias } from '../helpers/test-fixtures';
import { EstadoProducto } from '@prisma/client';

describe('Crear pedido [Integración] (HU-19, HU-20, HU-25)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let teardown: () => Promise<void>;

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
  });

  // ==============================================================
  // HU-19: INGRESO DE DATOS DE ENTREGA
  // ==============================================================
  describe('HU-19: Datos de entrega', () => {
    it('debe persistir todos los datos de entrega en la BD', async () => {
      const cliente = await seedUser(prisma, jwt);
      const producto = await seedProduct(prisma, { precio: 5000 });

      const dto = {
        direccionEntrega: 'Cra 7 #70-20',
        ciudad: 'Bogotá',
        tipoEntrega: 'ENVIO',
        observacionesEntrega: 'Dejar en portería',
        fechaEsperada: fechaEnDias(5),
        items: [{ idProducto: producto.id, cantidad: 2 }],
      };

      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${cliente.token}`)
        .send(dto)
        .expect(201);

      const pedidoEnBd = await prisma.pedido.findUnique({
        where: { id: response.body.pedidoId },
      });

      expect(pedidoEnBd).not.toBeNull();
      expect(pedidoEnBd!.direccionEntrega).toBe(dto.direccionEntrega);
      expect(pedidoEnBd!.ciudad).toBe(dto.ciudad);
      expect(pedidoEnBd!.tipoEntrega).toBe('ENVIO');
      expect(pedidoEnBd!.observacionesEntrega).toBe(dto.observacionesEntrega);
      expect(pedidoEnBd!.idCliente).toBe(cliente.id);
      expect(pedidoEnBd!.estadoEntrega).toBe('PENDIENTE');
    });

    it('debe aceptar un pedido tipo RETIRO con observaciones vacías', async () => {
      const cliente = await seedUser(prisma, jwt);
      const producto = await seedProduct(prisma, { precio: 3000 });

      const dto = {
        direccionEntrega: 'N/A',
        ciudad: 'Medellín',
        tipoEntrega: 'RETIRO',
        fechaEsperada: fechaEnDias(4),
        items: [{ idProducto: producto.id, cantidad: 1 }],
      };

      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${cliente.token}`)
        .send(dto)
        .expect(201);

      const pedidoEnBd = await prisma.pedido.findUnique({
        where: { id: response.body.pedidoId },
      });
      expect(pedidoEnBd!.tipoEntrega).toBe('RETIRO');
      expect(pedidoEnBd!.observacionesEntrega).toBe('');
    });

    it('debe rechazar una fecha de entrega menor a 3 días con 400', async () => {
      const cliente = await seedUser(prisma, jwt);
      const producto = await seedProduct(prisma);

      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${cliente.token}`)
        .send({
          direccionEntrega: 'Cra 7 #70-20',
          ciudad: 'Bogotá',
          tipoEntrega: 'ENVIO',
          fechaEsperada: fechaEnDias(1), // demasiado pronto
          items: [{ idProducto: producto.id, cantidad: 1 }],
        })
        .expect(400);

      expect(response.body.message).toContain('3 días');

      // No se debe haber creado ningún pedido
      const count = await prisma.pedido.count();
      expect(count).toBe(0);
    });
  });

  // ==============================================================
  // HU-20: URL DE WOMPI
  // ==============================================================
  describe('HU-20: URL de Wompi', () => {
    it('debe devolver una URL con todos los parámetros requeridos', async () => {
      const cliente = await seedUser(prisma, jwt);
      const producto = await seedProduct(prisma, { precio: 7500 });

      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${cliente.token}`)
        .send({
          direccionEntrega: 'Calle 100',
          ciudad: 'Cali',
          tipoEntrega: 'ENVIO',
          fechaEsperada: fechaEnDias(5),
          items: [{ idProducto: producto.id, cantidad: 2 }],
        })
        .expect(201);

      const url = response.body.wompiUrl as string;
      expect(url).toContain('https://checkout.wompi.co/p/');
      expect(url).toContain(`public-key=${process.env.WOMPI_PUBLIC_KEY}`);
      expect(url).toContain('currency=COP');
      // Total = 7500 * 2 = 15000 → 1_500_000 centavos
      expect(url).toContain('amount-in-cents=1500000');
      expect(url).toContain(`reference=${response.body.pedidoId}`);
      expect(url).toContain('signature%3Aintegrity=');
      expect(url).toContain('redirect-url=');
    });

    it('debe calcular la firma SHA-256 de integridad correctamente', async () => {
      const cliente = await seedUser(prisma, jwt);
      const producto = await seedProduct(prisma, { precio: 10000 });

      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${cliente.token}`)
        .send({
          direccionEntrega: 'Calle 50',
          ciudad: 'Bogotá',
          tipoEntrega: 'ENVIO',
          fechaEsperada: fechaEnDias(5),
          items: [{ idProducto: producto.id, cantidad: 1 }],
        })
        .expect(201);

      const url = response.body.wompiUrl as string;
      const reference = response.body.pedidoId as string;
      const amountInCents = 1000000; // 10000 * 1 * 100
      const integritySecret = process.env.WOMPI_INTEGRITY_SECRET!;

      const expectedConcat = `${reference}${amountInCents}COP${integritySecret}`;
      const expectedHash = createHash('sha256')
        .update(expectedConcat)
        .digest('hex');

      expect(url).toContain(`signature%3Aintegrity=${expectedHash}`);
    });

    it('debe reemplazar localhost por localtest.me en la redirect-url', async () => {
      const cliente = await seedUser(prisma, jwt);
      const producto = await seedProduct(prisma);

      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${cliente.token}`)
        .send({
          direccionEntrega: 'X',
          ciudad: 'Y',
          tipoEntrega: 'RETIRO',
          fechaEsperada: fechaEnDias(4),
          items: [{ idProducto: producto.id, cantidad: 1 }],
        })
        .expect(201);

      const url = response.body.wompiUrl as string;
      // La URL original FRONTEND_URL=http://localhost:3000 debe aparecer
      // encodeada como localtest.me (ya no localhost)
      expect(url).toContain('localtest.me');
      expect(url).not.toContain('localhost');
    });

    it('debe devolver una URL de WhatsApp con el ID corto del pedido', async () => {
      const cliente = await seedUser(prisma, jwt);
      const producto = await seedProduct(prisma);

      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${cliente.token}`)
        .send({
          direccionEntrega: 'X',
          ciudad: 'Y',
          tipoEntrega: 'RETIRO',
          fechaEsperada: fechaEnDias(4),
          items: [{ idProducto: producto.id, cantidad: 1 }],
        })
        .expect(201);

      const whatsappUrl = response.body.whatsappUrl as string;
      const pedidoId = response.body.pedidoId as string;
      const shortId = pedidoId.split('-')[0].toUpperCase();

      expect(whatsappUrl).toContain('https://wa.me/573003685556');
      expect(whatsappUrl).toContain(encodeURIComponent(shortId));
    });
  });

  // ==============================================================
  // HU-25: ATOMICIDAD DE LA TRANSACCIÓN
  // ==============================================================
  describe('HU-25: Registro de la orden (atomicidad)', () => {
    it('debe crear pedido, items y pago en una sola transacción', async () => {
      const cliente = await seedUser(prisma, jwt);
      const prod1 = await seedProduct(prisma, { precio: 5000, nombre: 'A' });
      const prod2 = await seedProduct(prisma, { precio: 3000, nombre: 'B' });

      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${cliente.token}`)
        .send({
          direccionEntrega: 'Cra 10',
          ciudad: 'Bogotá',
          tipoEntrega: 'ENVIO',
          fechaEsperada: fechaEnDias(5),
          items: [
            { idProducto: prod1.id, cantidad: 2 }, // 10000
            { idProducto: prod2.id, cantidad: 3 }, // 9000
          ],
        })
        .expect(201);

      const pedidoId = response.body.pedidoId;

      // 1. El pedido existe
      const pedido = await prisma.pedido.findUnique({
        where: { id: pedidoId },
      });
      expect(pedido).not.toBeNull();
      expect(Number(pedido!.total)).toBe(19000); // 10000 + 9000

      // 2. Los items del pedido se crearon con los precios correctos
      const items = await prisma.pedidoProducto.findMany({
        where: { idPedido: pedidoId },
      });
      expect(items).toHaveLength(2);

      const item1 = items.find((i) => i.idProducto === prod1.id);
      const item2 = items.find((i) => i.idProducto === prod2.id);
      expect(item1!.cantidad).toBe(2);
      expect(Number(item1!.precioUnitario)).toBe(5000);
      expect(item2!.cantidad).toBe(3);
      expect(Number(item2!.precioUnitario)).toBe(3000);

      // 3. El pago asociado se creó en estado PENDIENTE
      const pago = await prisma.pago.findUnique({
        where: { idPedido: pedidoId },
      });
      expect(pago).not.toBeNull();
      expect(pago!.estado).toBe('PENDIENTE');
      expect(pago!.metodo).toBe('WOMPI');
      expect(Number(pago!.total)).toBe(19000);
    });

    it('debe filtrar productos INACTIVOS y calcular total solo con los activos', async () => {
      const cliente = await seedUser(prisma, jwt);
      const activo = await seedProduct(prisma, {
        precio: 5000,
        estado: EstadoProducto.ACTIVO,
      });
      const inactivo = await seedProduct(prisma, {
        precio: 100000,
        estado: EstadoProducto.INACTIVO,
      });

      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${cliente.token}`)
        .send({
          direccionEntrega: 'X',
          ciudad: 'Y',
          tipoEntrega: 'RETIRO',
          fechaEsperada: fechaEnDias(4),
          items: [
            { idProducto: activo.id, cantidad: 1 },
            { idProducto: inactivo.id, cantidad: 1 },
          ],
        })
        .expect(201);

      const pedido = await prisma.pedido.findUnique({
        where: { id: response.body.pedidoId },
      });
      // Solo cuenta el ACTIVO (5000), el INACTIVO (100000) se filtra.
      expect(Number(pedido!.total)).toBe(5000);

      const items = await prisma.pedidoProducto.findMany({
        where: { idPedido: pedido!.id },
      });
      expect(items).toHaveLength(1);
      expect(items[0].idProducto).toBe(activo.id);
    });

    it('debe rechazar un carrito con solo productos inactivos sin crear nada', async () => {
      const cliente = await seedUser(prisma, jwt);
      const inactivo = await seedProduct(prisma, {
        estado: EstadoProducto.INACTIVO,
      });

      await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${cliente.token}`)
        .send({
          direccionEntrega: 'X',
          ciudad: 'Y',
          tipoEntrega: 'RETIRO',
          fechaEsperada: fechaEnDias(4),
          items: [{ idProducto: inactivo.id, cantidad: 1 }],
        })
        .expect(400);

      // Nada se persistió: ni pedido, ni items, ni pago
      expect(await prisma.pedido.count()).toBe(0);
      expect(await prisma.pedidoProducto.count()).toBe(0);
      expect(await prisma.pago.count()).toBe(0);
    });

    it('debe rechazar un pedido sin items con 400', async () => {
      const cliente = await seedUser(prisma, jwt);

      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${cliente.token}`)
        .send({
          direccionEntrega: 'X',
          ciudad: 'Y',
          tipoEntrega: 'RETIRO',
          fechaEsperada: fechaEnDias(4),
          items: [],
        })
        .expect(400);

      expect(response.body.message).toContain('carrito');
      expect(await prisma.pedido.count()).toBe(0);
    });

    it('debe rechazar un pedido sin JWT con 401', async () => {
      await request(app.getHttpServer())
        .post('/pedidos')
        .send({
          direccionEntrega: 'X',
          ciudad: 'Y',
          tipoEntrega: 'RETIRO',
          fechaEsperada: fechaEnDias(4),
          items: [{ idProducto: 'cualquiera', cantidad: 1 }],
        })
        .expect(401);

      expect(await prisma.pedido.count()).toBe(0);
    });
  });
});
