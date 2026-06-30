import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { C } from '@/shared/theme';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { RealtimeProvider } from '@/shared/realtime/RealtimeContext';
import { UnreadProvider } from '@/features/messages/UnreadContext';
import { NotificationsProvider } from '@/features/notifications/NotificationsContext';
import { RootNavigator } from '@/app/navigation/RootNavigator';

/** Maks. szerokość kolumny „telefonu" — na szerokim oknie (web) widok zostaje wyśrodkowany. */
const PHONE_MAX_WIDTH = 480;

/**
 * Ramka responsywna: na telefonie zajmuje pełną szerokość, a na szerokim ekranie
 * (podgląd web / tablet) centruje treść do szerokości telefonu — apka wygląda spójnie
 * na każdej rozdzielczości.
 */
function ResponsiveFrame({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const constrained = width > PHONE_MAX_WIDTH;

  if (!constrained) return <>{children}</>;

  return (
    <View style={f.backdrop}>
      <View style={[f.column, { width: PHONE_MAX_WIDTH }]}>{children}</View>
    </View>
  );
}

/**
 * Korzeń aplikacji ModaMarket (mobile).
 * Providery: bezpieczne marginesy + sesja (AuthProvider) → nawigacja (RootNavigator).
 * Struktura: feature-first — patrz docs/MOBILE.md.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ResponsiveFrame>
        <AuthProvider>
          <RealtimeProvider>
            <UnreadProvider>
              <NotificationsProvider>
                <RootNavigator />
              </NotificationsProvider>
            </UnreadProvider>
          </RealtimeProvider>
        </AuthProvider>
      </ResponsiveFrame>
    </SafeAreaProvider>
  );
}

const f = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#15130F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    backgroundColor: C.bg,
    overflow: 'hidden',
  },
});
