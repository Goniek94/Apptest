import apiClient from './client';
import { setTokens, clearTokens } from './tokens';

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
  settings: Record<string, any> | null;
  ratingAvg?: number;
  ratingCount?: number;
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

export async function apiLogin(email: string, password: string): Promise<User> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
  setTokens(data.accessToken, data.refreshToken);
  return data.user;
}

export async function apiRegister(input: RegisterInput): Promise<User> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', input);
  setTokens(data.accessToken, data.refreshToken);
  return data.user;
}

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/users/me');
  return data;
}

export async function apiLogout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // nawet gdy serwer nie odpowie — czyścimy lokalnie
  } finally {
    clearTokens();
  }
}
