/* eslint-disable */
/**
 * PRUEBAS DE INTEGRACIÓN QA — HU-26: Historial de pedidos
 *
 * Cobertura según la Estrategia de Pruebas:
 *   - Filtros por rol funcionan con usuarios reales en BD.
 *   - Autorización JWT y guard de roles respetados.
 *
 * Rutas cubiertas:
 *   - GET /pedidos/mis-pedidos  → requiere JWT, devuelve SOLO los pedidos
 *     del usuario que hace la petición.
 *   - GET /pedidos              → requiere JWT + rol ADMIN, devuelve TODOS
 *     los pedidos del sistema.
 *   - PATCH /pedidos/:id/estado → requiere JWT + rol ADMIN, actualiza el
 *     estado de entrega.
 */

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Rol } from '@prisma/client';
import { PrismaService } from '../../../src/prisma.service';
import { createTestApp } from '../helpers/test-app';
import { cleanDatabase } from '../helpers/test-db';
import { seedUser, seedProduct } from '../helpers/test-fixtures';

describe('HU-26 Historial de pedidos [Integración]', () => {
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

  /**
   * Crea un pedido mínimo en BD para un cliente.
   */
  async function seedPedido(
    idCliente: string,
    opts: { idProducto?: string; total?: number } = {},
  ): Promise<string> {
    let idProducto = opts.idProducto;
    if (!idProducto) {
      const prod = await seedProduct(prisma);
      idProducto = prod.id;
    }

    const pedido = await prisma.pedido.create({
      data: {
        idCliente,
        estadoEntrega: 'PENDIENTE',
        total: opts.total ?? 10000,
        fechaEsperada: new Date(Date.now() + 5 * 86400000),
        direccionEntrega: 'Cra 7',
        ciudad: 'Bogotá',
        tipoEntrega: 'ENVIO',
        observacionesEntrega: '',
      },
    });

    await prisma.pedidoProducto.create({
      data: {
        idPedido: pedido.id,
        idProducto,
        cantidad: 1,
        precioUnitario: opts.total ?? 10000,
      },
    });

    return pedido.id;
  }

  // --------------------------------------------------------------
  // GET /pedidos/mis-pedidos (cliente)
  // --------------------------------------------------------------
  describe('GET /pedidos/mis-pedidos', () => {
    it('el cliente debe ver SOLO sus propios pedidos', async () => {
      const cliente1 = await seedUser(prisma, jwt, {
        correo: 'c1@test.com',
      });
      const cliente2 = await seedUser(prisma, jwt, {
        correo: 'c2@test.com',
      });

      const pedido1a = await seedPedido(cliente1.id, { total: 5000 });
      const pedido1b = await seedPedido(cliente1.id, { total: 8000 });
      await seedPedido(cliente2.id, { total: 99999 }); // no debe aparecer

      const response = await request(app.getHttpServer())
        .get('/pedidos/mis-pedidos')
        .set('Authorization', `Bearer ${cliente1.token}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      const ids = response.body.map((p: { id: string }) => p.id);
      expect(ids).toContain(pedido1a);
      expect(ids).toContain(pedido1b);

      // Ningún pedido debe pertenecer a cliente2
      response.body.forEach((p: { idCliente: string }) => {
        expect(p.idCliente).toBe(cliente1.id);
      });
    });

    it('debe devolver array vacío si el usuario no tiene pedidos', async () => {
      const cliente = await seedUser(prisma, jwt);

      const response = await request(app.getHttpServer())
        .get('/pedidos/mis-pedidos')
        .set('Authorization', `Bearer ${cliente.token}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('debe rechazar la petición sin JWT con 401', async () => {
      await request(app.getHttpServer())
        .get('/pedidos/mis-pedidos')
        .expect(401);
    });

    it('cada pedido debe incluir sus productos con nombre y cantidad', async () => {
      const cliente = await seedUser(prisma, jwt);
      const prod = await seedProduct(prisma, {
        nombre: 'Macaron de Vainilla',
      });
      await seedPedido(cliente.id, { idProducto: prod.id });

      const response = await request(app.getHttpServer())
        .get('/pedidos/mis-pedidos')
        .set('Authorization', `Bearer ${cliente.token}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      const pedido = response.body[0];
      expect(pedido.productos).toHaveLength(1);
      expect(pedido.productos[0].producto.nombre).toBe('Macaron de Vainilla');
      expect(pedido.productos[0].cantidad).toBe(1);
    });
  });

  // --------------------------------------------------------------
  // GET /pedidos (admin only)
  // --------------------------------------------------------------
  describe('GET /pedidos (solo ADMIN)', () => {
    it('un ADMIN debe ver TODOS los pedidos del sistema', async () => {
      const admin = await seedUser(prisma, jwt, {
        correo: 'admin@test.com',
        rol: Rol.ADMIN,
      });
      const cliente1 = await seedUser(prisma, jwt, { correo: 'c1@test.com' });
      const cliente2 = await seedUser(prisma, jwt, { correo: 'c2@test.com' });

      await seedPedido(cliente1.id);
      await seedPedido(cliente1.id);
      await seedPedido(cliente2.id);

      const response = await request(app.getHttpServer())
        .get('/pedidos')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);

      expect(response.body).toHaveLength(3);

      // Cada pedido debe incluir los datos del cliente
      response.body.forEach((p: { cliente: { correo: string } }) => {
        expect(p.cliente).toBeDefined();
        expect(p.cliente.correo).toEqual(expect.any(String));
      });
    });

    it('un CLIENTE NO debe poder acceder a GET /pedidos (403)', async () => {
      const cliente = await seedUser(prisma, jwt, {
        correo: 'cliente@test.com',
        rol: Rol.CLIENTE,
      });

      await request(app.getHttpServer())
        .get('/pedidos')
        .set('Authorization', `Bearer ${cliente.token}`)
        .expect(403);
    });

    it('debe rechazar la petición sin JWT con 401', async () => {
      await request(app.getHttpServer()).get('/pedidos').expect(401);
    });
  });

  // --------------------------------------------------------------
  // PATCH /pedidos/:id/estado (admin only)
  // --------------------------------------------------------------
  describe('PATCH /pedidos/:id/estado (solo ADMIN)', () => {
    it('un ADMIN debe poder cambiar el estado del pedido', async () => {
      const admin = await seedUser(prisma, jwt, {
        correo: 'admin2@test.com',
        rol: Rol.ADMIN,
      });
      const cliente = await seedUser(prisma, jwt, {
        correo: 'cliente2@test.com',
      });
      const pedidoId = await seedPedido(cliente.id);

      const response = await request(app.getHttpServer())
        .patch(`/pedidos/${pedidoId}/estado`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ estadoEntrega: 'PREPARANDO' })
        .expect(200);

      expect(response.body.estadoEntrega).toBe('PREPARANDO');

      // Verificamos la BD, no solo la respuesta.
      const pedidoBd = await prisma.pedido.findUnique({
        where: { id: pedidoId },
      });
      expect(pedidoBd!.estadoEntrega).toBe('PREPARANDO');
    });

    it('un CLIENTE NO debe poder cambiar el estado de un pedido (403)', async () => {
      const cliente = await seedUser(prisma, jwt);
      const pedidoId = await seedPedido(cliente.id);

      await request(app.getHttpServer())
        .patch(`/pedidos/${pedidoId}/estado`)
        .set('Authorization', `Bearer ${cliente.token}`)
        .send({ estadoEntrega: 'ENTREGADO' })
        .expect(403);

      // La BD no debe haberse modificado
      const pedidoBd = await prisma.pedido.findUnique({
        where: { id: pedidoId },
      });
      expect(pedidoBd!.estadoEntrega).toBe('PENDIENTE');
    });

    it('debe devolver 404 si el pedido no existe', async () => {
      const admin = await seedUser(prisma, jwt, {
        correo: 'admin3@test.com',
        rol: Rol.ADMIN,
      });

      await request(app.getHttpServer())
        .patch('/pedidos/00000000-0000-0000-0000-000000000000/estado')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ estadoEntrega: 'DESPACHADO' })
        .expect(404);
    });

    it('debe rechazar un estado inválido con 400 (ValidationPipe)', async () => {
      const admin = await seedUser(prisma, jwt, {
        correo: 'admin4@test.com',
        rol: Rol.ADMIN,
      });
      const cliente = await seedUser(prisma, jwt);
      const pedidoId = await seedPedido(cliente.id);

      await request(app.getHttpServer())
        .patch(`/pedidos/${pedidoId}/estado`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ estadoEntrega: 'ESTADO_INEXISTENTE' })
        .expect(400);
    });
  });
});
