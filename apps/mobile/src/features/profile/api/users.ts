import apiClient from '@/shared/api/client';
import type { User } from '@/features/auth/api/auth';

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  companyName?: string;
  nip?: string;
  settings?: Record<string, any>;
}

/** Aktualizacja profilu zalogowanego użytkownika (PATCH /users/me). */
export async function updateMe(input: UpdateProfileInput): Promise<User> {
  const { data } = await apiClient.patch<User>('/users/me', input);
  return data;
}
