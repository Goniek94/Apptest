import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, SERIF } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { SearchScreen } from '@/features/catalog/screens/SearchScreen';
import { SellScreen } from '@/features/selling/screens/SellScreen';
import { MessagesScreen } from '@/features/messages/screens/MessagesScreen';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { useUnread } from '@/features/messages/UnreadContext';
import { useNotifications } from '@/features/notifications/NotificationsContext';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICON: Record<string, IconName> = {
  'Strona główna': 'home',
  Sklep: 'bag',
  Sprzedaj: 'plus',
  Wiadomości: 'chat',
  Profil: 'user',
};

const TAB_LABEL: Record<string, string> = {
  'Strona główna': 'Główna',
  Sklep: 'Sklep',
  Sprzedaj: 'Sprzedaj',
  Wiadomości: 'Czat',
  Profil: 'Profil',
};

/** Górny pasek mobilny (z AppShell): logo + ulubione + powiadomienia. */
function MobileHeader() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { unread } = useNotifications();
  return (
    <View style={[h.bar, { paddingTop: insets.top, height: 56 + insets.top }]}>
      <View style={h.logo}>
        <Icon name="hanger" size={20} color={C.gold} />
        <Text style={h.logoText}>AdBox</Text>
      </View>
      <View style={h.actions}>
        <TouchableOpacity onPress={() => navigation.navigate('Ulubione')} hitSlop={8}>
          <Icon name="heart" size={21} color={C.ink} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Powiadomienia')} hitSlop={8}>
          <View>
            <Icon name="bell" size={21} color={C.ink} />
            {unread > 0 && (
              <View style={h.badge}><Text style={h.badgeText} allowFontScaling={false}>{unread > 9 ? '9+' : unread}</Text></View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Własny dolny tab-bar (ciemny). Wysokość wynika z treści (ikona + podpis), więc
 * etykiety NIGDY się nie przycinają — w odróżnieniu od domyślnego paska na react-native-web.
 */
function MobileTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { unread } = useUnread();
  return (
    <View style={[tb.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const color = focused ? C.gold : 'rgba(255,255,255,0.55)';
        const showBadge = route.name === 'Wiadomości' && unread > 0;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity key={route.key} style={tb.item} onPress={onPress} activeOpacity={0.7}>
            <View>
              <Icon name={TAB_ICON[route.name]} size={22} color={color} />
              {showBadge && (
                <View style={tb.badge}>
                  <Text style={tb.badgeText} allowFontScaling={false}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              )}
            </View>
            <Text style={[tb.label, { color }]} numberOfLines={1} allowFontScaling={false}>
              {TAB_LABEL[route.name]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function Tabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <MobileTabBar {...props} />}
      screenOptions={{ header: () => <MobileHeader /> }}
    >
      <Tab.Screen name="Strona główna" component={HomeScreen} />
      <Tab.Screen name="Sklep" component={SearchScreen} />
      <Tab.Screen name="Sprzedaj" component={SellScreen} />
      <Tab.Screen name="Wiadomości" component={MessagesScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const h = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: C.ink },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  badge: { position: 'absolute', top: -6, right: -8, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.bg },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});

const tb = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: C.ink, paddingTop: 8 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 2 },
  label: { fontSize: 10, fontWeight: '600' },
  badge: { position: 'absolute', top: -5, right: -9, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.ink },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
