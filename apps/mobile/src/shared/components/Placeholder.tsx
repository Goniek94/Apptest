import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, SERIF } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/Icon';

/** Zaślepka ekranu w trakcie portu z weba — spójny wygląd dla niedokończonych widoków. */
export function Placeholder({ icon, title, sub }: { icon: IconName; title: string; sub: string }) {
  return (
    <View style={s.root}>
      <View style={s.badge}><Icon name={icon} size={28} color={C.gold} /></View>
      <Text style={s.title}>{title}</Text>
      <Text style={s.sub}>{sub}</Text>
      <Text style={s.note}>Ekran w przygotowaniu — port z wersji web.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 36 },
  badge: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontFamily: SERIF, fontSize: 24, fontWeight: '700', color: C.ink, marginBottom: 8 },
  sub: { color: C.muted, fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  note: { color: C.gold, fontSize: 12, fontWeight: '700', marginTop: 16 },
});
