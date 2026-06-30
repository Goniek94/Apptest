import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, SERIF } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Avatar } from '@/shared/ui';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useUnread } from '@/features/messages/UnreadContext';
import { fetchMyOrders } from '@/features/orders/api/orders';
import { fetchMyListings } from '@/features/catalog/api/listings';
import { fetchMe } from '@/features/auth/api/auth';

type Stat = { icon: IconName; label: string; value: string; delta?: string };

const STATS_BASE: Stat[] = [
  { icon: 'bag', label: 'Zakupy', value: '—' },
  { icon: 'tag', label: 'Sprzedaże', value: '—' },
  { icon: 'list', label: 'Aktywne ogłoszenia', value: '—' },
  { icon: 'star', label: 'Opinie', value: '—' },
];

const QUICK: { icon: IconName; label: string; route?: string; adminOnly?: boolean }[] = [
  { icon: 'list', label: 'Moje ogłoszenia', route: 'MojeOgloszenia' },
  { icon: 'plus', label: 'Dodaj ogłoszenie', route: 'Sprzedaj' },
  { icon: 'box', label: 'Transakcje', route: 'Transakcje' },
  { icon: 'heart', label: 'Ulubione', route: 'Ulubione' },
  { icon: 'chat', label: 'Wiadomości', route: 'Wiadomości' },
  { icon: 'wallet', label: 'Portfel', route: 'Portfel' },
  { icon: 'settings', label: 'Ustawienia konta', route: 'Ustawienia' },
  { icon: 'help', label: 'Pomoc', route: 'Pomoc' },
  { icon: 'dashboard', label: 'Panel administracyjny', route: 'Admin', adminOnly: true },
];

