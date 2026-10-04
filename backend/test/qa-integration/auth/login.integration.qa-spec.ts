/**
 * PRUEBAS DE INTEGRACIÓN QA — HU-15: Inicio de sesión tradicional
 *
 * Cobertura según la Estrategia de Pruebas:
 *   - Happy path: autenticación contra BD real con usuarios reales, JWT
 *     firmado correctamente y navegable.
 *   - Error path: credenciales inválidas devuelven 401 con un mensaje
 *     GENÉRICO (seguridad: no revelar si el usuario existe o no).
 *
 * Punto clave de integración:
 *   El JWT devuelto debe permitir acceder a endpoints protegidos. Esto
 *   valida que el JwtModule, el guard y el servicio comparten el mismo
 *   secreto y configuración, cosa que las pruebas unitarias no cubren.
 */

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../src/prisma.service';
import { createTestApp } from '../helpers/test-app';
import { cleanDatabase } from '../helpers/test-db';
import { seedUser } from '../helpers/test-fixtures';
import { Rol } from '@prisma/client';

describe('HU-15 Inicio de sesión [Integración]', () => {
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

  // --------------------------------------------------------------
  // HAPPY PATH
  // --------------------------------------------------------------
  describe('POST /auth/login (happy path)', () => {
    it('debe autenticar un usuario existente y devolver un JWT utilizable', async () => {
      const user = await seedUser(prisma, jwt, {
        correo: 'login-ok@test.com',
        password: 'MiPassword123!',
        rol: Rol.CLIENTE,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ correo: user.correo, password: user.password })
        .expect(201);

      expect(response.body).toEqual({
        access_token: expect.any(String),
      });

      // El token devuelto debe ser decodificable y apuntar al usuario correcto
      const payload = await jwt.verifyAsync<{
        sub: string;
        correo: string;
        rol: string;
      }>(response.body.access_token);

      expect(payload.sub).toBe(user.id);
      expect(payload.correo).toBe(user.correo);
      expect(payload.rol).toBe('CLIENTE');
    });

    it('el JWT devuelto por login debe permitir acceder a endpoints protegidos', async () => {
      // Este test valida la integración completa: login → JWT → guard
      const user = await seedUser(prisma, jwt, {
        correo: 'protected-access@test.com',
        password: 'Password123!',
      });

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ correo: user.correo, password: user.password })
        .expect(201);

      const token = loginRes.body.access_token;

      // Usar el token en una ruta protegida (GET /pedidos/mis-pedidos)
      const protectedRes = await request(app.getHttpServer())
        .get('/pedidos/mis-pedidos')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Un usuario recién creado no tiene pedidos → array vacío
      expect(protectedRes.body).toEqual([]);
    });
  });

  // --------------------------------------------------------------
  // ERROR PATHS
  // --------------------------------------------------------------
  describe('POST /auth/login (flujos alternativos)', () => {
    it('debe rechazar un correo inexistente con 401 y mensaje genérico', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ correo: 'nadie@test.com', password: 'cualquiera123' })
        .expect(401);

      // Seguridad: el mensaje NO debe revelar si el usuario existe o no.
      // Debe ser idéntico al de contraseña incorrecta.
      expect(response.body.message).toBe(
        'Nombre de Usuario y/o contraseñas incorrectas',
      );
    });

    it('debe rechazar una contraseña incorrecta con el MISMO mensaje genérico', async () => {
      const user = await seedUser(prisma, jwt, {
        correo: 'password-wrong@test.com',
        password: 'CorrectPassword123!',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ correo: user.correo, password: 'OtraPassword999!' })
        .expect(401);

      expect(response.body.message).toBe(
        'Nombre de Usuario y/o contraseñas incorrectas',
      );
    });

    it('debe rechazar el acceso a rutas protegidas sin JWT con 401', async () => {
      const response = await request(app.getHttpServer())
        .get('/pedidos/mis-pedidos')
        .expect(401);

      expect(response.body.message).toContain('Inicie sesión');
    });

    it('debe rechazar un JWT inválido con 401', async () => {
      const response = await request(app.getHttpServer())
        .get('/pedidos/mis-pedidos')
        .set('Authorization', 'Bearer token-falso.que-no-es-jwt')
        .expect(401);

      expect(response.body.message).toContain('inválido');
    });
  });
});
