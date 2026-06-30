import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { C, SERIF } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useNotifications } from '@/features/notifications/NotificationsContext';
import { fetchNotifications, markAllNotifRead, type AppNotification } from '@/features/notifications/api/notifications';

const zl = (g?: number) => (typeof g === 'number' ? `${(g / 100).toFixed(2).replace('.', ',')} zł` : '');

type Meta = { icon: IconName; tone: string; title: string | ((p: any) => string); sub?: (p: any) => string; nav?: (p: any, n: any) => void };

const META: Record<string, Meta> = {
  LISTING_PUBLISHED: { icon: 'check', tone: '#2A7A4A', title: 'Twoje ogłoszenie zostało opublikowane', sub: (p) => p?.title ?? '', nav: (p, n) => p?.listingId && n.navigate('Produkt', { id: p.listingId }) },
  LISTING_HIDDEN: { icon: 'eye', tone: '#B23B36', title: 'Twoje ogłoszenie zostało ukryte — sprawdź szczegóły', sub: (p) => p?.title ?? '', nav: (_p, n) => n.navigate('MojeOgloszenia') },
  LISTING_LIKED: { icon: 'heart', tone: C.gold, title: 'Twoje ogłoszenie zostało polubione', sub: (p) => p?.title ?? '', nav: (p, n) => p?.listingId && n.navigate('Produkt', { id: p.listingId }) },
  ACCOUNT_BANNED: { icon: 'shield', tone: '#B23B36', title: 'Twoje konto zostało zablokowane', sub: () => 'Skontaktuj się z obsługą, aby poznać szczegóły.' },
  ACCOUNT_UNBANNED: { icon: 'shield', tone: '#2A7A4A', title: 'Twoje konto zostało odblokowane' },
  ORDER_SOLD: { icon: 'box', tone: '#2A7A4A', title: 'Twój przedmiot został sprzedany. Gratulacje!', sub: (p) => p?.title ?? '', nav: (_p, n) => n.navigate('Transakcje') },
  PAYOUT_SUCCESS: { icon: 'wallet', tone: '#2A7A4A', title: 'Twoja wypłata przebiegła pomyślnie', sub: (p) => zl(p?.amount), nav: (_p, n) => n.navigate('Portfel') },
  OFFER_RECEIVED: { icon: 'tag', tone: C.gold, title: (p) => (p?.fromName ? `${p.fromName} złożył ofertę` : 'Otrzymałeś ofertę cenową'), sub: (p) => `${zl(p?.amount)}${p?.listingTitle ? ` · ${p.listingTitle}` : ''}`, nav: (p, n) => (p?.conversationId ? n.navigate('Rozmowa', { conversationId: p.conversationId }) : n.navigate('Tabs', { screen: 'Wiadomości' })) },
  OFFER_ACCEPTED: { icon: 'check', tone: '#2A7A4A', title: 'Twoja oferta została zaakceptowana', sub: (p) => zl(p?.amount), nav: (_p, n) => n.navigate('Tabs', { screen: 'Wiadomości' }) },
  OFFER_REJECTED: { icon: 'x', tone: '#B23B36', title: 'Twoja oferta została odrzucona', nav: (_p, n) => n.navigate('Tabs', { screen: 'Wiadomości' }) },
  OFFER_COUNTERED: { icon: 'tag', tone: C.gold, title: 'Otrzymałeś kontrofertę', sub: (p) => zl(p?.amount), nav: (_p, n) => n.navigate('Tabs', { screen: 'Wiadomości' }) },
  MESSAGE: { icon: 'chat', tone: C.gold, title: (p) => (p?.fromName ? `Masz nową wiadomość od ${p.fromName}` : 'Masz nową wiadomość'), nav: (p, n) => (p?.conversationId ? n.navigate('Rozmowa', { conversationId: p.conversationId }) : n.navigate('Tabs', { screen: 'Wiadomości' })) },
  RESERVATION_REQUESTED: { icon: 'clock', tone: C.gold, title: 'Masz nową prośbę o rezerwację', sub: (p) => p?.title ?? '', nav: (_p, n) => n.navigate('Tabs', { screen: 'Wiadomości' }) },
  RESERVATION_ACCEPTED: { icon: 'check', tone: '#2A7A4A', title: 'Twoja rezerwacja została zaakceptowana', nav: (_p, n) => n.navigate('Tabs', { screen: 'Wiadomości' }) },
  RESERVATION_REJECTED: { icon: 'x', tone: '#B23B36', title: 'Twoja prośba o rezerwację została odrzucona', nav: (_p, n) => n.navigate('Tabs', { screen: 'Wiadomości' }) },
  RESERVATION_CANCELLED: { icon: 'clock', tone: C.muted, title: 'Rezerwacja została wycofana', nav: (_p, n) => n.navigate('Tabs', { screen: 'Wiadomości' }) },
};

function relTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'teraz';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} godz.`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d} dni` : new Date(iso).toLocaleDateString('pl-PL');
}

/** Powiadomienia — lista; otwarcie oznacza wszystkie jako przeczytane. */
export function NotificationsScreen() {
  const { user } = useAuth();
  const { refresh: refreshBadge } = useNotifications();
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await fetchNotifications();
      setItems(list);
      if (list.some((n) => !n.readAt)) { await markAllNotifRead(); refreshBadge(); }
    } catch { setItems([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [refreshBadge]);

  useFocusEffect(useCallback(() => { if (user) load(); else setLoading(false); }, [user, load]));

  if (loading) return <View style={s.center}><ActivityIndicator color={C.gold} /></View>;

  if (items.length === 0) {
    return (
      <View style={s.center}>
        <View style={s.emptyIcon}><Icon name="bell" size={28} color={C.gold} /></View>
        <Text style={s.emptyTitle}>Brak powiadomień</Text>
        <Text style={s.emptySub}>Tu pojawią się informacje o Twoich ogłoszeniach, ofertach i koncie.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.gold} />}
    >
      {items.map((n) => {
        const m = META[n.type] ?? { icon: 'bell' as IconName, tone: C.gold, title: n.type };
        const title = typeof m.title === 'function' ? m.title(n.payload ?? {}) : m.title;
        const sub = m.sub?.(n.payload ?? {});
        return (
          <TouchableOpacity key={n.id} style={[s.row, !n.readAt && s.rowUnread]} activeOpacity={0.7}
            onPress={() => m.nav?.(n.payload ?? {}, navigation)}>
            <View style={[s.icon, { backgroundColor: m.tone + '1A' }]}><Icon name={m.icon} size={18} color={m.tone} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{title}</Text>
              {sub ? <Text style={s.sub} numberOfLines={1}>{sub}</Text> : null}
              <Text style={s.time}>{relTime(n.createdAt)}</Text>
            </View>
            {!n.readAt && <View style={s.dot} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontFamily: SERIF, fontSize: 20, fontWeight: '700', color: C.ink },
  emptySub: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 6, lineHeight: 20, maxWidth: 280 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 14, marginBottom: 10 },
  rowUnread: { backgroundColor: 'rgba(242,233,213,0.45)', borderColor: C.gold },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '700', color: C.ink, lineHeight: 19 },
  sub: { fontSize: 13, color: C.inkSoft, marginTop: 2 },
  time: { fontSize: 11, color: C.muted, marginTop: 4 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.gold },
});
