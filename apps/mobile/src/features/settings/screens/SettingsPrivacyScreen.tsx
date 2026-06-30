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

/** Prywatność — widoczność profilu i danych (ustawienia lokalne; podpięcie w przyszłości). */
export function SettingsPrivacyScreen() {
  const [v, setV] = useSettingsSlice('privacy', { publicProfile: true, showRatings: true, dmFromAll: true, showOnline: false });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      <Text style={s.h2}>Widoczność</Text>
      <View style={s.card}>
        <Row label="Publiczny profil" sub="Twój profil widoczny dla kupujących" value={v.publicProfile} onChange={(x) => setV({ ...v, publicProfile: x })} />
        <Row label="Pokazuj oceny i opinie" value={v.showRatings} onChange={(x) => setV({ ...v, showRatings: x })} divider />
        <Row label="Status „online”" sub="Pokazuj, kiedy jesteś aktywny" value={v.showOnline} onChange={(x) => setV({ ...v, showOnline: x })} divider />
      </View>

      <Text style={s.h2}>Wiadomości</Text>
      <View style={s.card}>
        <Row label="Wiadomości od wszystkich" sub="Każdy może do Ciebie napisać" value={v.dmFromAll} onChange={(x) => setV({ ...v, dmFromAll: x })} />
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
