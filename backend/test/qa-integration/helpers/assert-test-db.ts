/**
 * Guard de seguridad: valida que una `DATABASE_URL` apunte efectivamente
 * a una base de datos de PRUEBAS antes de ejecutar operaciones
 * destructivas (migraciones, TRUNCATE, etc.).
 *
 * Qué resuelve:
 *   Antes verificábamos con `.includes('_test')` sobre toda la URL, lo
 *   cual era inseguro: un usuario `test_admin`, un host `test.db` o
 *   una contraseña con "test_" habrían pasado la validación aunque la
 *   base real fuese la de desarrollo.
 *
 * Qué hace ahora:
 *   Parsea la URL como objeto y revisa SOLO el nombre de la base de
 *   datos (el pathname). Exige que termine en `_test` o `_e2e`.
 */

export function assertIsTestDatabase(databaseUrl: string | undefined): void {
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
        `   Para evitar destruir datos de desarrollo o producción, los\n` +
        `   tests solo pueden correr contra bases con esa convención.\n`,
    );
  }
}
