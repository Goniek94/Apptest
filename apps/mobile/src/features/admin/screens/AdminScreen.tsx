import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, Image, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, SERIF } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Avatar } from '@/shared/ui';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  fetchAdminStats, fetchAdminUsers, fetchAdminListings,
  banUser, verifyUser, verifyListing, setListingStatus, removeAdminListing,
  type AdminStats, type AdminUser, type AdminListing,
} from '@/features/admin/api/admin';

const zl = (g: number) => `${(g / 100).toFixed(2).replace('.', ',')} zł`;
type Tab = 'users' | 'listings';
type Confirm = { title: string; message: string; danger?: boolean; run: () => Promise<void> } | null;

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Aktywne', RESERVED: 'Zarezerw.', SOLD: 'Sprzedane', ARCHIVED: 'Archiwum' };

export function AdminScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<Tab>('users');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const load = useCallback(async () => {
    try {
      const [st, us, ls] = await Promise.all([fetchAdminStats(), fetchAdminUsers(), fetchAdminListings()]);
      setStats(st); setUsers(us); setListings(ls);
    } catch { /* obsługa w UI */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user?.role === 'ADMIN') load(); else setLoading(false); }, [user, load]);

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    try { await fn(); await load(); } finally { setBusy(null); }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <View style={s.center}>
        <View style={s.lockIcon}><Icon name="shield" size={28} color={C.gold} /></View>
        <Text style={s.title}>Brak dostępu</Text>
        <Text style={s.muted}>Panel jest dostępny tylko dla administratorów.</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}><Text style={s.backText}>Wróć</Text></TouchableOpacity>
      </View>
    );
  }

  if (loading) return <View style={s.center}><ActivityIndicator color={C.gold} /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      {/* Statystyki */}
      {stats && (
        <View style={s.statsGrid}>
          <Stat icon="users" label="Użytkownicy" value={stats.users} />
          <Stat icon="tag" label="Ogłoszenia" value={stats.listings} />
          <Stat icon="shield" label="Do weryfikacji" value={stats.unverifiedListings} highlight />
          <Stat icon="chat" label="Oferty" value={stats.offers} />
        </View>
      )}

      {/* Przełącznik */}
      <View style={s.tabs}>
        {(['users', 'listings'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabOn]} onPress={() => { setTab(t); setQ(''); }} activeOpacity={0.8}>
            <Text style={[s.tabText, tab === t && s.tabTextOn]}>{t === 'users' ? 'Użytkownicy' : 'Ogłoszenia'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.search}>
        <Icon name="search" size={17} color={C.muted} />
        <TextInput value={q} onChangeText={setQ} placeholder={tab === 'users' ? 'Szukaj po e-mail / nazwie' : 'Szukaj ogłoszenia'} placeholderTextColor={C.muted} style={s.searchText} />
      </View>

      {tab === 'users'
        ? users
            .filter((u) => !q || `${u.email} ${u.displayName}`.toLowerCase().includes(q.toLowerCase()))
            .map((u) => (
              <View key={u.id} style={s.card}>
                <View style={s.cardHead}>
                  <Avatar name={u.displayName} src={u.avatarUrl ?? undefined} size={44} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={s.nameRow}>
                      <Text style={s.name} numberOfLines={1}>{u.displayName}</Text>
                      {u.role === 'ADMIN' && <View style={[s.badge, { backgroundColor: C.goldSoft }]}><Text style={[s.badgeText, { color: C.gold }]}>ADMIN</Text></View>}
                    </View>
                    <Text style={s.email} numberOfLines={1}>{u.email}</Text>
                    <Text style={s.metaSmall}>{u.accountType === 'BUSINESS' ? 'Firma' : 'Osoba prywatna'} · {u._count.listings} ogł.</Text>
                  </View>
                </View>
                <View style={s.tags}>
                  {u.verified && <Tag label="Zweryfikowany" tone="green" />}
                  {u.bannedAt && <Tag label="Zablokowany" tone="red" />}
                  {!u.emailVerifiedAt && <Tag label="E-mail niepotw." tone="muted" />}
                </View>
                {u.role !== 'ADMIN' && (
                  <View style={s.actions}>
                    <ActBtn label={u.verified ? 'Cofnij weryf.' : 'Zweryfikuj'} icon="award" busy={busy === u.id}
                      onPress={() => act(u.id, () => verifyUser(u.id, !u.verified))} />
                    <ActBtn label={u.bannedAt ? 'Odblokuj' : 'Zablokuj'} icon="shield" danger={!u.bannedAt} busy={busy === u.id}
                      onPress={() => {
                        if (u.bannedAt) return act(u.id, () => banUser(u.id, false));
                        setConfirm({ title: 'Zablokować konto?', message: `${u.displayName} straci dostęp i zostanie wylogowany.`, danger: true, run: () => act(u.id, () => banUser(u.id, true)) });
                      }} />
                  </View>
                )}
              </View>
            ))
        : listings
            .filter((l) => !q || l.title.toLowerCase().includes(q.toLowerCase()))
            .map((l) => (
              <View key={l.id} style={s.card}>
                <View style={s.cardHead}>
                  {l.images[0] ? <Image source={{ uri: l.images[0].url }} style={s.lImg} /> : <View style={[s.lImg, { backgroundColor: C.goldSoft }]} />}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.name} numberOfLines={1}>{l.title}</Text>
                    <Text style={s.email} numberOfLines={1}>{l.seller.displayName} · {l.seller.email}</Text>
                    <Text style={s.price}>{zl(l.price)}</Text>
                  </View>
                </View>
                <View style={s.tags}>
                  <Tag label={STATUS_LABEL[l.status] ?? l.status} tone="muted" />
                  {l.verified ? <Tag label="Zweryfikowane" tone="green" /> : <Tag label="Niezweryfikowane" tone="muted" />}
                </View>
                <View style={s.actions}>
                  <ActBtn label={l.verified ? 'Cofnij' : 'Zweryfikuj'} icon="award" busy={busy === l.id}
                    onPress={() => act(l.id, () => verifyListing(l.id, !l.verified))} />
                  <ActBtn label={l.status === 'ARCHIVED' ? 'Przywróć' : 'Archiwizuj'} icon="box" busy={busy === l.id}
                    onPress={() => act(l.id, () => setListingStatus(l.id, l.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED'))} />
                  <ActBtn label="Usuń" icon="trash" danger busy={busy === l.id}
                    onPress={() => setConfirm({ title: 'Usunąć ogłoszenie?', message: `„${l.title}" zniknie trwale.`, danger: true, run: () => act(l.id, () => removeAdminListing(l.id)) })} />
                </View>
              </View>
            ))}

      {/* Potwierdzenie akcji destrukcyjnych */}
      <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
        <Pressable style={s.mOverlay} onPress={() => setConfirm(null)}>
          <Pressable style={s.mCard} onPress={() => {}}>
            <Text style={s.mTitle}>{confirm?.title}</Text>
            <Text style={s.mText}>{confirm?.message}</Text>
            <View style={s.mActions}>
              <TouchableOpacity style={[s.mBtn, s.mCancel]} onPress={() => setConfirm(null)}><Text style={s.mCancelText}>Anuluj</Text></TouchableOpacity>
              <TouchableOpacity style={[s.mBtn, s.mConfirm]} onPress={() => { const c = confirm; setConfirm(null); c?.run(); }}>
                <Text style={s.mConfirmText}>Potwierdź</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function Stat({ icon, label, value, highlight }: { icon: IconName; label: string; value: number; highlight?: boolean }) {
  return (
    <View style={[s.stat, highlight && value > 0 && { borderColor: C.gold }]}>
      <View style={s.statIcon}><Icon name={icon} size={16} color={C.gold} /></View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function Tag({ label, tone }: { label: string; tone: 'green' | 'red' | 'muted' }) {
  const map = { green: '#2A7A4A', red: '#B23B36', muted: C.muted } as const;
  return <View style={[s.tag, { backgroundColor: map[tone] + '1A' }]}><Text style={[s.tagText, { color: map[tone] }]}>{label}</Text></View>;
}

function ActBtn({ label, icon, onPress, danger, busy }: { label: string; icon: IconName; onPress: () => void; danger?: boolean; busy?: boolean }) {
  return (
    <TouchableOpacity style={[s.actBtn, danger && s.actDanger]} onPress={onPress} disabled={busy} activeOpacity={0.8}>
      {busy ? <ActivityIndicator size="small" color={danger ? '#B23B36' : C.ink} /> : (
        <><Icon name={icon} size={13} color={danger ? '#B23B36' : C.ink} /><Text style={[s.actText, danger && { color: '#B23B36' }]}>{label}</Text></>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  lockIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontFamily: SERIF, fontSize: 22, fontWeight: '700', color: C.ink },
  muted: { color: C.muted, fontSize: 14, textAlign: 'center', marginTop: 6 },
  backBtn: { marginTop: 20, backgroundColor: C.gold, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 28 },
  backText: { color: '#fff', fontWeight: '700' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  stat: { width: '47%', flexGrow: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 14 },
  statIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontFamily: SERIF, fontSize: 24, fontWeight: '700', color: C.ink },
  statLabel: { fontSize: 12, color: C.muted, marginTop: 2 },

  tabs: { flexDirection: 'row', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 999, padding: 4, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: 'center' },
  tabOn: { backgroundColor: C.gold },
  tabText: { fontSize: 13, fontWeight: '700', color: C.inkSoft },
  tabTextOn: { color: '#fff' },

  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 12 },
  searchText: { flex: 1, fontSize: 14, color: C.ink, padding: 0 },

  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 14, marginBottom: 10 },
  cardHead: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  lImg: { width: 44, height: 52, borderRadius: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 15, fontWeight: '700', color: C.ink, flexShrink: 1 },
  email: { fontSize: 12, color: C.muted, marginTop: 1 },
  metaSmall: { fontSize: 11, color: C.muted, marginTop: 2 },
  price: { fontFamily: SERIF, fontSize: 15, fontWeight: '700', color: C.ink, marginTop: 2 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '800' },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  tagText: { fontSize: 11, fontWeight: '700' },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.bg },
  actDanger: { borderColor: 'rgba(178,59,54,0.4)' },
  actText: { fontSize: 12, fontWeight: '700', color: C.ink },

  mOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  mCard: { width: '100%', maxWidth: 360, backgroundColor: C.bg, borderRadius: 20, padding: 22 },
  mTitle: { fontFamily: SERIF, fontSize: 20, fontWeight: '700', color: C.ink, textAlign: 'center' },
  mText: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  mActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  mBtn: { flex: 1, paddingVertical: 13, borderRadius: 999, alignItems: 'center' },
  mCancel: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  mCancelText: { fontSize: 15, fontWeight: '700', color: C.ink },
  mConfirm: { backgroundColor: '#B23B36' },
  mConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
