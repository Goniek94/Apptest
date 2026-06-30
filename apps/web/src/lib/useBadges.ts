'use client';
import { useCallback, useEffect, useState } from 'react';
import { useCurrentUser } from './auth';
import { useRealtimeEvent } from './realtime';
import { fetchUnreadCount } from './api/messages';
import { fetchNotifUnreadCount } from './api/notifications';

/**
 * Liczniki dla nagłówka: nieprzeczytane wiadomości + powiadomienia.
 * Odświeża się przy zdarzeniach realtime; `total` sumuje oba (badge na awatarze).
 */
export function useBadges() {
  const { user } = useCurrentUser();
  const [messages, setMessages] = useState(0);
  const [notifications, setNotifications] = useState(0);

  const refresh = useCallback(() => {
    if (!user) { setMessages(0); setNotifications(0); return; }
    fetchUnreadCount().then(setMessages).catch(() => {});
    fetchNotifUnreadCount().then(setNotifications).catch(() => {});
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useRealtimeEvent('message:new', refresh);
  useRealtimeEvent('conversation:update', refresh);
  useRealtimeEvent('notification:new', refresh);

  return { messages, notifications, total: messages + notifications, refresh };
}
