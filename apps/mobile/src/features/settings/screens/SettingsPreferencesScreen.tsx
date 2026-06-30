import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { C, SERIF } from '@/shared/theme';
import { useSettingsSlice } from '@/features/settings/useSettingsSlice';

function SegRow({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={s.group}>
      <Text style={s.groupLabel}>{label}</Text>
      <View style={s.seg}>
        {options.map((o) => {
          const active = o === value;
          return (
            <TouchableOpacity key={o} style={[s.segBtn, active && s.segBtnOn]} onPress={() => onChange(o)} activeOpacity={0.8}>
              <Text style={[s.segText, active && s.segTextOn]}>{o}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/** Preferencje — język, waluta, jednostki (ustawienia lokalne; podpięcie w przyszłości). */
export function SettingsPreferencesScreen() {
  const [prefs, setPrefs] = useSettingsSlice('preferences', { lang: 'Polski', currency: 'PLN', units: 'cm' });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      <View style={s.card}>
        <SegRow label="Język" options={['Polski', 'English']} value={prefs.lang} onChange={(lang) => setPrefs({ lang })} />
        <SegRow label="Waluta" options={['PLN', 'EUR', 'USD']} value={prefs.currency} onChange={(currency) => setPrefs({ currency })} />
        <SegRow label="Jednostki" options={['cm', 'in']} value={prefs.units} onChange={(units) => setPrefs({ units })} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 16, gap: 18 },
  group: { gap: 10 },
  groupLabel: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', color: C.ink },
  seg: { flexDirection: 'row', gap: 4, backgroundColor: C.surfaceAlt, borderRadius: 12, padding: 4 },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  segBtnOn: { backgroundColor: C.surface, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  segText: { fontSize: 13, fontWeight: '600', color: C.muted },
  segTextOn: { color: C.ink },
});
