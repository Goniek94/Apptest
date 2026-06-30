import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useRealtimeEvent } from '@/shared/realtime/RealtimeContext';
import { fetchUnreadCount } from '@/features/messages/api/messages';

const UnreadContext = createContext<{ unread: number; refresh: () => void }>({ unread: 0, refresh: () => {} });

/**
 * Globalny licznik nieprzeczytanych wiadomości — zasila badge przy zakładce „Czat"
 * i w Profilu. Odświeża się po zalogowaniu i na zdarzeniach realtime.
 */
export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) { setUnread(0); return; }
    try { setUnread(await fetchUnreadCount()); } catch { /* ignorujemy */ }
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const onRt = useCallback(() => { refresh(); }, [refresh]);
  useRealtimeEvent('message:new', onRt);
  useRealtimeEvent('conversation:update', onRt);
  useRealtimeEvent('notification:new', onRt);

  return <UnreadContext.Provider value={{ unread, refresh }}>{children}</UnreadContext.Provider>;
}

export const useUnread = () => useContext(UnreadContext);
