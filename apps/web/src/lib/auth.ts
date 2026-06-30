'use client';
import { useEffect, useState } from 'react';
import {
  apiLogin,
  apiRegister,
  apiLogout,
  fetchMe,
  type User,
  type RegisterInput,
} from './api/auth';
import { getAccessToken } from './api/tokens';
import { setSessionExpiredHandler } from './api/client';

const EVT = 'mm-auth-change';

// ─── Globalny store sesji (moduł = jedno źródło prawdy) ────────────────────
let currentUser: User | null = null;
let hydrated = false;

function emit() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVT));
}

export function isLoggedIn(): boolean {
  return typeof window !== 'undefined' && !!getAccessToken();
}

export function getCurrentUser(): User | null {
  return currentUser;
}

/** Pobranie aktualnego usera z tokena (raz, przy starcie aplikacji). */
export async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  if (!getAccessToken()) {
    emit();
    return;
  }
  try {
    currentUser = await fetchMe();
  } catch {
    currentUser = null;
  }
  emit();
}

export async function signIn(email: string, password: string): Promise<User> {
  currentUser = await apiLogin(email, password);
  hydrated = true;
  emit();
  return currentUser;
}

export async function signUp(input: RegisterInput): Promise<User> {
  currentUser = await apiRegister(input);
  hydrated = true;
  emit();
  return currentUser;
}

export async function logout(): Promise<void> {
  await apiLogout();
  currentUser = null;
  emit();
}

// Po nieudanym refreshu (interceptor) — sesja martwa.
if (typeof window !== 'undefined') {
  setSessionExpiredHandler(() => {
    currentUser = null;
    emit();
  });
}

/** Hook SSR-safe: czy zalogowany. Pierwszy render = false (zgodnie z serwerem). */
export function useAuth(): boolean {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    const sync = () => setAuthed(isLoggedIn());
    void hydrate();
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return authed;
}

/** Hook: aktualny użytkownik + czy sesja już zhydratyzowana. */
export function useCurrentUser(): { user: User | null; hydrated: boolean } {
  const [state, setState] = useState<{ user: User | null; hydrated: boolean }>({
    user: currentUser,
    hydrated,
  });
  useEffect(() => {
    const sync = () => setState({ user: currentUser, hydrated });
    void hydrate();
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return state;
}

/* ---- Modal logowania (globalny) ---- */
export type AuthMode = 'login' | 'register';
const MODAL_EVT = 'mm-auth-modal';
let modal: { open: boolean; mode: AuthMode } = { open: false, mode: 'login' };

export function openAuth(mode: AuthMode = 'login') {
  modal = { open: true, mode };
  window.dispatchEvent(new Event(MODAL_EVT));
}
export function closeAuth() {
  modal = { ...modal, open: false };
  window.dispatchEvent(new Event(MODAL_EVT));
}
export function useAuthModal(): { open: boolean; mode: AuthMode } {
  const [state, setState] = useState(modal);
  useEffect(() => {
    const sync = () => setState({ ...modal });
    window.addEventListener(MODAL_EVT, sync);
    return () => window.removeEventListener(MODAL_EVT, sync);
  }, []);
  return state;
}
