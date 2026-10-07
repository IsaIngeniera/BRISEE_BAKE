/**
 * Helper para construir la aplicación NestJS en modo de pruebas de integración.
 *
 * A diferencia de las pruebas unitarias (que mockean todo), aquí:
 *  - Montamos el AppModule REAL
 *  - Conectamos contra Postgres REAL (la BD de pruebas)
 *  - Aplicamos las mismas pipes/guards de producción (ValidationPipe global)
 *
 * Lo único que se mockea son los servicios EXTERNOS a nuestro sistema:
 *  - fetch (API de Wompi)
 *  - nodemailer (envío de correos)
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma.service';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  /**
   * Cierra la app y desconecta Prisma. Debe llamarse en afterAll para que
   * Jest termine sin "open handles" (el pool de pg deja sockets abiertos
   * si no se desconecta explícitamente).
   */
  teardown: () => Promise<void>;
}

/**
 * Construye y arranca la aplicación NestJS para pruebas.
 */
export async function createTestApp(): Promise<TestContext> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication({ logger: false });

  // Mismo ValidationPipe que en main.ts para que los DTOs se comporten igual.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  const prisma = app.get(PrismaService);

  const teardown = async (): Promise<void> => {
    // Primero cerramos la app, luego desconectamos Prisma. El orden importa:
    // app.close() dispara los hooks de Nest pero PrismaService no implementa
    // OnModuleDestroy, así que la desconexión la hacemos manual aquí.
    await app.close();
    await prisma.$disconnect();
  };

  return { app, prisma, teardown };
}
