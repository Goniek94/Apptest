import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL, REQUEST_TIMEOUT } from '@/shared/config';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '@/shared/lib/tokens';

/**
 * Klient API aplikacji mobilnej.
 *
 * Telefon nie ma cookie jar ani powierzchni CSRF, więc:
 *   • Autoryzacja jedzie w nagłówku `Authorization: Bearer <accessToken>`.
 *   • Przy 401 robimy rotację przez POST /auth/refresh z refresh tokenem
 *     W CIELE żądania, zapisujemy nową parę do secure store i ponawiamy.
 *
 * Backend (AdBox API) zwraca tokeny w camelCase: { accessToken, refreshToken }.
 */
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Pojedyncze odświeżanie (single-flight) ────────────────────────────────
let isRefreshing = false;
let waiters: Array<(token: string | null) => void> = [];

function flushWaiters(token: string | null) {
  waiters.forEach((cb) => cb(token));
  waiters = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const status = error.response?.status;
    const url = original?.url ?? '';
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh');

    if (status === 401 && !original._retry && !isAuthRoute && getRefreshToken()) {
      if (isRefreshing) {
        // Stań w kolejce do trwającego refreshu, potem ponów.
        return new Promise((resolve, reject) => {
          waiters.push((token) =>
            token ? resolve(apiClient(original)) : reject(buildError(error)),
          );
        });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        // Goły axios, żeby to żądanie nie weszło ponownie w interceptor.
        const res = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken: getRefreshToken() },
          { timeout: REQUEST_TIMEOUT, headers: { 'Content-Type': 'application/json' } },
        );
        const data = res.data as { accessToken?: string; refreshToken?: string };
        if (!data.accessToken) throw new Error('Brak tokena w odpowiedzi refresh.');
        await setTokens(data.accessToken, data.refreshToken);
        isRefreshing = false;
        flushWaiters(data.accessToken);
        return apiClient(original);
      } catch (refreshErr) {
        isRefreshing = false;
        flushWaiters(null);
        await clearTokens(); // sesja martwa — AuthContext odeśle do logowania
        return Promise.reject(buildError(error));
      }
    }

    return Promise.reject(buildError(error));
  },
);

export interface ApiError {
  success: false;
  status?: number;
  message: string;
}

function buildError(error: AxiosError): ApiError {
  const data = error.response?.data as { message?: string | string[] } | undefined;
  const message = Array.isArray(data?.message)
    ? data!.message.join('\n')
    : data?.message ?? error.message ?? 'Wystąpił nieoczekiwany błąd.';
  return { success: false, status: error.response?.status, message };
}

export default apiClient;
