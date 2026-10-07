/* eslint-disable */
/**
 * PRUEBAS UNITARIAS QA - services/auth.ts
 *
 * Verifica el servicio de autenticación del frontend:
 * - Login contra el backend
 * - Decodificación y validación de JWT
 * - Persistencia de sesión en localStorage/sessionStorage
 * - Eventos de cambio de autenticación
 */

import {
  login,
  saveSession,
  getSessionUser,
  clearSession,
  AUTH_TOKEN_KEY,
  AUTH_CHANGE_EVENT,
} from '@/services/auth';

// ============================================================
// Helpers
// ============================================================

/**
 * Crea un JWT fake con el payload especificado.
 * Formato: header.payload.signature (todos base64url).
 */
function makeFakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = 'fake-signature';
  return `${header}.${body}.${signature}`;
}

function makeValidToken(overrides: Partial<Record<string, unknown>> = {}) {
  return makeFakeJwt({
    sub: 'user-123',
    correo: 'juan@example.com',
    rol: 'CLIENTE',
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  });
}

describe('services/auth [QA]', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    (global as any).fetch = mockFetch;
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // login
  // ============================================================
  describe('login', () => {
    it('debe retornar el access_token si el login es exitoso', async () => {
      const token = makeValidToken();
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ access_token: token }),
      });

      const result = await login('juan@example.com', 'password123');

      expect(result).toBe(token);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            correo: 'juan@example.com',
            password: 'password123',
          }),
        }),
      );
    });

    it('debe lanzar error de credenciales si recibe 401', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Credenciales inválidas' }),
      });

      await expect(login('bad@example.com', 'wrong')).rejects.toThrow(
        'Nombre de Usuario y/o contraseñas incorrectas',
      );
    });

    it('debe lanzar error genérico si recibe otro error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Error del servidor' }),
      });

      await expect(login('user@example.com', 'pass')).rejects.toThrow(
        'Error del servidor',
      );
    });

    it('debe usar el primer mensaje si viene como array', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          message: ['El correo es inválido', 'Otro error'],
        }),
      });

      await expect(login('bad', 'pass')).rejects.toThrow('El correo es inválido');
    });

    it('debe lanzar error si el token no es válido', async () => {
      // Token sin exp
      const invalidToken = makeFakeJwt({ sub: 'user' });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ access_token: invalidToken }),
      });

      await expect(login('user@example.com', 'pass')).rejects.toThrow(
        'El servidor no devolvió una sesión válida.',
      );
    });

    it('debe lanzar error si no viene access_token', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ message: 'OK' }),
      });

      await expect(login('user@example.com', 'pass')).rejects.toThrow(
        'El servidor no devolvió una sesión válida.',
      );
    });

    it('debe rechazar tokens con rol inválido', async () => {
      const invalidRoleToken = makeValidToken({ rol: 'SUPERADMIN' as any });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ access_token: invalidRoleToken }),
      });

      await expect(login('user@example.com', 'pass')).rejects.toThrow(
        'El servidor no devolvió una sesión válida.',
      );
    });

    it('debe rechazar tokens expirados', async () => {
      const expiredToken = makeValidToken({
        exp: Math.floor(Date.now() / 1000) - 100,
      });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ access_token: expiredToken }),
      });

      await expect(login('user@example.com', 'pass')).rejects.toThrow(
        'El servidor no devolvió una sesión válida.',
      );
    });
  });

  // ============================================================
  // saveSession
  // ============================================================
  describe('saveSession', () => {
    it('debe guardar en localStorage si remember=true', () => {
      const token = makeValidToken();

      saveSession(token, true);

      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe(token);
      expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    });

    it('debe guardar en sessionStorage si remember=false', () => {
      const token = makeValidToken();

      saveSession(token, false);

      expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe(token);
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    });

    it('debe limpiar ambos storages antes de guardar (seguridad)', () => {
      localStorage.setItem(AUTH_TOKEN_KEY, 'old-local');
      sessionStorage.setItem(AUTH_TOKEN_KEY, 'old-session');

      const newToken = makeValidToken();
      saveSession(newToken, true);

      expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe(newToken);
    });

    it('debe disparar el evento AUTH_CHANGE_EVENT', () => {
      const listener = jest.fn();
      window.addEventListener(AUTH_CHANGE_EVENT, listener);

      saveSession(makeValidToken(), true);

      expect(listener).toHaveBeenCalled();

      window.removeEventListener(AUTH_CHANGE_EVENT, listener);
    });
  });

  // ============================================================
  // getSessionUser
  // ============================================================
  describe('getSessionUser', () => {
    it('debe retornar null si no hay sesión', () => {
      expect(getSessionUser()).toBeNull();
    });

    it('debe retornar el usuario del token guardado en sessionStorage', () => {
      const token = makeValidToken();
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);

      const user = getSessionUser();

      expect(user).toEqual({
        sub: 'user-123',
        correo: 'juan@example.com',
        rol: 'CLIENTE',
      });
    });

    it('debe retornar el usuario del token guardado en localStorage', () => {
      const token = makeValidToken();
      localStorage.setItem(AUTH_TOKEN_KEY, token);

      const user = getSessionUser();

      expect(user).toEqual({
        sub: 'user-123',
        correo: 'juan@example.com',
        rol: 'CLIENTE',
      });
    });

    it('debe priorizar sessionStorage sobre localStorage', () => {
      const sessionToken = makeValidToken({ correo: 'session@example.com' });
      const localToken = makeValidToken({ correo: 'local@example.com' });
      sessionStorage.setItem(AUTH_TOKEN_KEY, sessionToken);
      localStorage.setItem(AUTH_TOKEN_KEY, localToken);

      const user = getSessionUser();

      expect(user?.correo).toBe('session@example.com');
    });

    it('debe retornar null y limpiar el storage si el token es inválido', () => {
      sessionStorage.setItem(AUTH_TOKEN_KEY, 'not-a-valid-jwt');

      const user = getSessionUser();

      expect(user).toBeNull();
      expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    });

    it('debe retornar null si el token está expirado', () => {
      const expired = makeValidToken({
        exp: Math.floor(Date.now() / 1000) - 100,
      });
      sessionStorage.setItem(AUTH_TOKEN_KEY, expired);

      expect(getSessionUser()).toBeNull();
    });

    it('debe reconocer rol ADMIN correctamente', () => {
      const token = makeValidToken({ rol: 'ADMIN' });
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);

      const user = getSessionUser();

      expect(user?.rol).toBe('ADMIN');
    });
  });

  // ============================================================
  // clearSession
  // ============================================================
  describe('clearSession', () => {
    it('debe eliminar el token de ambos storages', () => {
      localStorage.setItem(AUTH_TOKEN_KEY, 'token-local');
      sessionStorage.setItem(AUTH_TOKEN_KEY, 'token-session');

      clearSession();

      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    });

    it('debe disparar el evento AUTH_CHANGE_EVENT', () => {
      const listener = jest.fn();
      window.addEventListener(AUTH_CHANGE_EVENT, listener);

      clearSession();

      expect(listener).toHaveBeenCalled();

      window.removeEventListener(AUTH_CHANGE_EVENT, listener);
    });

    it('no debe fallar si no hay sesión activa', () => {
      expect(() => clearSession()).not.toThrow();
    });
  });
});
