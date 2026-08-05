/**
 * Expo app config (dynamic) — supports Google Sign-In iOS URL scheme from env.
 * @type {import('expo/config').ExpoConfig}
 */
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || '';
const iosUrlScheme = iosClientId
  ? `com.googleusercontent.apps.${iosClientId.replace(
      /\.apps\.googleusercontent\.com$/i,
      '',
    )}`
  : undefined;

/** Public Mapbox token (runtime). Accepts EXPO_PUBLIC_ or legacy MAPBOX_TOKEN. */
const mapboxPublicToken =
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN?.trim() ||
  process.env.MAPBOX_TOKEN?.trim() ||
  '';

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: 'LocalLife',
  slug: 'locallife',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'locallife',
  userInterfaceStyle: 'light',
  updates: {
    enabled: false,
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'ai.locallife.app',
  },
  android: {
    package: 'ai.locallife.app',
    softwareKeyboardLayoutMode: 'resize',
    adaptiveIcon: {
      backgroundColor: '#0f766e',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  splash: {
    image: './assets/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0a4f4a',
  },
  plugins: [
    'expo-localization',
    'expo-secure-store',
    'expo-font',
    'expo-web-browser',
    [
      'expo-splash-screen',
      {
        image: './assets/icon.png',
        backgroundColor: '#0a4f4a',
        resizeMode: 'contain',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'LocalLife uses your location to detect where you are and show the right local tips.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'LocalLife uses your photos for place and business submissions.',
      },
    ],
    '@react-native-community/datetimepicker',
    // Always apply — package is a dependency and needs Mapbox Maven repo on Android.
    '@rnmapbox/maps',
    ...(iosUrlScheme
      ? [
          [
            '@react-native-google-signin/google-signin',
            { iosUrlScheme },
          ],
        ]
      : ['@react-native-google-signin/google-signin']),
  ],
  extra: {
    mapboxToken: mapboxPublicToken,
  },
};

module.exports = config;
