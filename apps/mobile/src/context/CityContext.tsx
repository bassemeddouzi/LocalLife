import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, cacheGet, cacheSet } from '../api/client';

export type City = {
  id: string;
  name: string;
  slug: string;
  contentPackVersion?: string | null;
};

type CityContextValue = {
  city: City | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const CityContext = createContext<CityContextValue | null>(null);

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [city, setCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cached = await cacheGet<City>('city:djerba');
      if (cached) {
        setCity(cached);
        setLoading(false);
      }

      const countries = await apiFetch<
        Array<{ id: string; iso2: string }>
      >('/v1/countries', { auth: false });
      const tn = countries.find((c) => c.iso2 === 'TN');
      if (!tn) throw new Error('Tunisia not seeded');
      const cities = await apiFetch<City[]>(
        `/v1/countries/${tn.id}/cities`,
        { auth: false },
      );
      const djerba = cities.find((c) => c.slug === 'djerba');
      if (!djerba) throw new Error('Djerba not seeded');
      setCity(djerba);
      await cacheSet('city:djerba', djerba, 30 * 60_000);
      await AsyncStorage.setItem('selectedCityId', djerba.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo(
    () => ({ city, loading, error, reload }),
    [city, loading, error, reload],
  );

  return (
    <CityContext.Provider value={value}>{children}</CityContext.Provider>
  );
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity outside provider');
  return ctx;
}
