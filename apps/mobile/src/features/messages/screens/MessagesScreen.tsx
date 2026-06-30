import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Modal, Pressable } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { C, SERIF } from '@/shared/theme';
import { Icon } from '@/shared/ui/Icon';
import { Avatar } from '@/shared/ui';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useRealtimeEvent } from '@/shared/realtime/RealtimeContext';
import { useUnread } from '@/features/messages/UnreadContext';
import { fetchConversations, markConversationRead, deleteConversation, type Conversation } from '@/features/messages/api/messages';

const TABS = ['Odebrane', 'Inne'] as const;
type Tab = (typeof TABS)[number];

const zl = (g: number) => `${(g / 100).toFixed(2).replace('.', ',')} zł`;

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'teraz';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} godz.`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d} dni` : new Date(iso).toLocaleDateString('pl-PL');
}

function preview(c: Conversation): string {
  const m = c.lastMessage;
  if (!m) return 'Rozpocznij rozmowę';
  if (m.type === 'OFFER' && m.offer) return `💰 Oferta: ${zl(m.offer.amount)}`;
  return m.body;
}

/** Wiadomości — zakładki (Odebrane/Wysłane/Inne) + wyszukiwarka, realne dane z API. */
export function MessagesScreen() {
  const { user } = useAuth();
  const { refresh: refreshUnread } = useUnread();
  const navigation = useNavigation<any>();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>('Odebrane');
  const [q, setQ] = useState('');
  const [confirmDel, setConfirmDel] = useState<Conversation | null>(null);

  const load = useCallback(async () => {
    try {
      setConvos(await fetchConversations());
    } catch {
      setConvos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { if (user) load(); else setLoading(false); }, [user, load]));

  const onRt = useCallback(() => { if (user) load(); }, [user, load]);
  useRealtimeEvent('conversation:update', onRt);
  useRealtimeEvent('notification:new', onRt);

  const filtered = useMemo(() => {
    if (!user) return [];
    const needle = q.trim().toLowerCase();
    return convos.filter((c) => {
      if (!needle) return true;
      const other = user.id === c.buyerId ? c.seller : c.buyer;
      const hay = `${other.displayName} ${c.listing?.title ?? ''}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [convos, q, user]);

  const doMarkRead = async (c: Conversation) => {
    setConvos((cs) => cs.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x)));
    try { await markConversationRead(c.id); refreshUnread(); } catch { load(); }
  };
  const doDelete = async (c: Conversation) => {
    setConfirmDel(null);
    setConvos((cs) => cs.filter((x) => x.id !== c.id));
    try { await deleteConversation(c.id); refreshUnread(); } catch { load(); }
  };

  if (!user) {
    return (
      <View style={s.center}>
        <View style={s.emptyIcon}><Icon name="chat" size={28} color={C.gold} /></View>
        <Text style={s.emptyTitle}>Twoje wiadomości</Text>
        <Text style={s.emptySub}>Zaloguj się, aby pisać ze sprzedającymi i negocjować ceny.</Text>
        <TouchableOpacity style={s.cta} onPress={() => navigation.navigate('Auth')} activeOpacity={0.85}>
          <Text style={s.ctaText}>Zaloguj się</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) return <View style={s.center}><ActivityIndicator color={C.gold} /></View>;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.gold} />}
    >
      <Text style={s.title}>Wiadomości</Text>

      {/* Zakładki */}
      <View style={s.tabs}>
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <TouchableOpacity key={t} style={[s.tab, active && s.tabActive]} onPress={() => setTab(t)} activeOpacity={0.8}>
              <Text style={[s.tabText, active && s.tabTextActive]}>{t}</Text>
              {t === 'Inne' && <View style={[s.tabDot, active && { backgroundColor: '#fff' }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {tab === 'Inne' ? (
        <View style={s.sysHint}>
          <Icon name="help" size={16} color={C.gold} />
          <Text style={s.sysHintText}>Tu pojawią się wiadomości systemowe i powiadomienia niezwiązane z konkretnym ogłoszeniem.</Text>
        </View>
      ) : (
        <>
          {/* Wyszukiwarka */}
          <View style={s.searchRow}>
            <View style={s.search}>
              <Icon name="search" size={17} color={C.muted} />
              <TextInput value={q} onChangeText={setQ} placeholder="Szukaj rozmowy lub produktu" placeholderTextColor={C.muted} style={s.searchText} />
            </View>
            <TouchableOpacity style={s.filterBtn}><Icon name="sliders" size={18} color={C.ink} /></TouchableOpacity>
          </View>

          {filtered.length === 0 ? (
            <View style={s.emptyInline}>
              <View style={s.emptyIcon}><Icon name="chat" size={26} color={C.gold} /></View>
              <Text style={s.emptyTitle}>Brak rozmów</Text>
              <Text style={s.emptySub}>
                {q ? 'Nic nie pasuje do wyszukiwania.' : 'Napisz do sprzedającego lub złóż ofertę z poziomu ogłoszenia — rozmowy pojawią się tutaj.'}
              </Text>
            </View>
          ) : (
            filtered.map((c, i) => {
              const other = user.id === c.buyerId ? c.seller : c.buyer;
              return (
                <TouchableOpacity key={c.id} style={[s.row, i > 0 && s.rowDivider]} activeOpacity={0.7}
                  onPress={() => navigation.navigate('Rozmowa', { conversationId: c.id })}>
                  <Avatar name={other.displayName} src={other.avatarUrl ?? undefined} size={54} />
                  {c.listing?.images[0] && <Image source={{ uri: c.listing.images[0].url }} style={s.rowProd} />}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={s.rowTop}>
                      <Text style={s.rowName} numberOfLines={1}>{other.displayName}</Text>
                      <Text style={s.rowTime}>{relTime(c.updatedAt)}</Text>
                    </View>
                    {c.listing && <Text style={s.rowProduct} numberOfLines={1}>{c.listing.title}</Text>}
                    <View style={s.rowBottom}>
                      <Text style={[s.rowLast, c.unread > 0 && { color: C.ink, fontWeight: '600' }]} numberOfLines={1}>{preview(c)}</Text>
                      {c.unread > 0 && <View style={s.unread}><Text style={s.unreadText}>{c.unread}</Text></View>}
                    </View>
                  </View>
                  <View style={s.rowActions}>
                    {c.unread > 0 && (
                      <TouchableOpacity style={s.rowActBtn} onPress={() => doMarkRead(c)} hitSlop={6}>
                        <Icon name="check" size={18} color={C.gold} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={s.rowActBtn} onPress={() => setConfirmDel(c)} hitSlop={6}>
                      <Icon name="trash" size={16} color={C.muted} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </>
      )}

      {/* Potwierdzenie usunięcia */}
      <Modal visible={!!confirmDel} transparent animationType="fade" onRequestClose={() => setConfirmDel(null)}>
        <Pressable style={s.dlgOverlay} onPress={() => setConfirmDel(null)}>
          <Pressable style={s.dlg} onPress={() => {}}>
            <Text style={s.dlgTitle}>Usunąć rozmowę?</Text>
            <Text style={s.dlgText}>Cała historia tej rozmowy zostanie trwale usunięta.</Text>
            <View style={s.dlgActions}>
              <TouchableOpacity style={[s.dlgBtn, s.dlgCancel]} onPress={() => setConfirmDel(null)}><Text style={s.dlgCancelText}>Anuluj</Text></TouchableOpacity>
              <TouchableOpacity style={[s.dlgBtn, s.dlgDel]} onPress={() => confirmDel && doDelete(confirmDel)}><Text style={s.dlgDelText}>Usuń</Text></TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: SERIF, fontSize: 24, fontWeight: '700', color: C.ink, marginBottom: 14 },
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyInline: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 70 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontFamily: SERIF, fontSize: 20, fontWeight: '700', color: C.ink },
  emptySub: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 6, lineHeight: 20, maxWidth: 280 },
  cta: { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, marginTop: 20 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  tabs: { flexDirection: 'row', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 999, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 999 },
  tabActive: { backgroundColor: C.gold },
  tabText: { fontSize: 13, fontWeight: '700', color: C.inkSoft },
  tabTextActive: { color: '#fff' },
  tabDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold },

  searchRow: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 4 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  searchText: { flex: 1, fontSize: 14, color: C.ink, padding: 0 },
  filterBtn: { width: 44, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },

  sysHint: { flexDirection: 'row', gap: 10, backgroundColor: 'rgba(242,233,213,0.5)', borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 14, marginTop: 16 },
  sysHintText: { flex: 1, fontSize: 13, color: C.inkSoft, lineHeight: 18 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowDivider: { borderTopWidth: 1, borderTopColor: C.line },
  rowProd: { width: 48, height: 56, borderRadius: 10, backgroundColor: C.goldSoft },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowName: { flex: 1, fontSize: 15, fontWeight: '700', color: C.ink },
  rowTime: { fontSize: 12, color: C.muted },
  rowProduct: { fontSize: 13, color: C.inkSoft, marginTop: 2 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 },
  rowLast: { flex: 1, fontSize: 13, color: C.muted },
  unread: { minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 2 },
  rowActBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

  dlgOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  dlg: { width: '100%', maxWidth: 340, backgroundColor: C.bg, borderRadius: 20, padding: 22 },
  dlgTitle: { fontFamily: SERIF, fontSize: 19, fontWeight: '700', color: C.ink, textAlign: 'center' },
  dlgText: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  dlgActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  dlgBtn: { flex: 1, paddingVertical: 13, borderRadius: 999, alignItems: 'center' },
  dlgCancel: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  dlgCancelText: { fontSize: 15, fontWeight: '700', color: C.ink },
  dlgDel: { backgroundColor: '#B23B36' },
  dlgDelText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
