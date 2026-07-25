const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type PortalUser = {
  id: string;
  email: string;
  role: string;
  displayName: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: PortalUser;
};

function token() {
  return localStorage.getItem('accessToken') ?? '';
}

export async function api<T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  if (init?.auth !== false) {
    headers.Authorization = `Bearer ${token()}`;
  }
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export async function login(email: string, password: string) {
  return api<AuthResponse>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    auth: false,
  });
}

export function saveSession(data: AuthResponse) {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('portalUser', JSON.stringify(data.user));
}

export function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('portalUser');
  localStorage.removeItem('adminUser');
}

export function getPortalUser(): PortalUser | null {
  const raw =
    localStorage.getItem('portalUser') ?? localStorage.getItem('adminUser');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PortalUser;
  } catch {
    return null;
  }
}

export { API_BASE_URL };
