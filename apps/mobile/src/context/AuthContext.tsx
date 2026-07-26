import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../api/client';

export type UserMe = {
  id: string;
  email: string;
  role: string;
  displayName: string;
  locale: string;
  personaType?: string | null;
  preference?: {
    budgetBand?: string;
    homeCityId?: string | null;
    consentAnalytics?: boolean;
    consentPersonalization?: boolean;
    consentPush?: boolean;
    consentMarketing?: boolean;
  } | null;
};

type AuthContextValue = {
  ready: boolean;
  user: UserMe | null;
  needsOnboarding: boolean;
  signIn: (accessToken: string, refreshToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<UserMe | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const refreshMe = useCallback(async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) {
      setUser(null);
      return;
    }
    const me = await apiFetch<UserMe>('/v1/auth/me');
    setUser(me);
    // Guide / Business skip tourist onboarding
    if (me.role === 'GUIDE' || me.role === 'BUSINESS' || me.role === 'ADMIN') {
      setNeedsOnboarding(false);
      return;
    }
    const onboarded = await AsyncStorage.getItem(`onboarded:${me.id}`);
    setNeedsOnboarding(!onboarded);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await refreshMe();
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        setUser(null);
      } finally {
        setReady(true);
      }
    })();
  }, [refreshMe]);

  const signIn = useCallback(
    async (accessToken: string, refreshToken: string) => {
      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      await refreshMe();
    },
    [refreshMe],
  );

  const signOut = useCallback(async () => {
    const refresh = await SecureStore.getItemAsync('refreshToken');
    try {
      if (refresh) {
        await apiFetch('/v1/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: refresh }),
          auth: false,
        });
      }
    } catch {
      // ignore
    }
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    setUser(null);
    setNeedsOnboarding(false);
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (!user) return;
    await AsyncStorage.setItem(`onboarded:${user.id}`, '1');
    setNeedsOnboarding(false);
  }, [user]);

  const value = useMemo(
    () => ({
      ready,
      user,
      needsOnboarding,
      signIn,
      signOut,
      refreshMe,
      completeOnboarding,
    }),
    [
      ready,
      user,
      needsOnboarding,
      signIn,
      signOut,
      refreshMe,
      completeOnboarding,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
}
