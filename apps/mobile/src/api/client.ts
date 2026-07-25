import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

type ApiError = { message?: string | string[]; statusCode?: number };

async function getAccessToken() {
  return SecureStore.getItemAsync('accessToken');
}

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init?.headers as Record<string, string>) ?? {}),
  };

  if (init?.auth !== false) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as T | ApiError) : ({} as T);

  if (!res.ok) {
    const err = data as ApiError;
    const msg = Array.isArray(err.message)
      ? err.message.join(', ')
      : err.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(`cache:${key}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { exp: number; data: T };
    if (parsed.exp < Date.now()) {
      await AsyncStorage.removeItem(`cache:${key}`);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, data: T, ttlMs = 5 * 60_000) {
  await AsyncStorage.setItem(
    `cache:${key}`,
    JSON.stringify({ exp: Date.now() + ttlMs, data }),
  );
}
