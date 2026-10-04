/**
 * Playwright config para las pruebas E2E del Sprint 2.
 *
 * Diseño clave:
 *   - Carga variables desde .env.e2e ANTES de que Playwright lance los
 *     servidores. Así el backend arranca contra la BD de E2E y no contra
 *     la de desarrollo.
 *   - `webServer` levanta backend (NestJS) + frontend (Next.js) de forma
 *     automática al correr `npm test`.
 *   - Un solo worker (`workers: 1`) porque los tests comparten BD. Cada
 *     test limpia tablas en `beforeEach`.
 *   - Solo Chromium: cubrir Firefox/Safari queda fuera del alcance del
 *     Sprint 2 (no se exige en la estrategia).
 */

import { defineConfig, devices } from '@playwright/test';
import { config as loadDotenv } from 'dotenv';
import * as path from 'path';

// Cargamos .env.e2e en process.env. Playwright pasa estas variables a los
// subprocesos de webServer, así que el backend y el frontend las verán.
loadDotenv({ path: path.resolve(__dirname, '.env.e2e') });

const BACKEND_PORT = process.env.BACKEND_PORT ?? '3011';
const FRONTEND_PORT = process.env.FRONTEND_PORT ?? '3010';
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

export default defineConfig({
  testDir: './tests',
  // Un timeout generoso: los tests que atraviesan el checkout tocan
  // backend + BD + múltiples navegaciones.
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false, // tests comparten BD
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    // Timeout generoso: Next.js dev (Turbopack) compila las rutas en la
    // primera visita y puede tardar varios segundos. 60s cubre casos
    // normales sin bloquear tests en caso de bug real.
    navigationTimeout: 60_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Levanta backend y frontend automáticamente. Playwright espera a que
  // ambos puertos respondan antes de empezar a correr los tests.
  webServer: [
    {
      // Backend NestJS con la BD de E2E
      command: 'npm run start:dev',
      cwd: path.resolve(__dirname, '../backend'),
      port: Number(BACKEND_PORT),
      reuseExistingServer: !process.env.CI,
      timeout: 180_000, // Nest + Prisma pueden tardar en arrancar la 1ra vez
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        // Heredamos todo el env del padre (que ya tiene .env.e2e cargado)
        // y hacemos explícitos los overrides críticos.
        DATABASE_URL: process.env.DATABASE_URL!,
        JWT_SECRET: process.env.JWT_SECRET!,
        WOMPI_PUBLIC_KEY: process.env.WOMPI_PUBLIC_KEY!,
        WOMPI_PRIVATE_KEY: process.env.WOMPI_PRIVATE_KEY!,
        WOMPI_INTEGRITY_SECRET: process.env.WOMPI_INTEGRITY_SECRET!,
        WOMPI_EVENTS_SECRET: process.env.WOMPI_EVENTS_SECRET!,
        FRONTEND_URL: process.env.FRONTEND_URL!,
        ADMIN_EMAIL: process.env.ADMIN_EMAIL!,
        EMAIL_USER: process.env.EMAIL_USER!,
        EMAIL_PASS: process.env.EMAIL_PASS!,
        PORT: BACKEND_PORT,
      },
    },
    {
      // Frontend Next.js apuntando al backend de E2E
      command: 'npm run dev',
      cwd: path.resolve(__dirname, '../frontend'),
      port: Number(FRONTEND_PORT),
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL!,
        PORT: FRONTEND_PORT,
      },
    },
  ],
});