/** Profil — gość widzi zaproszenie do logowania, zalogowany pełny panel (1:1 z weba). */
export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { unread } = useUnread();
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<Stat[]>(STATS_BASE);

  // Realne statystyki: zakupy/sprzedaże z zamówień, aktywne ogłoszenia z /listings/mine,
  // ocena z /users/me. Delta „vs zeszły mies." liczona z dat zamówień (tylko gdy jest baza).
  useEffect(() => {
    if (!user) return;
    const uid = user.id;
    let cancelled = false;
    (async () => {
      const [orders, listings, me] = await Promise.all([
        fetchMyOrders().catch(() => []),
        fetchMyListings().catch(() => []),
        fetchMe().catch(() => null),
      ]);
      if (cancelled) return;
      const now = new Date();
      const inMonth = (iso: string, back: number) => {
        const d = new Date(iso);
        const m = new Date(now.getFullYear(), now.getMonth() - back, 1);
        return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
      };
      const pct = (cur: number, prev: number): string | undefined =>
        prev > 0 ? `${cur - prev >= 0 ? '+' : ''}${Math.round(((cur - prev) / prev) * 100)}%` : undefined;

      const purchases = orders.filter((o) => o.buyerId === uid);
      const sales = orders.filter((o) => o.sellerId === uid);
      const active = listings.filter((l) => l.status === 'ACTIVE').length;
      const ratingAvg = me?.ratingAvg ?? 0;
      const ratingCount = me?.ratingCount ?? 0;

      setStats([
        { icon: 'bag', label: 'Zakupy', value: String(purchases.length),
          delta: pct(purchases.filter((o) => inMonth(o.createdAt, 0)).length, purchases.filter((o) => inMonth(o.createdAt, 1)).length) },
        { icon: 'tag', label: 'Sprzedaże', value: String(sales.length),
          delta: pct(sales.filter((o) => inMonth(o.createdAt, 0)).length, sales.filter((o) => inMonth(o.createdAt, 1)).length) },
        { icon: 'list', label: 'Aktywne ogłoszenia', value: String(active) },
        { icon: 'star', label: 'Opinie', value: ratingCount > 0 ? `${ratingAvg.toFixed(1).replace('.', ',')} / 5` : 'Brak ocen' },
      ]);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) {
    return (
      <View style={p.guest}>
        <View style={p.guestAvatar}><Icon name="user" size={30} color={C.gold} /></View>
        <Text style={p.guestTitle}>Witaj w AdBox</Text>
        <Text style={p.guestSub}>Zaloguj się, aby kupować, sprzedawać, zapisywać ulubione i pisać wiadomości.</Text>
        <TouchableOpacity style={p.cta} onPress={() => navigation.navigate('Auth')} activeOpacity={0.85}>
          <Text style={p.ctaText}>Zaloguj się lub załóż konto</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const onQuick = (item: (typeof QUICK)[number]) => {
    if (item.route) navigation.navigate(item.route);
    else Alert.alert('Wkrótce', 'Ta sekcja będzie dostępna w kolejnej aktualizacji.');
  };
  const quick = QUICK.filter((q) => !q.adminOnly || user.role === 'ADMIN');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      {/* Karta powitalna */}
      <View style={p.welcome}>
        <View style={p.welcomeBg} pointerEvents="none">
          <Icon name="hanger" size={150} color={C.gold} />
        </View>
        <Avatar name={user.displayName} src={user.avatarUrl ?? undefined} size={78} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={p.welcomeName} numberOfLines={1}>{user.displayName}</Text>
          <View style={p.verifiedRow}>
            <Icon name="award" size={15} color={C.gold} />
            <Text style={p.verifiedText}>{user.accountType === 'BUSINESS' ? 'Konto firmowe' : 'Zweryfikowany'}</Text>
          </View>
          <Text style={p.welcomeSub}>Witaj ponownie w swoim panelu użytkownika.</Text>
        </View>
      </View>

      {/* Staty 2×2 */}
      <View style={p.statsGrid}>
        {stats.map((st) => {
          const up = st.delta ? !st.delta.startsWith('-') : true;
          const col = up ? '#2A7A4A' : '#B23B36';
          return (
            <View key={st.label} style={p.statCard}>
              <View style={p.statIcon}><Icon name={st.icon} size={17} color={C.gold} /></View>
              <Text style={p.statLabel}>{st.label}</Text>
              <Text style={p.statValue}>{st.value}</Text>
              {st.delta ? (
                <View style={p.statGrowthRow}>
                  <Icon name="chart" size={11} color={col} />
                  <Text style={[p.statGrowth, { color: col }]}>{st.delta}</Text>
                  <Text style={p.statGrowthMuted}>vs. zeszły mies.</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Szybki dostęp */}
      <View style={p.quickCard}>
        <Text style={p.quickTitle}>Szybki dostęp</Text>
        {quick.map((m, i) => (
          <TouchableOpacity key={m.label} style={[p.quickRow, i > 0 && p.quickDivider]} activeOpacity={0.7} onPress={() => onQuick(m)}>
            <View style={p.quickIcon}><Icon name={m.icon} size={18} color={C.gold} /></View>
            <Text style={p.quickLabel}>{m.label}</Text>
            {m.label === 'Wiadomości' && unread > 0 && (
              <View style={p.quickBadge}><Text style={p.quickBadgeText}>{unread > 9 ? '9+' : unread}</Text></View>
            )}
            <Icon name="chevronRight" size={18} color={C.muted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Wyloguj */}
      <TouchableOpacity style={p.logout} onPress={signOut} activeOpacity={0.85}>
        <View style={p.logoutIcon}><Icon name="logout" size={18} color="#B23B36" /></View>
        <Text style={p.logoutText}>Wyloguj się</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const p = StyleSheet.create({
  welcome: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'rgba(242,233,213,0.6)', borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 16, marginBottom: 16, overflow: 'hidden' },
  welcomeBg: { position: 'absolute', right: -20, top: 0, bottom: 0, justifyContent: 'center', opacity: 0.12 },
  welcomeName: { fontFamily: SERIF, fontSize: 22, fontWeight: '700', color: C.ink },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  verifiedText: { color: C.gold, fontSize: 14, fontWeight: '700' },
  welcomeSub: { fontSize: 13, color: C.inkSoft, marginTop: 6 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { width: '47%', flexGrow: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 14 },
  statIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statLabel: { fontSize: 12, color: C.muted },
  statValue: { fontFamily: SERIF, fontSize: 24, fontWeight: '700', color: C.ink, marginTop: 2 },
  statGrowthRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 8 },
  statGrowth: { fontSize: 11, fontWeight: '700', color: '#2A7A4A' },
  statGrowthMuted: { fontSize: 11, color: C.muted, marginLeft: 2 },

  quickCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, overflow: 'hidden', marginBottom: 16, paddingTop: 6 },
  quickTitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: C.ink, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  quickRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  quickDivider: { borderTopWidth: 1, borderTopColor: C.line },
  quickIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { flex: 1, fontSize: 15, color: C.ink },
  quickBadge: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  quickBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  logout: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 },
  logoutIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(178,59,54,0.1)', alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#B23B36' },

  guest: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  guestAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  guestTitle: { fontFamily: SERIF, fontSize: 24, fontWeight: '700', color: C.ink, marginBottom: 8 },
  guestSub: { color: C.muted, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24, maxWidth: 300 },
  cta: { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 28, alignItems: 'center' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
