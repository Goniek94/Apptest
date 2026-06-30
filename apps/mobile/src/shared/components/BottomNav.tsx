import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { useUnread } from '@/features/messages/UnreadContext';

const ITEMS: { route: string; icon: IconName; label: string }[] = [
  { route: 'Strona główna', icon: 'home', label: 'Główna' },
  { route: 'Sklep', icon: 'bag', label: 'Sklep' },
  { route: 'Sprzedaj', icon: 'plus', label: 'Sprzedaj' },
  { route: 'Wiadomości', icon: 'chat', label: 'Czat' },
  { route: 'Profil', icon: 'user', label: 'Profil' },
];

/**
 * Główna dolna nawigacja do użycia na ekranach spoza tabów (np. „Moje ogłoszenia").
 * Przenosi do odpowiedniej zakładki. `active` opcjonalnie podświetla pozycję.
 */
export function BottomNav({ active }: { active?: string }) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { unread } = useUnread();

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {ITEMS.map((it) => {
        const focused = active === it.route;
        const color = focused ? C.gold : 'rgba(255,255,255,0.55)';
        const badge = it.route === 'Wiadomości' && unread > 0;
        return (
          <TouchableOpacity key={it.route} style={s.item} activeOpacity={0.7}
            onPress={() => navigation.navigate('Tabs', { screen: it.route })}>
            <View>
              <Icon name={it.icon} size={22} color={color} />
              {badge && <View style={s.badge}><Text style={s.badgeText} allowFontScaling={false}>{unread > 9 ? '9+' : unread}</Text></View>}
            </View>
            <Text style={[s.label, { color }]} numberOfLines={1} allowFontScaling={false}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: C.ink, paddingTop: 8 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 2 },
  label: { fontSize: 10, fontWeight: '600' },
  badge: { position: 'absolute', top: -5, right: -9, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.ink },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
