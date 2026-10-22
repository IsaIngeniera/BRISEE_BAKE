/* eslint-disable */
/**
 * PRUEBAS DE INTEGRACIÓN QA — HU-14: Inicio de sesión con Google (SSO)
 *
 * Cobertura de Criterios de Aceptación:
 *   1. Autenticación exitosa:
 *      - Valida credenciales externas y retorna sesión JWT funcional
 *      - Permite acceder a rutas protegidas con el JWT generado
 *   2. Cancelación del proceso:
 *      - Maneja errores de cancelación (ej. ventana cerrada / access_denied)
 *      - Retorna respuesta 400 limpia sin errores no controlados
 *   3. Creación automática (Primer ingreso):
 *      - Crea el usuario automáticamente con Rol.CLIENTE y EstadoUsuario.ACTIVO
 *      - Retorna el token JWT y marca isNewUser: true
 */

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../src/prisma.service';
import { AuthService } from '../../../src/auth/auth.service';
import { createTestApp } from '../helpers/test-app';
import { cleanDatabase } from '../helpers/test-db';
import { seedUser } from '../helpers/test-fixtures';
import { Rol, EstadoUsuario } from '@prisma/client';

describe('HU-14 Inicio de sesión con Google [Integración]', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let authService: AuthService;
  let teardown: () => Promise<void>;

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
    prisma = ctx.prisma;
    teardown = ctx.teardown;
    jwt = app.get(JwtService);
    authService = app.get(AuthService);
  });

  afterAll(async () => {
    await teardown();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  // --------------------------------------------------------------
  // CRITERIO 1: AUTENTICACIÓN EXITOSA (USUARIO EXISTENTE)
  // --------------------------------------------------------------
  describe('POST /auth/google (usuario existente)', () => {
    it('debe autenticar un usuario existente y devolver un JWT utilizable', async () => {
      const user = await seedUser(prisma, jwt, {
        correo: 'google-existente@test.com',
        nombre: 'Valeria',
        apellido: 'Castro',
        rol: Rol.CLIENTE,
      });

      // Simular verificación exitosa de Google
      jest.spyOn(authService, 'verifyGoogleToken').mockResolvedValueOnce({
        email: user.correo,
        nombre: 'Valeria',
        apellido: 'Castro',
        sub: 'google-uid-123456',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/google')
        .send({ credential: 'valid-google-id-token' })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.isNewUser).toBe(false);

      const payload = await jwt.verifyAsync<{
        sub: string;
        correo: string;
        rol: string;
      }>(response.body.access_token);

      expect(payload.sub).toBe(user.id);
      expect(payload.correo).toBe(user.correo);
      expect(payload.rol).toBe('CLIENTE');

      // Validar acceso a endpoint protegido con el token generado
      const profileRes = await request(app.getHttpServer())
        .patch('/auth/profile')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .send({ nombre: 'Valeria Modificada' })
        .expect(200);

      expect(profileRes.body.user.nombre).toBe('Valeria Modificada');
    });
  });

  // --------------------------------------------------------------
  // CRITERIO 3: CREACIÓN AUTOMÁTICA EN PRIMER INGRESO
  // --------------------------------------------------------------
  describe('POST /auth/google (primer ingreso)', () => {
    it('debe crear automáticamente un nuevo cliente con el correo de Google', async () => {
      const googleEmail = 'nuevo-google-user@test.com';

      jest.spyOn(authService, 'verifyGoogleToken').mockResolvedValueOnce({
        email: googleEmail,
        nombre: 'Camilo',
        apellido: 'Mendoza',
        sub: 'google-uid-new-777',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/google')
        .send({ idToken: 'valid-first-time-token' })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.isNewUser).toBe(true);
      expect(response.body.user.correo).toBe(googleEmail);
      expect(response.body.user.rol).toBe(Rol.CLIENTE);

      // Verificar persistencia en base de datos
      const createdInDb = await prisma.usuario.findUnique({
        where: { correo: googleEmail },
      });
      expect(createdInDb).toBeDefined();
      expect(createdInDb?.estado).toBe(EstadoUsuario.ACTIVO);
      expect(createdInDb?.rol).toBe(Rol.CLIENTE);
      expect(createdInDb?.nombre).toBe('Camilo');
      expect(createdInDb?.apellido).toBe('Mendoza');
    });
  });

  // --------------------------------------------------------------
  // CRITERIO 2: CANCELACIÓN DEL PROCESO
  // --------------------------------------------------------------
  describe('POST /auth/google (cancelación o errores)', () => {
    it('debe responder 400 cuando el cliente reporta cancelación', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/google')
        .send({ error: 'access_denied' })
        .expect(400);

      expect(response.body.message).toContain(
        'El proceso de autenticación con Google fue cancelado o rechazado',
      );
    });

    it('debe responder 400 si el payload no contiene ningún token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/google')
        .send({})
        .expect(400);

      expect(response.body.message).toContain('Token de Google requerido');
    });

    it('debe responder 401 si la cuenta del usuario está bloqueada', async () => {
      const blockedUser = await seedUser(prisma, jwt, {
        correo: 'bloqueado-google@test.com',
        estado: EstadoUsuario.BLOQUEADO,
      });

      jest.spyOn(authService, 'verifyGoogleToken').mockResolvedValueOnce({
        email: blockedUser.correo,
        nombre: 'Bloqueado',
        apellido: 'Test',
        sub: 'google-sub-blocked',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/google')
        .send({ credential: 'token-valido' })
        .expect(401);

      expect(response.body.message).toContain('bloqueada');
    });
  });
});
