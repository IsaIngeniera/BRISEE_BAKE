export const AUTH_TOKEN_KEY = 'brisee_access_token';
export const AUTH_CHANGE_EVENT = 'brisee:auth-changed';

export type SessionUser = {
  sub: string;
  correo: string;
  rol: 'ADMIN' | 'CLIENTE';
};

type LoginResponse = {
  access_token?: string;
  message?: string | string[];
};

function decodeUser(token: string): (SessionUser & { exp: number }) | null {
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    ) as Partial<SessionUser> & { exp?: number };
    if (
      typeof payload.sub === 'string' &&
      typeof payload.correo === 'string' &&
      typeof payload.exp === 'number' &&
      payload.exp * 1000 > Date.now() &&
      (payload.rol === 'ADMIN' || payload.rol === 'CLIENTE')
    ) {
      return payload as SessionUser & { exp: number };
    }
  } catch {
    // Descarta tokens dañados o expirados.
  }
  return null;
}

export async function login(correo: string, password: string): Promise<string> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password }),
  });
  const data: LoginResponse = await response.json();
  if (!response.ok) {
    throw new Error(response.status === 401
      ? 'Nombre de Usuario y/o contraseñas incorrectas'
      : (Array.isArray(data.message) ? data.message[0] : data.message) || 'No fue posible iniciar sesión.');
  }
  if (!data.access_token || !decodeUser(data.access_token)) {
    throw new Error('El servidor no devolvió una sesión válida.');
  }
  return data.access_token;
}

export function saveSession(token: string, remember: boolean): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  (remember ? localStorage : sessionStorage).setItem(AUTH_TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  if (authChannel) authChannel.postMessage('auth_changed');
}

const authChannel = typeof window !== 'undefined' ? new BroadcastChannel('brisee_auth_channel') : null;

if (authChannel) {
  authChannel.onmessage = (event) => {
    if (event.data === 'auth_changed') {
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
      if (!getSessionUser()) {
        window.location.reload();
      }
    }
  };
}

export function getSessionUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return null;
  const user = decodeUser(token);
  if (user) return { sub: user.sub, correo: user.correo, rol: user.rol };
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  return null;
}

export function clearSession(): void {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  if (authChannel) authChannel.postMessage('auth_changed');
}