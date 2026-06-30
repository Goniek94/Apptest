import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { C, SERIF } from '@/shared/theme';
import { Icon } from '@/shared/ui/Icon';
import { useAuth } from '@/features/auth/context/AuthContext';
import { fetchWallet, type WalletSummary } from '@/features/orders/api/orders';

const zl = (g: number) => `${(g / 100).toFixed(2).replace('.', ',')} zł`;

/** Portfel — saldo sprzedającego, środki oczekujące, wypłaty. */
export function PortfelScreen() {
  const { user } = useAuth();
  const [w, setW] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setW(await fetchWallet()); } catch { setW(null); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { if (user) load(); else setLoading(false); }, [user, load]));

  if (loading) return <View style={s.center}><ActivityIndicator color={C.gold} /></View>;

  const available = w?.available ?? 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      {/* Saldo */}
      <View style={s.balanceCard}>
        <View style={s.balanceBg} pointerEvents="none"><Icon name="wallet" size={130} color={C.gold} /></View>
        <Text style={s.balanceLabel}>Dostępne środki</Text>
        <Text style={s.balanceValue}>{zl(available)}</Text>
        <TouchableOpacity
          style={[s.payoutBtn, available < 1 && { opacity: 0.5 }]}
          disabled={available < 1}
          onPress={() => Alert.alert('Wypłata', available < 1 ? 'Brak środków do wypłaty.' : 'Wypłaty będą dostępne po podpięciu operatora płatności.')}
          activeOpacity={0.85}
        >
          <Icon name="bank" size={16} color={C.ink} />
          <Text style={s.payoutText}>Wypłać środki</Text>
        </TouchableOpacity>
      </View>

      {/* Statystyki */}
      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={s.statLabel}>Oczekujące</Text>
          <Text style={s.statValue}>{zl(w?.pending ?? 0)}</Text>
          <Text style={s.statHint}>w trakcie transakcji</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statLabel}>Zarobione łącznie</Text>
          <Text style={s.statValue}>{zl(w?.earnedTotal ?? 0)}</Text>
          <Text style={s.statHint}>{w?.salesCount ?? 0} sprzedaży</Text>
        </View>
      </View>

      {/* Metoda wypłaty */}
      <Text style={s.sectionTitle}>Metoda wypłaty</Text>
      <TouchableOpacity style={s.methodCard} activeOpacity={0.8} onPress={() => Alert.alert('Konto do wypłat', 'Dodawanie konta bankowego będzie dostępne wkrótce.')}>
        <View style={s.methodIcon}><Icon name="bank" size={18} color={C.gold} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.methodTitle}>Dodaj konto do wypłat</Text>
          <Text style={s.methodSub}>Podaj numer konta, na który wypłacimy środki</Text>
        </View>
        <Icon name="chevronRight" size={18} color={C.muted} />
      </TouchableOpacity>

      {/* Operacje */}
      <Text style={s.sectionTitle}>Ostatnie operacje</Text>
      <View style={s.opsEmpty}>
        <Icon name="clock" size={20} color={C.muted} />
        <Text style={s.opsEmptyText}>Brak operacji. Tu pojawią się Twoje wpływy i wypłaty po pierwszej sprzedaży.</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },

  balanceCard: { backgroundColor: C.ink, borderRadius: 20, padding: 22, overflow: 'hidden' },
  balanceBg: { position: 'absolute', right: -16, top: -10, opacity: 0.1 },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  balanceValue: { fontFamily: SERIF, fontSize: 36, fontWeight: '700', color: '#fff', marginTop: 4 },
  payoutBtn: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 8, backgroundColor: C.gold, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 20, marginTop: 18 },
  payoutText: { fontSize: 14, fontWeight: '700', color: C.ink },

  statsRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  stat: { flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 14 },
  statLabel: { fontSize: 12, color: C.muted },
  statValue: { fontFamily: SERIF, fontSize: 20, fontWeight: '700', color: C.ink, marginTop: 4 },
  statHint: { fontSize: 11, color: C.muted, marginTop: 2 },

  sectionTitle: { fontFamily: SERIF, fontSize: 17, fontWeight: '700', color: C.ink, marginTop: 24, marginBottom: 12 },
  methodCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 16 },
  methodIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' },
  methodTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  methodSub: { fontSize: 12, color: C.muted, marginTop: 2 },

  opsEmpty: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(242,233,213,0.4)', borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 16 },
  opsEmptyText: { flex: 1, fontSize: 13, color: C.inkSoft, lineHeight: 18 },
});
