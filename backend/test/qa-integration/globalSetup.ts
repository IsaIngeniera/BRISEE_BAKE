/**
 * globalSetup para pruebas de integración.
 *
 * Se ejecuta UNA sola vez antes de todos los test suites. Tareas:
 *  1. Carga las variables de .env.test en process.env.
 *  2. Aplica las migraciones de Prisma a la BD de pruebas.
 *     (Garantiza que el esquema esté al día antes de correr los tests.)
 */

import { config as loadDotenv } from 'dotenv';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { assertIsTestDatabase } from './helpers/assert-test-db';

export default async function globalSetup(): Promise<void> {
  const envPath = path.resolve(__dirname, '../../.env.test');

  if (!fs.existsSync(envPath)) {
    throw new Error(
      `\n❌ No se encontró ${envPath}\n` +
        `   Copia la plantilla:\n` +
        `     cp backend/.env.test.example backend/.env.test\n`,
    );
  }

  loadDotenv({ path: envPath });

  // Guard: parsea la URL y exige que el NOMBRE de la BD termine en _test/_e2e.
  // Es más seguro que un `.includes()` sobre toda la URL (que podía matchear
  // user, password o host).
  assertIsTestDatabase(process.env.DATABASE_URL);

  console.log('\n🔧 [integration] Aplicando migraciones a la BD de pruebas...');

  // IMPORTANTE: usamos `prisma migrate deploy` (NO `db push`) a propósito.
  // La BD de pruebas debe reflejar exactamente lo mismo que tendría dev
  // y producción: lo que las migraciones aplican, nada más. Si existe
  // DRIFT entre schema.prisma y las migraciones, los tests DEBEN fallar
  // y el QA lo reporta. No ocultamos bugs con `db push`.
  try {
    execSync('npx prisma migrate deploy', {
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'pipe',
      env: { ...process.env },
    });

    console.log('✅ [integration] Migraciones aplicadas.\n');
  } catch (error) {
    const err = error as { stdout?: Buffer; stderr?: Buffer; message: string };
    const stderr = err.stderr?.toString() || '';
    const stdout = err.stdout?.toString() || '';
    throw new Error(
      `❌ Fallo al aplicar migraciones:\n${stdout}\n${stderr}\n${err.message}`,
    );
  }
}
