import React, { useCallback, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { grosze, listingStatusLabel, type ListingStatus } from '@modamarket/shared';
import { C, SERIF } from '@/shared/theme';
import { Icon } from '@/shared/ui/Icon';
import { useAuth } from '@/features/auth/context/AuthContext';
import { BottomNav } from '@/shared/components/BottomNav';
import { fetchMyListings, deleteListing, type ApiListing } from '@/features/catalog/api/listings';

type TabKey = 'all' | 'in_progress' | ListingStatus;

const STATUS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Wszystkie' },
  { key: 'in_progress', label: 'W toku' },
  { key: 'ACTIVE', label: 'Aktywne' },
  { key: 'RESERVED', label: 'Zarezerwowane' },
  { key: 'SOLD', label: 'Sprzedane' },
  { key: 'ARCHIVED', label: 'Archiwalne' },
];

const STATUS_TONE: Record<ListingStatus, { bg: string; fg: string }> = {
  ACTIVE: { bg: 'rgba(42,122,74,0.12)', fg: '#2A7A4A' },
  RESERVED: { bg: C.goldSoft, fg: C.goldDeep },
  SOLD: { bg: '#E6EEF6', fg: '#3B6CA8' },
  ARCHIVED: { bg: C.line, fg: C.muted },
};

