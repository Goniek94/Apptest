import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Button } from '@/shared/ui';

const SECTIONS: { icon: IconName; title: string; sub: string; route?: string }[] = [
  { icon: 'user', title: 'Dane osobowe', sub: 'Nazwa, opis, dane firmy', route: 'UstawieniaDane' },
  { icon: 'lock', title: 'Hasło i bezpieczeństwo', sub: 'Zmień hasło, weryfikacja' },
  { icon: 'bell', title: 'Powiadomienia', sub: 'Push i e-mail', route: 'UstawieniaPowiadomienia' },
  { icon: 'shield', title: 'Prywatność', sub: 'Widoczność i dane', route: 'UstawieniaPrywatnosc' },
  { icon: 'sliders', title: 'Preferencje', sub: 'Język, waluta, jednostki', route: 'UstawieniaPreferencje' },
  { icon: 'mapPin', title: 'Adresy', sub: 'Adresy dostawy i płatności' },
  { icon: 'truck', title: 'Wysyłki', sub: 'Przewoźnicy: InPost, DPD, Poczta' },
  { icon: 'card', title: 'Płatności', sub: 'Konto do wypłat i metody' },
];

/** Ustawienia konta — hub z sekcjami (port mobilnego widoku z weba). */
export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const onRow = (s: (typeof SECTIONS)[number]) => {
    if (s.route) navigation.navigate(s.route);
    else Alert.alert('Wkrótce', 'Ta sekcja będzie dostępna w kolejnej aktualizacji.');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          {SECTIONS.map((sec, i) => (
            <TouchableOpacity key={sec.title} style={[s.row, i > 0 && s.divider]} activeOpacity={0.7} onPress={() => onRow(sec)}>
              <View style={s.icon}><Icon name={sec.icon} size={19} color={C.gold} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{sec.title}</Text>
                <Text style={s.sub}>{sec.sub}</Text>
              </View>
              <Icon name="chevronRight" size={18} color={C.muted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Powrót na dole (zamiast strzałki u góry) */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button title="Wróć" icon="arrowLeft" variant="ghost" full onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingVertical: 16 },
  divider: { borderTopWidth: 1, borderTopColor: C.line },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: C.ink },
  sub: { fontSize: 12, color: C.muted, marginTop: 1 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line, paddingHorizontal: 16, paddingTop: 12 },
});
