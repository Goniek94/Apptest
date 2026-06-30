import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Konfiguracja aplikacji.
 *
 * • Web (podgląd w przeglądarce): host, na którym otwarta jest strona + port 4000.
 * • Natywnie (telefon): AUTOMATYCZNIE bierzemy IP komputera, na którym chodzi Metro
 *   (ten sam, co serwer Expo) — dzięki temu nie trzeba ręcznie aktualizować .env
 *   przy każdej zmianie IP. Awaryjnie: EXPO_PUBLIC_API_URL z .env.
 */
function metroHost(): string | null {
  const uri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.debuggerHost ??
    (Constants as any).manifest?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (typeof uri !== 'string') return null;
  const host = uri.split(':')[0];
  return host && host !== 'localhost' && host !== '127.0.0.1' ? host : null;
}

function resolveApiUrl(): string {
  // 1) Jawny ZDALNY backend (np. Railway, https) ma najwyższy priorytet — działa wszędzie,
  //    także w Expo Go na telefonie klienta poza naszą siecią.
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit && explicit.startsWith('https://')) return explicit;
  // 2) Web (podgląd w przeglądarce): host strony + port 4000.
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:4000/api/v1`;
  }
  // 3) Natywnie w dev: automatycznie IP komputera, na którym chodzi Metro.
  const host = metroHost();
  if (host) return `http://${host}:4000/api/v1`;
  // 4) Awaryjnie: cokolwiek z .env.
  return explicit ?? '';
}

export const API_URL = resolveApiUrl();

export const REQUEST_TIMEOUT = 20_000;

if (!API_URL && __DEV__) {
  // eslint-disable-next-line no-console
  console.warn(
    '[config] Brak adresu API — na telefonie ustaw EXPO_PUBLIC_API_URL (.env) na adres ' +
      'LAN komputera z prefiksem /api/v1 (nie localhost).',
  );
}
