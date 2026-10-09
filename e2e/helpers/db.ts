/**
 * Helper de base de datos para tests E2E.
 *
 * Usa el PrismaClient generado por el backend (compartimos el schema).
 * Las tareas típicas son:
 *   - `cleanDatabase()` → TRUNCATE de las tablas transaccionales entre tests.
 *   - `seedProduct()`, `seedUser()` → crear fixtures mínimos vía Prisma.
 *
 * ⚠️ Importante: NO levantamos la app NestJS. Solo nos conectamos a la
 * BD de E2E directamente para preparar/limpiar datos antes de que el
 * navegador interactúe con el frontend.
 */

// Importamos del root (`BRISEE_BAKE/node_modules/@prisma/client`), donde
// el workspace raíz genera el cliente de Prisma. Node resuelve la ruta
// subiendo desde /e2e/.
import { PrismaClient } from '@prisma/client';
// Prisma 7 usa adapters en lugar de la URL directa — mismo patrón que
// el backend en `backend/src/prisma.service.ts`.
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Guard de seguridad: parsea la DATABASE_URL y exige que el NOMBRE de la
 * BD (no la URL completa) termine en `_test` o `_e2e`. Previene que una
 * configuración mal escrita (o un usuario llamado `test_admin`) pase un
 * `.includes()` genérico y acabemos truncando la BD de desarrollo o
 * producción.
 */
function assertIsTestDatabase(databaseUrl: string | undefined): void {
  if (!databaseUrl) {
    throw new Error('❌ DATABASE_URL no está definida.');
  }

  let dbName: string;
  try {
    const parsed = new URL(databaseUrl);
    dbName = parsed.pathname.replace(/^\//, '');
  } catch {
    throw new Error(
      `❌ DATABASE_URL no es una URL válida: "${databaseUrl}"`,
    );
  }

  if (!dbName) {
    throw new Error(
      `❌ DATABASE_URL no incluye un nombre de base de datos: "${databaseUrl}"`,
    );
  }

  if (!/_test$|_e2e$/.test(dbName)) {
    throw new Error(
      `\n❌ Operación destructiva ABORTADA.\n` +
        `   La base de datos "${dbName}" no termina en "_test" ni "_e2e".\n` +
        `   Los tests E2E solo pueden operar contra bases con esa convención.\n`,
    );
  }
}

// Instancia única del PrismaClient durante toda la corrida de tests.
// Los tests comparten esta conexión para evitar abrir/cerrar sockets.
let prismaInstance: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    // Guard: validamos ANTES de abrir conexión. Si la URL no es de pruebas,
    // ni siquiera inicializamos el pool.
    assertIsTestDatabase(process.env.DATABASE_URL);
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prismaInstance = new PrismaClient({ adapter });
  }
  return prismaInstance;
}

export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

/**
 * Tablas transaccionales que limpiamos entre tests. El orden importa por
 * las foreign keys, pero CASCADE se encarga en Postgres.
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

export async function cleanDatabase(): Promise<void> {
  // Defense in depth: aunque `getPrisma` ya validó, re-validamos antes
  // de cada TRUNCATE para que ningún refactor silencioso rompa el guard.
  assertIsTestDatabase(process.env.DATABASE_URL);

  const prisma = getPrisma();
  const tablas = TABLAS_A_LIMPIAR.map((t) => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tablas} RESTART IDENTITY CASCADE;`,
  );
}

/**
 * Crea una categoría con nombre único.
 */
export async function seedCategory(nombre = 'Galletas'): Promise<{
  id: string;
  nombre: string;
}> {
  const prisma = getPrisma();
  const cat = await prisma.categoria.create({ data: { nombre } });
  return { id: cat.id, nombre: cat.nombre };
}

export interface SeedProductInput {
  nombre?: string;
  precio?: number;
  idCategoria?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
  existencias?: number;
}

/**
 * Crea un producto. Si no se pasa idCategoria, crea una categoría default.
 */
export async function seedProduct(input: SeedProductInput = {}): Promise<{
  id: string;
  nombre: string;
  precio: number;
}> {
  const prisma = getPrisma();
  let idCategoria = input.idCategoria;

  if (!idCategoria) {
    const cat = await seedCategory(`Cat-${Date.now()}-${Math.random()}`);
    idCategoria = cat.id;
  }

  const producto = await prisma.producto.create({
    data: {
      idCategoria,
      nombre: input.nombre ?? 'Galleta de prueba E2E',
      descripcion: 'Producto creado para pruebas E2E.',
      precio: input.precio ?? 5000,
      presentacion: 'Unidad',
      existencias: input.existencias ?? 100,
      estado: input.estado ?? 'ACTIVO',
    },
  });

  return {
    id: producto.id,
    nombre: producto.nombre,
    precio: Number(producto.precio),
  };
}

/**
 * Fecha en formato YYYY-MM-DD a N días en el futuro. Útil para datos
 * de entrega válidos (el backend exige mínimo 3 días).
 */
export function fechaEnDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
