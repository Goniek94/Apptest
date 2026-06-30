import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Magazyn tokenów — mobilny odpowiednik HttpOnly cookies z weba.
 *
 * Natywnie: bezpieczna enklawa urządzenia (iOS Keychain / Android Keystore) przez
 * expo-secure-store. Na web (podgląd w przeglądarce): localStorage — secure-store
 * nie działa na web. W obu wypadkach tokeny są dublowane w pamięci, aby interceptor
 * żądań mógł dołączyć Bearer synchronicznie.
 */
const ACCESS_KEY = 'mm_access_token';
const REFRESH_KEY = 'mm_refresh_token';

// Web nie ma secure-store — fallback na localStorage z tym samym async API.
const webStore = {
  getItemAsync: async (k: string) =>
    typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null,
  setItemAsync: async (k: string, v: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(k, v);
  },
  deleteItemAsync: async (k: string) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(k);
  },
};

const store = Platform.OS === 'web' ? webStore : SecureStore;

let accessToken: string | null = null;
let refreshToken: string | null = null;

/** Wczytaj tokeny z magazynu do pamięci (raz, przy starcie). */
export async function loadTokens(): Promise<void> {
  accessToken = await store.getItemAsync(ACCESS_KEY);
  refreshToken = await store.getItemAsync(REFRESH_KEY);
}

/** Zapisz świeżą parę tokenów (refresh opcjonalny przy czystej rotacji access). */
export async function setTokens(access: string, refresh?: string | null): Promise<void> {
  accessToken = access;
  await store.setItemAsync(ACCESS_KEY, access);
  if (refresh) {
    refreshToken = refresh;
    await store.setItemAsync(REFRESH_KEY, refresh);
  }
}

/** Wyczyść wszystko (wylogowanie / nieudany refresh). */
export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  await store.deleteItemAsync(ACCESS_KEY);
  await store.deleteItemAsync(REFRESH_KEY);
}

export const getAccessToken = (): string | null => accessToken;
export const getRefreshToken = (): string | null => refreshToken;
