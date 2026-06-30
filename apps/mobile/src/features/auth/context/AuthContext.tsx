import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadTokens, getAccessToken } from '@/shared/lib/tokens';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  fetchMe,
  type User,
  type RegisterInput,
} from '@/features/auth/api/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (u: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  setUser: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Start: wczytaj tokeny z secure store i spróbuj odtworzyć sesję.
  useEffect(() => {
    (async () => {
      await loadTokens();
      if (getAccessToken()) {
        try {
          setUser(await fetchMe());
        } catch {
          // token wygasł/nieprawidłowy — klient wyczyścił tokeny, zostajemy wylogowani
        }
      }
      setLoading(false);
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    setUser(await apiLogin(email, password));
  };

  const signUp = async (input: RegisterInput) => {
    setUser(await apiRegister(input));
  };

  const signOut = async () => {
    await apiLogout();
    setUser(null);
  };

  // Pobierz świeże dane usera (po edycji profilu/ustawień).
  const refreshUser = async () => {
    try { setUser(await fetchMe()); } catch { /* sesja wygasła — zostaje stary stan */ }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
