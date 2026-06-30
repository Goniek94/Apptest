/** Przechowywanie pary tokenów w przeglądarce (localStorage). SSR-safe. */
const ACCESS = 'mm_access';
const REFRESH = 'mm_refresh';

const hasWindow = () => typeof window !== 'undefined';

export function getAccessToken(): string | null {
  return hasWindow() ? localStorage.getItem(ACCESS) : null;
}

export function getRefreshToken(): string | null {
  return hasWindow() ? localStorage.getItem(REFRESH) : null;
}

export function setTokens(access: string, refresh?: string): void {
  if (!hasWindow()) return;
  localStorage.setItem(ACCESS, access);
  if (refresh) localStorage.setItem(REFRESH, refresh);
}

export function clearTokens(): void {
  if (!hasWindow()) return;
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
}
