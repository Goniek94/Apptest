import React, { useCallback, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { C, SERIF } from '@/shared/theme';
import { Icon } from '@/shared/ui/Icon';
import { useAuth } from '@/features/auth/context/AuthContext';
import { fetchMyOrders, type ApiOrder, type OrderStatus } from '@/features/orders/api/orders';

const zl = (g: number) => `${(g / 100).toFixed(2).replace('.', ',')} zł`;
type Tab = 'bought' | 'sold';

const STATUS: Record<OrderStatus, { label: string; bg: string; fg: string }> = {
  PENDING: { label: 'Oczekuje na płatność', bg: C.goldSoft, fg: C.goldDeep },
  PAID: { label: 'Opłacone', bg: '#E6EEF6', fg: '#3B6CA8' },
  SHIPPED: { label: 'Wysłane', bg: '#E6EEF6', fg: '#3B6CA8' },
  DELIVERED: { label: 'Dostarczone', bg: 'rgba(42,122,74,0.12)', fg: '#2A7A4A' },
  COMPLETED: { label: 'Zakończone', bg: 'rgba(42,122,74,0.12)', fg: '#2A7A4A' },
  CANCELLED: { label: 'Anulowane', bg: C.line, fg: C.muted },
  REFUNDED: { label: 'Zwrot', bg: 'rgba(178,59,54,0.1)', fg: '#B23B36' },
  DISPUTED: { label: 'Spór', bg: 'rgba(178,59,54,0.1)', fg: '#B23B36' },
};

/** Transakcje — zakupy i sprzedaże użytkownika (lista zamówień). */
export function TransakcjeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<Tab>('bought');
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setOrders(await fetchMyOrders()); } catch { setOrders([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { if (user) load(); else setLoading(false); }, [user, load]));

  const list = orders.filter((o) => (tab === 'bought' ? o.buyerId === user?.id : o.sellerId === user?.id));

  if (loading) return <View style={s.center}><ActivityIndicator color={C.gold} /></View>;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.gold} />}
    >
      <View style={s.tabs}>
        {(['bought', 'sold'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabOn]} onPress={() => setTab(t)} activeOpacity={0.8}>
            <Text style={[s.tabText, tab === t && s.tabTextOn]}>{t === 'bought' ? 'Kupione' : 'Sprzedane'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {list.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIcon}><Icon name="box" size={28} color={C.gold} /></View>
          <Text style={s.emptyTitle}>{tab === 'bought' ? 'Brak zakupów' : 'Brak sprzedaży'}</Text>
          <Text style={s.emptySub}>
            {tab === 'bought'
              ? 'Twoje zakupy pojawią się tutaj. Przeglądaj oferty i kupuj bezpiecznie.'
              : 'Tu zobaczysz przedmioty, które sprzedasz. Wystaw ogłoszenie, aby zacząć.'}
          </Text>
          <TouchableOpacity style={s.cta} onPress={() => navigation.navigate(tab === 'bought' ? 'Sklep' : 'Sprzedaj')} activeOpacity={0.85}>
            <Text style={s.ctaText}>{tab === 'bought' ? 'Przeglądaj ogłoszenia' : 'Wystaw ogłoszenie'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        list.map((o) => {
          const st = STATUS[o.status];
          const other = tab === 'bought' ? o.seller : o.buyer;
          return (
            <TouchableOpacity key={o.id} style={s.row} activeOpacity={0.85} onPress={() => navigation.navigate('Produkt', { id: o.listing.id })}>
              {o.listing.images[0] ? <Image source={{ uri: o.listing.images[0].url }} style={s.img} /> : <View style={s.img} />}
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={s.rowTop}>
                  <Text style={s.title} numberOfLines={1}>{o.listing.title}</Text>
                  <View style={[s.badge, { backgroundColor: st.bg }]}><Text style={[s.badgeText, { color: st.fg }]}>{st.label}</Text></View>
                </View>
                <Text style={s.price}>{zl(o.amount)}</Text>
                <Text style={s.meta}>{tab === 'bought' ? 'Sprzedający' : 'Kupujący'}: {other.displayName} · {new Date(o.createdAt).toLocaleDateString('pl-PL')}</Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 999, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: 'center' },
  tabOn: { backgroundColor: C.gold },
  tabText: { fontSize: 13, fontWeight: '700', color: C.inkSoft },
  tabTextOn: { color: '#fff' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontFamily: SERIF, fontSize: 20, fontWeight: '700', color: C.ink },
  emptySub: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 6, lineHeight: 20, maxWidth: 290 },
  cta: { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 26, marginTop: 20 },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  row: { flexDirection: 'row', gap: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 12, marginBottom: 10 },
  img: { width: 64, height: 76, borderRadius: 10, backgroundColor: C.goldSoft },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, fontFamily: SERIF, fontSize: 15, fontWeight: '700', color: C.ink },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  price: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', color: C.ink, marginTop: 4 },
  meta: { fontSize: 12, color: C.muted, marginTop: 4 },
});
