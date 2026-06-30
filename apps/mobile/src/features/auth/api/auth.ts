import apiClient from '@/shared/api/client';
import { setTokens, clearTokens } from '@/shared/lib/tokens';

export type AccountType = 'PRIVATE' | 'BUSINESS';
export type Role = 'USER' | 'ADMIN';

/** Publiczny kształt użytkownika (zgodny z PublicUser z backendu — bez haseł). */
export interface User {
  id: string;
  email: string;
  role: Role;
  accountType: AccountType;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  companyName: string | null;
  nip: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  settings: Record<string, any> | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  accountType: AccountType;
  companyName?: string;
  nip?: string;
}

/** Logowanie — zapisuje parę tokenów do secure store i zwraca usera. */
export async function login(email: string, password: string): Promise<User> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', {
    email,
    password,
  });
  await setTokens(data.accessToken, data.refreshToken);
  return data.user;
}

/** Rejestracja — backend od razu loguje (zwraca tokeny). */
export async function register(input: RegisterInput): Promise<User> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', input);
  await setTokens(data.accessToken, data.refreshToken);
  return data.user;
}

/** Aktualnie zalogowany użytkownik (na podstawie access tokena z magazynu). */
export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/users/me');
  return data;
}

/** Reset hasła — krok 1: prośba o link (zawsze sukces, anti-enumeration). */
export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

/** Reset hasła — krok 2: ustawienie nowego hasła tokenem z linku. */
export async function resetPassword(token: string, password: string): Promise<void> {
  await apiClient.post('/auth/reset-password', { token, password });
}

/** Ponowne wysłanie linku weryfikacyjnego e-mail (zalogowany). */
export async function resendVerification(): Promise<void> {
  await apiClient.post('/auth/resend-verification');
}

/** Wylogowanie — unieważnia refresh po stronie serwera i czyści magazyn. */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // Nawet gdy serwer nie odpowie, lokalnie czyścimy sesję.
  } finally {
    await clearTokens();
  }
}
