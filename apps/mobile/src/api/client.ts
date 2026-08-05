import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

type ApiError = { message?: string | string[]; statusCode?: number };

type TokenPair = { accessToken: string; refreshToken: string };

async function getAccessToken() {
  return SecureStore.getItemAsync('accessToken');
}

async function getRefreshToken() {
  return SecureStore.getItemAsync('refreshToken');
}

let refreshInFlight: Promise<TokenPair | null> | null = null;

async function refreshAccessToken(): Promise<TokenPair | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const text = await res.text();
      const data = text
        ? (JSON.parse(text) as TokenPair & ApiError)
        : ({} as TokenPair & ApiError);
      if (!res.ok || !data.accessToken || !data.refreshToken) {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        return null;
      }
      await SecureStore.setItemAsync('accessToken', data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

function errorMessage(data: ApiError, status: number) {
  const msg = Array.isArray(data.message)
    ? data.message.join(', ')
    : data.message ?? `HTTP ${status}`;
  return msg;
}

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<T> {
  const doFetch = async (token: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((init?.headers as Record<string, string>) ?? {}),
    };
    if (init?.auth !== false && token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
    const text = await res.text();
    const data = text ? (JSON.parse(text) as T | ApiError) : ({} as T);
    return { res, data };
  };

  const needsAuth = init?.auth !== false;
  let token = needsAuth ? await getAccessToken() : null;
  let { res, data } = await doFetch(token);

  if (res.status === 401 && needsAuth && !path.includes('/v1/auth/')) {
    const refreshed = await refreshAccessToken();
    if (refreshed?.accessToken) {
      ({ res, data } = await doFetch(refreshed.accessToken));
    }
  }

  if (!res.ok) {
    throw new Error(errorMessage(data as ApiError, res.status));
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
