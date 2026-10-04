/**
 * Helpers de autenticación para tests E2E.
 *
 * Dos estrategias:
 *   1. `registerUserViaUI(page, data)` → simula un usuario que se registra
 *      desde el formulario web. Se usa en los tests de HU-13.
 *   2. `registerUserViaAPI(data)` → crea el usuario con un POST directo
 *      al backend. Se usa cuando el test necesita un usuario autenticado
 *      pero no está probando el flujo de registro (ej. tests de HU-19,
 *      HU-25, HU-26 que necesitan un usuario para hacer un pedido).
 */

import { expect, Page, APIRequestContext, request } from '@playwright/test';

// Clave usada por el frontend en localStorage/sessionStorage para el JWT.
// Debe coincidir con `AUTH_TOKEN_KEY` en frontend/src/services/auth.ts.
export const AUTH_TOKEN_KEY = 'brisee_access_token';

export interface UserData {
  nombre: string;
  apellido: string;
  correo: string;
  password: string;
  celular: string;
  fechaNacimiento: string; // YYYY-MM-DD
}

export function buildUserData(overrides: Partial<UserData> = {}): UserData {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    nombre: 'Laura',
    apellido: 'Ramírez',
    correo: `e2e-${unique}@test.com`,
    password: 'Password123!',
    celular: '3001234567',
    fechaNacimiento: '1992-05-15',
    ...overrides,
  };
}

/**
 * Hace POST /auth/register directamente al backend y devuelve el token.
 * No pasa por la UI — útil para tests que necesitan un usuario ya logueado.
 */
export async function registerUserViaAPI(
  user: UserData,
): Promise<{ token: string; user: UserData }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3011';
  const api: APIRequestContext = await request.newContext();

  const response = await api.post(`${apiUrl}/auth/register`, {
    data: user,
  });

  if (!response.ok()) {
    throw new Error(
      `registerUserViaAPI falló: ${response.status()} ${await response.text()}`,
    );
  }

  const body = (await response.json()) as { access_token: string };
  await api.dispose();
  return { token: body.access_token, user };
}

/**
 * Hace POST /auth/login directamente al backend. Útil cuando el usuario
 * ya está sembrado en la BD con `seedUserInDB`.
 */
export async function loginViaAPI(
  correo: string,
  password: string,
): Promise<string> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3011';
  const api = await request.newContext();

  const response = await api.post(`${apiUrl}/auth/login`, {
    data: { correo, password },
  });

  if (!response.ok()) {
    throw new Error(
      `loginViaAPI falló: ${response.status()} ${await response.text()}`,
    );
  }

  const body = (await response.json()) as { access_token: string };
  await api.dispose();
  return body.access_token;
}

/**
 * Inyecta el token en localStorage del navegador para simular una sesión
 * iniciada. Debe llamarse ANTES de la primera `page.goto()`.
 */
export async function setAuthToken(page: Page, token: string): Promise<void> {
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: AUTH_TOKEN_KEY, value: token },
  );
}

/**
 * Rellena y envía el formulario de registro desde la UI.
 * Se usa en los tests de HU-13 que validan el flujo visual completo.
 */
export async function registerUserViaUI(
  page: Page,
  user: UserData,
): Promise<void> {
  await page.goto('/registro');

  await page.getByLabel(/nombre/i).first().fill(user.nombre);
  await page.getByLabel(/apellido/i).fill(user.apellido);
  await page.getByLabel(/correo|email/i).fill(user.correo);
  await page.getByLabel(/contraseña|password/i).first().fill(user.password);
  await page.getByLabel(/celular|teléfono/i).fill(user.celular);
  await page.getByLabel(/fecha.*nacimiento/i).fill(user.fechaNacimiento);

  await page.getByRole('button', { name: /registrar|crear.*cuenta/i }).click();
}

/**
 * Rellena y envía el formulario de login desde la UI.
 */
export async function loginViaUI(
  page: Page,
  correo: string,
  password: string,
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/correo|email/i).fill(correo);
  await page.getByLabel(/contraseña|password/i).fill(password);
  await page.getByRole('button', { name: /iniciar.*sesión|login/i }).click();
}

/**
 * Verifica que haya un token válido en localStorage o sessionStorage.
 * El frontend puede guardarlo en cualquiera de los dos según "Recordarme".
 */
export async function expectLoggedIn(page: Page): Promise<void> {
  const token = await page.evaluate((key) => {
    return (
      window.localStorage.getItem(key) ||
      window.sessionStorage.getItem(key)
    );
  }, AUTH_TOKEN_KEY);
  expect(token).toBeTruthy();
}

/**
 * Verifica que NO haya sesión activa (ni en localStorage ni en session).
 */
export async function expectLoggedOut(page: Page): Promise<void> {
  const token = await page.evaluate((key) => {
    return (
      window.localStorage.getItem(key) ||
      window.sessionStorage.getItem(key)
    );
  }, AUTH_TOKEN_KEY);
  expect(token).toBeFalsy();
}
