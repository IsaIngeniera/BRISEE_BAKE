/* eslint-disable */
/**
 * Helper para limpieza de la BD de pruebas.
 *
 * Estrategia: TRUNCATE CASCADE de todas las tablas transaccionales entre
 * tests. Es rápido y garantiza que cada test arranque con BD vacía, sin
 * depender del orden de ejecución.
 *
 * NO borramos los enums ni la estructura — solo los datos.
 */

import { PrismaService } from '../../../src/prisma.service';
import { assertIsTestDatabase } from './assert-test-db';

/**
 * Orden importa por las foreign keys (de hijos a padres).
 * CASCADE se encarga del resto, pero listamos explícito por claridad.
 */
const TABLAS_A_LIMPIAR = [
  'pagos',
  'pedidos_producto',
  'pedidos',
  'items_carrito',
  'carritos',
  'imagenes_producto',
  'productos',
  'categorias',
  'usuarios',
] as const;

export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  // Defense in depth: aunque el globalSetup ya validó la URL, verificamos
  // de nuevo aquí. Si alguien reusa este helper desde un contexto donde
  // DATABASE_URL fue sobreescrita, no vamos a hacer TRUNCATE contra dev.
  assertIsTestDatabase(process.env.DATABASE_URL);

  // Usamos un solo TRUNCATE con todas las tablas para que CASCADE funcione
  // de forma atómica. Importante: entre comillas dobles por el casing.
  const tablas = TABLAS_A_LIMPIAR.map((t) => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tablas} RESTART IDENTITY CASCADE;`,
  );
}
