import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'avatarVisible';

type AvatarPrefsValue = {
  ready: boolean;
  visible: boolean;
  setVisible: (next: boolean) => Promise<void>;
};

const AvatarPrefsContext = createContext<AvatarPrefsValue | null>(null);

export function AvatarPrefsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [visible, setVisibleState] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw === '0') setVisibleState(false);
        else if (raw === '1') setVisibleState(true);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setVisible = useCallback(async (next: boolean) => {
    setVisibleState(next);
    await AsyncStorage.setItem(KEY, next ? '1' : '0');
  }, []);

  const value = useMemo(
    () => ({ ready, visible, setVisible }),
    [ready, visible, setVisible],
  );

  return (
    <AvatarPrefsContext.Provider value={value}>
      {children}
    </AvatarPrefsContext.Provider>
  );
}

export function useAvatarPrefs() {
  const ctx = useContext(AvatarPrefsContext);
  if (!ctx) throw new Error('useAvatarPrefs outside provider');
  return ctx;
}
