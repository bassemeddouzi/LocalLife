const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string; displayName: string };
};

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message ?? 'Login failed');
  }
  return data as AuthResponse;
}

export async function adminPing(accessToken: string) {
  const res = await fetch(`${API_BASE_URL}/v1/admin/ping`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('Not an admin or unauthorized');
  }
  return res.json();
}

export { API_BASE_URL };
