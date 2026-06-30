import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_URL } from '@/shared/config';
import { getAccessToken } from '@/shared/lib/tokens';
import { useAuth } from '@/features/auth/context/AuthContext';

/** Adres serwera socket.io = origin API (bez prefiksu /api/v1). */
const SOCKET_URL = API_URL.replace(/\/api\/v1\/?$/, '');

const SocketContext = createContext<Socket | null>(null);

/**
 * Utrzymuje połączenie WebSocket dla zalogowanego użytkownika.
 * Łączy się po zalogowaniu (token w handshake) i rozłącza po wylogowaniu.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!user || !token || !SOCKET_URL) return;

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
    });
    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user?.id]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);

/**
 * Subskrypcja zdarzenia realtime. `handler` najlepiej owinąć w useCallback,
 * by uniknąć zbędnych re-subskrypcji.
 */
export function useRealtimeEvent(event: string, handler: (payload: any) => void) {
  const socket = useSocket();
  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler]);
}
