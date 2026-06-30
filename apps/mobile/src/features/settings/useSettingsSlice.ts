import { useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { updateMe } from '@/features/profile/api/users';

/**
 * Trzyma jedną sekcję ustawień użytkownika (np. „notifications"), inicjowaną z `user.settings`,
 * i zapisuje zmiany przez PATCH /users/me (optymistycznie — UI reaguje od razu).
 */
export function useSettingsSlice<T extends object>(key: string, defaults: T) {
  const { user, setUser } = useAuth();
  const saved = ((user?.settings?.[key] as Partial<T> | undefined) ?? {});
  const [val, setVal] = useState<T>({ ...defaults, ...saved });

  const update = (patch: Partial<T>) => {
    const next = { ...val, ...patch };
    setVal(next);
    const settings = { ...(user?.settings ?? {}), [key]: next };
    if (user) setUser({ ...user, settings });
    updateMe({ settings }).catch(() => { /* zapis w tle — przy błędzie zostaje stan lokalny */ });
  };

  return [val, update] as const;
}