function Row({ it, onOpen, onEdit, onDelete }: { it: ApiListing; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  const tone = STATUS_TONE[it.status];
  const img = it.images?.[0]?.url;
  const date = new Date(it.createdAt).toLocaleDateString('pl-PL');
  return (
    <TouchableOpacity style={s.row} activeOpacity={0.85} onPress={onOpen}>
      {img ? <Image source={{ uri: img }} style={s.rowImg} /> : <View style={s.rowImg} />}
      <View style={{ flex: 1, alignSelf: 'stretch' }}>
        <View style={s.rowTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle} numberOfLines={1}>{it.title}</Text>
            {it.brand ? <Text style={s.rowBrand}>{it.brand}</Text> : null}
            <Text style={s.rowPrice}>{grosze(it.price)}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: tone.bg }]}>
            <View style={[s.badgeDot, { backgroundColor: tone.fg }]} />
            <Text style={[s.badgeText, { color: tone.fg }]} numberOfLines={1}>{listingStatusLabel(it.status)}</Text>
          </View>
        </View>
        <View style={s.rowMeta}>
          <Icon name="box" size={13} color={C.muted} />
          <Text style={s.rowMetaText}>Dodano {date}</Text>
        </View>
      </View>
      <View style={s.actions}>
        <TouchableOpacity style={s.iconBtn} onPress={onEdit} hitSlop={8}>
          <Icon name="edit" size={17} color={C.gold} />
        </TouchableOpacity>
        <TouchableOpacity style={s.iconBtn} onPress={onDelete} hitSlop={8}>
          <Icon name="trash" size={17} color={C.muted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

/** Moje ogłoszenia — Twoje oferty z API (status + usuwanie). */
export function MyListingsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [items, setItems] = useState<ApiListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirm, setConfirm] = useState<ApiListing | null>(null);
  const currentLabel = STATUS.find((o) => o.key === tab)?.label ?? 'Wszystkie';

  const load = useCallback(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    fetchMyListings()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Usunięcie z optymistycznym update; przy błędzie przeładowujemy listę z serwera.
  const doDelete = async (it: ApiListing) => {
    setConfirm(null);
    setItems((xs) => xs.filter((x) => x.id !== it.id));
    try {
      await deleteListing(it.id);
    } catch {
      load();
      Alert.alert('Błąd', 'Nie udało się usunąć ogłoszenia. Sprawdź połączenie z serwerem.');
    }
  };

  if (!user) {
    return (
      <View style={s.center}>
        <Text style={s.centerTitle}>Zaloguj się, aby zobaczyć swoje ogłoszenia</Text>
        <TouchableOpacity style={s.cta} onPress={() => navigation.navigate('Auth')} activeOpacity={0.85}>
          <Text style={s.ctaText}>Zaloguj się</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filtered =
    tab === 'all' ? items
      : tab === 'in_progress' ? items.filter((it) => (it.orders?.length ?? 0) > 0)
        : items.filter((it) => it.status === tab);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 170 }} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={[s.filterBtn, sheetOpen && s.filterBtnOpen]} onPress={() => setSheetOpen((v) => !v)} activeOpacity={0.85}>
        <Icon name="sliders" size={16} color={C.ink} />
        <Text style={s.filterBtnText}>Status: {currentLabel}</Text>
        <Icon name="chevronDown" size={16} color={C.muted} />
      </TouchableOpacity>

      {sheetOpen && (
        <View style={s.dropdown}>
          {STATUS.map((o, idx) => {
            const active = tab === o.key;
            return (
              <TouchableOpacity
                key={o.key}
                style={[s.dropRow, idx > 0 && s.dropDivider]}
                onPress={() => { setTab(o.key); setSheetOpen(false); }}
                activeOpacity={0.7}
              >
                <Text style={[s.dropText, active && { color: C.ink, fontWeight: '700' }]}>{o.label}</Text>
                {active && <Icon name="check" size={17} color={C.gold} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={{ gap: 12, marginTop: 16 }}>
        {loading ? (
          <ActivityIndicator color={C.gold} style={{ marginTop: 30 }} />
        ) : filtered.length > 0 ? (
          filtered.map((it) => (
            <Row
              key={it.id}
              it={it}
              onOpen={() => navigation.navigate('Produkt', { id: it.id })}
              onEdit={() => navigation.navigate('EdytujOgloszenie', { edit: it })}
              onDelete={() => setConfirm(it)}
            />
          ))
        ) : (
          <View style={s.empty}>
            <Text style={s.emptyText}>
              {tab === 'all' ? 'Nie masz jeszcze żadnych ogłoszeń.' : 'Brak ogłoszeń w tej zakładce.'}
            </Text>
          </View>
        )}
      </View>

    </ScrollView>

    {/* Sticky panel na dole: dodaj ogłoszenie + główna nawigacja */}
    <View style={s.bottomDock}>
      <View style={s.addRow}>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('Sprzedaj')} activeOpacity={0.85}>
          <Icon name="plus" size={18} color="#fff" />
          <Text style={s.addBtnText}>Dodaj ogłoszenie</Text>
        </TouchableOpacity>
      </View>
      <BottomNav />
    </View>

    {/* Potwierdzenie usunięcia (działa też na web — bez Alert.alert) */}
    <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
      <Pressable style={s.dialogOverlay} onPress={() => setConfirm(null)}>
        <Pressable style={s.dialog} onPress={() => {}}>
          <View style={s.dialogIcon}><Icon name="trash" size={22} color="#B23B36" /></View>
          <Text style={s.dialogTitle}>Usunąć ogłoszenie?</Text>
          <Text style={s.dialogText} numberOfLines={2}>„{confirm?.title}” zostanie trwale usunięte.</Text>
          <View style={s.dialogActions}>
            <TouchableOpacity style={[s.dialogBtn, s.dialogCancel]} onPress={() => setConfirm(null)} activeOpacity={0.85}>
              <Text style={s.dialogCancelText}>Anuluj</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.dialogBtn, s.dialogDelete]} onPress={() => confirm && doDelete(confirm)} activeOpacity={0.85}>
              <Text style={s.dialogDeleteText}>Usuń</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  centerTitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: C.ink, textAlign: 'center', marginBottom: 20 },
  cta: { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  filterBtnOpen: { borderColor: C.gold },
  filterBtnText: { flex: 1, fontSize: 14, fontWeight: '700', color: C.ink },

  dropdown: { marginTop: 6, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14, overflow: 'hidden' },
  dropRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 16 },
  dropDivider: { borderTopWidth: 1, borderTopColor: C.line },
  dropText: { fontSize: 14, color: C.inkSoft },

  dialogOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  dialog: { width: '100%', maxWidth: 360, backgroundColor: C.bg, borderRadius: 20, padding: 22, alignItems: 'center' },
  dialogIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(178,59,54,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  dialogTitle: { fontFamily: SERIF, fontSize: 20, fontWeight: '700', color: C.ink, textAlign: 'center' },
  dialogText: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  dialogActions: { flexDirection: 'row', gap: 12, marginTop: 20, alignSelf: 'stretch' },
  dialogBtn: { flex: 1, paddingVertical: 13, borderRadius: 999, alignItems: 'center' },
  dialogCancel: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  dialogCancelText: { fontSize: 15, fontWeight: '700', color: C.ink },
  dialogDelete: { backgroundColor: '#B23B36' },
  dialogDeleteText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  row: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 12 },
  rowImg: { width: 84, height: 104, borderRadius: 10, backgroundColor: C.goldSoft },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  rowTitle: { fontFamily: SERIF, fontSize: 15, fontWeight: '700', color: C.ink },
  rowBrand: { fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 },
  rowPrice: { fontFamily: SERIF, fontSize: 17, fontWeight: '700', color: C.ink, marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeDot: { width: 6, height: 6, borderRadius: 3, opacity: 0.7 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  rowMetaText: { fontSize: 12, color: C.muted },
  actions: { gap: 4 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  empty: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, paddingVertical: 40, alignItems: 'center', paddingHorizontal: 20 },
  emptyText: { color: C.muted, fontSize: 14, textAlign: 'center' },

  bottomDock: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  addRow: { backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line, paddingHorizontal: 16, paddingVertical: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.gold, borderRadius: 999, paddingVertical: 14 },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
