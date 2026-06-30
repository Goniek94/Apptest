import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useRealtimeEvent } from '@/shared/realtime/RealtimeContext';
import { fetchNotifUnreadCount } from '@/features/notifications/api/notifications';

const Ctx = createContext<{ unread: number; refresh: () => void }>({ unread: 0, refresh: () => {} });

/** Licznik nieprzeczytanych powiadomień — zasila badge przy dzwonku. */
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) { setUnread(0); return; }
    try { setUnread(await fetchNotifUnreadCount()); } catch { /* ignore */ }
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const onRt = useCallback(() => { refresh(); }, [refresh]);
  useRealtimeEvent('notification:new', onRt);

  return <Ctx.Provider value={{ unread, refresh }}>{children}</Ctx.Provider>;
}

export const useNotifications = () => useContext(Ctx);
