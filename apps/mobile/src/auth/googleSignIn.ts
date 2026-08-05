/**
 * Native Google Sign-In (account sheet).
 * Requires a development / production build — not Expo Go.
 * Native module is loaded lazily so Expo Go still boots.
 */
import Constants from 'expo-constants';

export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

export function getGoogleWebClientId(): string | undefined {
  const id = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  return id || undefined;
}

export function isGoogleConfigured(): boolean {
  return Boolean(getGoogleWebClientId());
}

export type GoogleIdTokenResult =
  | { ok: true; idToken: string }
  | {
      ok: false;
      reason:
        | 'expo_go'
        | 'cancelled'
        | 'no_token'
        | 'config'
        | 'play_services'
        | 'unknown';
      message?: string;
    };

type GoogleNative = typeof import('@react-native-google-signin/google-signin');

function loadGoogleNative(): GoogleNative | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-google-signin/google-signin') as GoogleNative;
  } catch {
    return null;
  }
}

let configured = false;

function ensureGoogleConfigured(
  GoogleSignin: GoogleNative['GoogleSignin'],
): void {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: getGoogleWebClientId(),
    iosClientId:
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || undefined,
    offlineAccess: false,
  });
  configured = true;
}

/**
 * Clears the native Google session so the next sign-in can pick another account.
 */
export async function signOutFromGoogle(): Promise<void> {
  if (isExpoGo() || !isGoogleConfigured()) return;
  const google = loadGoogleNative();
  if (!google) return;
  const { GoogleSignin } = google;
  try {
    ensureGoogleConfigured(GoogleSignin);
    // revokeAccess forces the account picker on next sign-in
    try {
      await GoogleSignin.revokeAccess();
    } catch {
      // ignore if already revoked / never signed in
    }
    await GoogleSignin.signOut();
  } catch {
    // ignore — local app logout must still succeed
  }
}

/**
 * Opens the native Google account picker and returns an ID token for our API.
 */
export async function signInWithGoogleNative(): Promise<GoogleIdTokenResult> {
  if (isExpoGo()) {
    return { ok: false, reason: 'expo_go' };
  }
  if (!isGoogleConfigured()) {
    return { ok: false, reason: 'config' };
  }

  const google = loadGoogleNative();
  if (!google) {
    return {
      ok: false,
      reason: 'unknown',
      message: 'Google Sign-In native module is unavailable in this build.',
    };
  }

  const {
    GoogleSignin,
    isErrorWithCode,
    isSuccessResponse,
    statusCodes,
  } = google;

  try {
    ensureGoogleConfigured(GoogleSignin);

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return { ok: false, reason: 'cancelled' };
    }
    let idToken = response.data.idToken;
    if (!idToken) {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens.idToken;
    }
    if (!idToken) {
      return { ok: false, reason: 'no_token' };
    }
    return { ok: true, idToken };
  } catch (e) {
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        return { ok: false, reason: 'cancelled' };
      }
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { ok: false, reason: 'play_services' };
      }
      return {
        ok: false,
        reason: 'unknown',
        message: e.message || String(e.code),
      };
    }
    return {
      ok: false,
      reason: 'unknown',
      message: e instanceof Error ? e.message : String(e),
    };
  }
}
