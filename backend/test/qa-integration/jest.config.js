/**
 * Jest config SEPARADA para pruebas de integración.
 *
 * ¿Por qué está aparte?
 * - Las pruebas de integración usan una BD real (brisee_bake_test).
 * - Son más lentas que las unitarias, por eso se corren por separado.
 * - Necesitan un globalSetup que carga .env.test ANTES de montar los tests.
 *
 * Setup previo (una sola vez por máquina):
 *   docker-compose up postgres -d
 *   docker exec brisee-bake-postgres psql -U brisee -d brisee_bake \
 *     -c "CREATE DATABASE brisee_bake_test;"
 *   cp backend/.env.test.example backend/.env.test
 *
 * Ejecución:
 *   cd backend && npm run test:integration
 */

/** @type {import('jest').Config} */
module.exports = {
  rootDir: '../..',
  displayName: 'Backend QA Integration Tests',
  testEnvironment: 'node',
  // Solo corre archivos con el sufijo .integration.qa-spec.ts
  testRegex: 'test/qa-integration/.*\\.integration\\.qa-spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  // Se ejecuta UNA sola vez antes de todos los tests
  globalSetup: '<rootDir>/test/qa-integration/globalSetup.ts',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          esModuleInterop: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          allowSyntheticDefaultImports: true,
          target: 'ES2023',
          strictNullChecks: true,
          noImplicitAny: false,
          skipLibCheck: true,
          resolvePackageJsonExports: false,
          isolatedModules: false,
        },
        isolatedModules: false,
      },
    ],
  },
  // Las pruebas de integración NO corren en paralelo porque todas comparten
  // la misma BD y una interferiría con la otra.
  maxWorkers: 1,
  // Timeout más alto porque las pruebas que tocan BD son más lentas.
  testTimeout: 30000,
  // El pool de pg mantiene sockets abiertos; forzamos la salida tras los tests.
  forceExit: true,
};
