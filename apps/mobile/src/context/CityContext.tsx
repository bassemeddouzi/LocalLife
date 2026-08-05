import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';
import { apiFetch, cacheGet, cacheSet } from '../api/client';

export type City = {
  id: string;
  name: string;
  slug: string;
  contentPackVersion?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

type CityContextValue = {
  city: City | null;
  loading: boolean;
  error: string | null;
  locationGranted: boolean | null;
  reload: () => Promise<void>;
  refreshGpsStatus: () => Promise<void>;
  requestGps: () => Promise<boolean>;
};

const CityContext = createContext<CityContextValue | null>(null);

function toNum(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pickNearest(cities: City[], lat: number, lon: number): City | null {
  let best: City | null = null;
  let bestKm = Infinity;
  for (const c of cities) {
    const clat = toNum(c.latitude);
    const clon = toNum(c.longitude);
    if (clat == null || clon == null) continue;
    const km = haversineKm(lat, lon, clat, clon);
    if (km < bestKm) {
      bestKm = km;
      best = c;
    }
  }
  return best;
}

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [city, setCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);

  const refreshGpsStatus = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationGranted(status === Location.PermissionStatus.GRANTED);
    } catch {
      setLocationGranted(false);
    }
  }, []);

  const applyNearestFromGps = useCallback(async (cities: City[], fallback: City) => {
    let chosen = fallback;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === Location.PermissionStatus.GRANTED;
      setLocationGranted(granted);
      if (!granted) return fallback;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nearest = pickNearest(
        cities,
        pos.coords.latitude,
        pos.coords.longitude,
      );
      if (nearest) chosen = nearest;
    } catch {
      setLocationGranted(false);
    }
    return chosen;
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cached = await cacheGet<City>('city:selected');
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

      const chosen = await applyNearestFromGps(cities, djerba);
      setCity(chosen);
      await cacheSet('city:selected', chosen, 30 * 60_000);
      await AsyncStorage.setItem('selectedCityId', chosen.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [applyNearestFromGps]);

  const requestGps = useCallback(async () => {
    try {
      const current = await Location.getForegroundPermissionsAsync();
      if (current.status === Location.PermissionStatus.GRANTED) {
        setLocationGranted(true);
        await reload();
        return true;
      }
      if (
        current.status === Location.PermissionStatus.DENIED &&
        current.canAskAgain === false
      ) {
        setLocationGranted(false);
        if (Platform.OS === 'ios') {
          await Linking.openURL('app-settings:');
        } else {
          await Linking.openSettings();
        }
        return false;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === Location.PermissionStatus.GRANTED;
      setLocationGranted(granted);
      if (granted) await reload();
      return granted;
    } catch {
      setLocationGranted(false);
      return false;
    }
  }, [reload]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    void refreshGpsStatus();
    const id = setInterval(() => void refreshGpsStatus(), 15_000);
    return () => clearInterval(id);
  }, [refreshGpsStatus]);

  const value = useMemo(
    () => ({
      city,
      loading,
      error,
      locationGranted,
      reload,
      refreshGpsStatus,
      requestGps,
    }),
    [
      city,
      loading,
      error,
      locationGranted,
      reload,
      refreshGpsStatus,
      requestGps,
    ],
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
