import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, SERIF } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/Icon';

const FAQ: { icon: IconName; title: string; sub: string }[] = [
  { icon: 'bag', title: 'Jak kupować?', sub: 'Zamawianie, płatność i odbiór' },
  { icon: 'tag', title: 'Jak sprzedawać?', sub: 'Dodawanie ogłoszeń i wysyłka' },
  { icon: 'wallet', title: 'Płatności i wypłaty', sub: 'Metody płatności, konto do wypłat' },
  { icon: 'truck', title: 'Wysyłka i zwroty', sub: 'Przewoźnicy, koszty, zwroty 14 dni' },
  { icon: 'shield', title: 'Bezpieczeństwo konta', sub: 'Ochrona kupujących i danych' },
];

/** Pomoc — FAQ + kontakt (port mobilnego widoku z weba). */
export function HelpScreen() {
  const navigation = useNavigation<any>();

  const CONTACT: { icon: IconName; title: string; sub: string; onPress?: () => void }[] = [
    { icon: 'chat', title: 'Napisz do nas', sub: 'Czat z obsługą klienta', onPress: () => navigation.navigate('Wiadomości') },
    { icon: 'mail', title: 'E-mail', sub: 'pomoc@modamarket.pl' },
    { icon: 'flag', title: 'Zgłoś problem', sub: 'Oszustwo, błąd lub nadużycie', onPress: () => navigation.navigate('Kontakt') },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <View style={s.search}>
        <Icon name="search" size={18} color={C.muted} />
        <TextInput placeholder="Jak możemy pomóc?" placeholderTextColor={C.muted} style={s.searchText} />
      </View>

      <Text style={s.h2}>Najczęstsze pytania</Text>
      <View style={s.card}>
        {FAQ.map((f, i) => (
          <TouchableOpacity key={f.title} style={[s.row, i > 0 && s.rowDivider]} activeOpacity={0.7}>
            <View style={s.rowIcon}><Icon name={f.icon} size={18} color={C.gold} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>{f.title}</Text>
              <Text style={s.rowSub}>{f.sub}</Text>
            </View>
            <Icon name="chevronRight" size={18} color={C.muted} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.h2}>Kontakt</Text>
      <View style={s.card}>
        {CONTACT.map((c, i) => (
          <TouchableOpacity key={c.title} style={[s.row, i > 0 && s.rowDivider]} activeOpacity={0.7} onPress={c.onPress}>
            <View style={s.rowIcon}><Icon name={c.icon} size={18} color={C.gold} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>{c.title}</Text>
              <Text style={s.rowSub}>{c.sub}</Text>
            </View>
            <Icon name="chevronRight" size={18} color={C.muted} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.footer}>
        <Text style={s.footerLink}>Regulamin</Text>
        <Text style={s.footerLink}>Polityka prywatności</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ONas')}><Text style={s.footerLink}>O AdBox</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 13, marginBottom: 24 },
  searchText: { flex: 1, fontSize: 14, color: C.ink, padding: 0 },
  h2: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: C.ink, marginBottom: 12 },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  rowDivider: { borderTopWidth: 1, borderTopColor: C.line },
  rowIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  rowSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 18 },
  footerLink: { fontSize: 13, color: C.muted },
});
