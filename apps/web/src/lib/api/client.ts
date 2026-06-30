import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokens';

/**
 * Klient API aplikacji web (Next.js). Ten sam backend co mobilka (AdBox API).
 * Autoryzacja przez `Authorization: Bearer <accessToken>`; przy 401 rotacja
 * przez POST /auth/refresh (refresh token w ciele) i ponowienie żądania.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const REQUEST_TIMEOUT = 15000;

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

/** Wywoływane po nieudanym refreshu — pozwala AuthContextowi wyczyścić sesję. */
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(fn: () => void) {
  onSessionExpired = fn;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const url = original?.url ?? '';
    const isAuthRoute =
      url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');

    if (status === 401 && !original._retry && !isAuthRoute && getRefreshToken()) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          waiters.push((token) => (token ? resolve(apiClient(original)) : reject(buildError(error))));
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const res = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken: getRefreshToken() },
          { timeout: REQUEST_TIMEOUT, headers: { 'Content-Type': 'application/json' } },
        );
        const data = res.data as { accessToken?: string; refreshToken?: string };
        if (!data.accessToken) throw new Error('Brak tokena w odpowiedzi refresh.');
        setTokens(data.accessToken, data.refreshToken);
        isRefreshing = false;
        flushWaiters(data.accessToken);
        return apiClient(original);
      } catch (refreshErr) {
        isRefreshing = false;
        flushWaiters(null);
        clearTokens();
        onSessionExpired?.();
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

export function buildError(error: AxiosError): ApiError {
  const data = error.response?.data as { message?: string | string[] } | undefined;
  const message = Array.isArray(data?.message)
    ? data!.message.join('\n')
    : data?.message ?? error.message ?? 'Wystąpił nieoczekiwany błąd.';
  return { success: false, status: error.response?.status, message };
}

export default apiClient;
