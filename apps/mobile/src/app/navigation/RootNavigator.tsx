import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { C, SERIF } from '@/shared/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AuthScreen } from '@/features/auth/screens/AuthScreen';
import { ProductScreen } from '@/features/catalog/screens/ProductScreen';
import { FavoritesScreen } from '@/features/favorites/screens/FavoritesScreen';
import { GroupBuyScreen } from '@/features/group-buy/screens/GroupBuyScreen';
import { CheckoutScreen } from '@/features/orders/screens/CheckoutScreen';
import { OrderScreen } from '@/features/orders/screens/OrderScreen';
import { ListingPreviewScreen } from '@/features/selling/screens/ListingPreviewScreen';
import { ListingPublishedScreen } from '@/features/selling/screens/ListingPublishedScreen';
import { MyListingsScreen } from '@/features/selling/screens/MyListingsScreen';
import { SellScreen } from '@/features/selling/screens/SellScreen';
import { AboutScreen } from '@/features/content/screens/AboutScreen';
import { HelpScreen } from '@/features/content/screens/HelpScreen';
import { ContactScreen } from '@/features/content/screens/ContactScreen';
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';
import { SettingsDataScreen } from '@/features/settings/screens/SettingsDataScreen';
import { SettingsNotificationsScreen } from '@/features/settings/screens/SettingsNotificationsScreen';
import { SettingsPrivacyScreen } from '@/features/settings/screens/SettingsPrivacyScreen';
import { SettingsPreferencesScreen } from '@/features/settings/screens/SettingsPreferencesScreen';
import { ConversationScreen } from '@/features/messages/screens/ConversationScreen';
import { AdminScreen } from '@/features/admin/screens/AdminScreen';
import { TransakcjeScreen } from '@/features/orders/screens/TransakcjeScreen';
import { PortfelScreen } from '@/features/orders/screens/PortfelScreen';
import { NotificationsScreen } from '@/features/notifications/screens/NotificationsScreen';
import { Tabs } from './Tabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: C.bg, card: C.surface, border: C.line, primary: C.gold, text: C.ink },
};

function Splash() {
  return (
    <View style={s.splash}>
      <Text style={s.splashLogo}>AdBox</Text>
      <ActivityIndicator color={C.gold} style={{ marginTop: 16 }} />
    </View>
  );
}

/**
 * Główna nawigacja.
 * Wejście pokazuje od razu aplikację (Home) — przeglądanie jako gość.
 * Logowanie to ekran MODALNY otwierany na żądanie. Splash tylko na czas
 * odtwarzania sesji ze storage.
 */
export function RootNavigator() {
  const { loading } = useAuth();
  if (loading) return <Splash />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Produkt" component={ProductScreen} />
        <Stack.Screen name="Ulubione" component={FavoritesScreen} options={{ headerShown: true, title: 'Ulubione' }} />
        <Stack.Screen name="MojeOgloszenia" component={MyListingsScreen} options={{ headerShown: true, title: 'Moje ogłoszenia' }} />
        <Stack.Screen name="EdytujOgloszenie" component={SellScreen} />
        <Stack.Screen name="KupWGrupie" component={GroupBuyScreen} options={{ headerShown: true, title: 'Kup w grupie' }} />
        <Stack.Screen name="Platnosc" component={CheckoutScreen} options={{ headerShown: true, title: 'Płatność' }} />
        <Stack.Screen name="Zamowienie" component={OrderScreen} options={{ headerShown: true, title: 'Zamówienie' }} />
        <Stack.Screen name="ONas" component={AboutScreen} options={{ headerShown: true, title: 'O nas' }} />
        <Stack.Screen name="Pomoc" component={HelpScreen} options={{ headerShown: true, title: 'Pomoc' }} />
        <Stack.Screen name="Kontakt" component={ContactScreen} options={{ headerShown: true, title: 'Kontakt' }} />
        <Stack.Screen name="Ustawienia" component={SettingsScreen} options={{ headerShown: true, title: 'Ustawienia konta', headerLeft: () => null }} />
        <Stack.Screen name="UstawieniaDane" component={SettingsDataScreen} options={{ headerShown: true, title: 'Dane osobowe' }} />
        <Stack.Screen name="UstawieniaPowiadomienia" component={SettingsNotificationsScreen} options={{ headerShown: true, title: 'Powiadomienia' }} />
        <Stack.Screen name="UstawieniaPrywatnosc" component={SettingsPrivacyScreen} options={{ headerShown: true, title: 'Prywatność' }} />
        <Stack.Screen name="UstawieniaPreferencje" component={SettingsPreferencesScreen} options={{ headerShown: true, title: 'Preferencje' }} />
        <Stack.Screen name="Rozmowa" component={ConversationScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} options={{ headerShown: true, title: 'Panel administratora' }} />
        <Stack.Screen name="Transakcje" component={TransakcjeScreen} options={{ headerShown: true, title: 'Transakcje' }} />
        <Stack.Screen name="Portfel" component={PortfelScreen} options={{ headerShown: true, title: 'Portfel' }} />
        <Stack.Screen name="Powiadomienia" component={NotificationsScreen} options={{ headerShown: true, title: 'Powiadomienia' }} />
        <Stack.Screen name="PodgladOgloszenia" component={ListingPreviewScreen} />
        <Stack.Screen name="OgloszenieOpublikowane" component={ListingPublishedScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="Auth" component={AuthScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const s = StyleSheet.create({
  splash: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  splashLogo: { fontFamily: SERIF, fontSize: 28, fontWeight: '700', color: C.ink },
});
