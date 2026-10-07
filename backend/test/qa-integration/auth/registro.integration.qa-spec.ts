/* eslint-disable */
/**
 * PRUEBAS DE INTEGRACIÓN QA — HU-13: Registro de nuevo usuario
 *
 * Cobertura según la Estrategia de Pruebas:
 *   - Happy path: el usuario se persiste correctamente en la BD y el
 *     controlador orquesta bien el flujo (DTO → service → Prisma → JWT).
 *   - Error path: correo duplicado devuelve 400.
 *
 * Diferencia con las pruebas unitarias:
 *   - Las unitarias mockean Prisma/bcrypt/JwtService.
 *   - Aquí usamos la BD real (brisee_bake_test), bcrypt real y JwtService real.
 *     Esto valida que las piezas trabajen juntas.
 */

import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../src/prisma.service';
import { createTestApp } from '../helpers/test-app';
import { cleanDatabase } from '../helpers/test-db';

describe('HU-13 Registro de usuario [Integración]', () => {
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
  describe('POST /auth/register (happy path)', () => {
    it('debe crear el usuario en la BD con contraseña hasheada y devolver un JWT válido', async () => {
      const dto = {
        nombre: 'Juan',
        apellido: 'Pérez',
        fechaNacimiento: '1990-05-15',
        correo: 'juan.perez@test.com',
        password: 'Password123!',
        celular: '3001234567',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(dto)
        .expect(201);

      // 1. Respuesta HTTP correcta
      expect(response.body).toMatchObject({
        message: 'Registro exitoso',
        access_token: expect.any(String),
      });

      // 2. El usuario REALMENTE existe en la BD
      const usuarioEnBd = await prisma.usuario.findUnique({
        where: { correo: dto.correo },
      });
      expect(usuarioEnBd).not.toBeNull();
      expect(usuarioEnBd!.nombre).toBe(dto.nombre);
      expect(usuarioEnBd!.apellido).toBe(dto.apellido);
      expect(usuarioEnBd!.celular).toBe(dto.celular);
      expect(usuarioEnBd!.rol).toBe('CLIENTE');
      expect(usuarioEnBd!.estado).toBe('ACTIVO');

      // 3. La contraseña NO se guarda en texto plano
      expect(usuarioEnBd!.password).not.toBe(dto.password);

      // 4. La contraseña hasheada es verificable con bcrypt
      const passwordValida = await bcrypt.compare(
        dto.password,
        usuarioEnBd!.password,
      );
      expect(passwordValida).toBe(true);

      // 5. El JWT es válido y lleva el id/correo/rol del usuario creado
      const payload = await jwt.verifyAsync<{
        sub: string;
        correo: string;
        rol: string;
      }>(response.body.access_token);
      expect(payload.sub).toBe(usuarioEnBd!.id);
      expect(payload.correo).toBe(dto.correo);
      expect(payload.rol).toBe('CLIENTE');
    });
  });

  // --------------------------------------------------------------
  // ERROR PATHS
  // --------------------------------------------------------------
  describe('POST /auth/register (flujos alternativos)', () => {
    it('debe rechazar un correo ya registrado con 400', async () => {
      const dto = {
        nombre: 'María',
        apellido: 'Gómez',
        fechaNacimiento: '1992-03-20',
        correo: 'duplicado@test.com',
        password: 'OtraPass456!',
        celular: '3109876543',
      };

      // Primer registro: exitoso
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(dto)
        .expect(201);

      // Segundo registro con el mismo correo: debe fallar
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...dto, nombre: 'Otra' })
        .expect(400);

      expect(response.body.message).toContain('ya está registrado');

      // La BD solo debe tener UN usuario con ese correo
      const count = await prisma.usuario.count({
        where: { correo: dto.correo },
      });
      expect(count).toBe(1);
    });

    it('debe rechazar un body sin campos obligatorios con 400 (ValidationPipe)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ correo: 'incompleto@test.com' })
        .expect(400);

      // ValidationPipe devuelve un array de mensajes de class-validator
      expect(response.body.message).toEqual(expect.any(Array));
      expect(response.body.message.length).toBeGreaterThan(0);

      // Nada debe persistirse en la BD cuando falla la validación
      const count = await prisma.usuario.count();
      expect(count).toBe(0);
    });

    it('debe rechazar un correo con formato inválido', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          nombre: 'Test',
          apellido: 'User',
          fechaNacimiento: '1990-01-01',
          correo: 'esto-no-es-un-correo',
          password: 'Password123!',
          celular: '3001234567',
        })
        .expect(400);

      expect(JSON.stringify(response.body.message)).toContain('correo');
    });
  });
});
