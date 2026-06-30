import React from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { C, SERIF } from '@/shared/theme';
import { useSettingsSlice } from '@/features/settings/useSettingsSlice';

function Row({ label, sub, value, onChange, divider }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; divider?: boolean }) {
  return (
    <View style={[s.row, divider && s.divider]}>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{label}</Text>
        {sub ? <Text style={s.sub}>{sub}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: C.gold, false: C.line }} thumbColor="#fff" />
    </View>
  );
}

/** Powiadomienia — przełączniki push i e-mail (ustawienia lokalne; podpięcie do backendu w przyszłości). */
export function SettingsNotificationsScreen() {
  const [push, setPush] = useSettingsSlice('push', { orders: true, messages: true, offers: false });
  const [email, setEmail] = useSettingsSlice('email', { summary: true, marketing: false });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      <Text style={s.h2}>Powiadomienia push</Text>
      <View style={s.card}>
        <Row label="Zamówienia i statusy" sub="Opłacono, wysłano, dostarczono" value={push.orders} onChange={(v) => setPush({ ...push, orders: v })} />
        <Row label="Wiadomości" sub="Nowe wiadomości od kupujących/sprzedających" value={push.messages} onChange={(v) => setPush({ ...push, messages: v })} divider />
        <Row label="Oferty i promocje" sub="Zniżki, Kup w grupie, nowości" value={push.offers} onChange={(v) => setPush({ ...push, offers: v })} divider />
      </View>

      <Text style={s.h2}>E-mail</Text>
      <View style={s.card}>
        <Row label="Podsumowania" sub="Tygodniowe zestawienie aktywności" value={email.summary} onChange={(v) => setEmail({ ...email, summary: v })} />
        <Row label="Newsletter marketingowy" sub="Inspiracje i polecane oferty" value={email.marketing} onChange={(v) => setEmail({ ...email, marketing: v })} divider />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  h2: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: C.ink, marginBottom: 12, marginTop: 8 },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: C.line },
  label: { fontSize: 15, fontWeight: '600', color: C.ink },
  sub: { fontSize: 12, color: C.muted, marginTop: 2 },
});
