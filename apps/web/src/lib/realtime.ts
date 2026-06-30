'use client';
import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_URL } from './api/client';
import { getAccessToken } from './api/tokens';

/** Adres serwera socket.io = origin API (bez prefiksu /api/v1). */
const SOCKET_URL = API_URL.replace(/\/api\/v1\/?$/, '');

let socket: Socket | null = null;

/** Singleton połączenia WebSocket dla zalogowanego użytkownika (token w handshake). */
export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  const token = getAccessToken();
  if (!token || !SOCKET_URL) return null;
  if (!socket) {
    socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'], reconnection: true });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

/** Subskrypcja zdarzenia realtime (handler najlepiej owinąć w useCallback). */
export function useRealtimeEvent(event: string, handler: (payload: any) => void) {
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    s.on(event, handler);
    return () => { s.off(event, handler); };
  }, [event, handler]);
}
