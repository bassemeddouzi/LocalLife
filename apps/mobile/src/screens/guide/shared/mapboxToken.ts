import Constants from 'expo-constants';

/**
 * Public Mapbox access token for MapView.
 * Prefer EXPO_PUBLIC_MAPBOX_TOKEN; app.config also mirrors MAPBOX_TOKEN into extra.
 */
export function getMapboxToken(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_MAPBOX_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  const fromExtra = (
    Constants.expoConfig?.extra as { mapboxToken?: string } | undefined
  )?.mapboxToken?.trim();
  return fromExtra || null;
}
