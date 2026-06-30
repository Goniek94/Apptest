import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { Listing } from '@modamarket/shared';
import { C, SERIF } from '@/shared/theme';
import { ProductGrid } from '@/shared/components/ProductGrid';
import { useAuth } from '@/features/auth/context/AuthContext';
import { listFavorites } from '@/features/favorites/api/favorites';

/** Ulubione — zapisane oferty z API (wymaga zalogowania). */
export function FavoritesScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!user) { setLoading(false); return; }
      setLoading(true);
      listFavorites()
        .then((fav) => { if (!cancelled) setItems(fav); })
        .catch(() => { if (!cancelled) setItems([]); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [user]),
  );

  if (!user) {
    return (
      <View style={s.center}>
        <Text style={s.emptyTitle}>Zaloguj się, aby zapisywać ulubione</Text>
        <TouchableOpacity style={s.cta} onPress={() => navigation.navigate('Auth')} activeOpacity={0.85}>
          <Text style={s.ctaText}>Zaloguj się</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.count}>{items.length} zapisanych ofert</Text>
      {loading ? (
        <ActivityIndicator color={C.gold} style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <Text style={s.empty}>Nie masz jeszcze zapisanych ofert. Dotknij serca na ofercie, aby ją zapisać.</Text>
      ) : (
        <ProductGrid items={items} />
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  count: { fontFamily: SERIF, fontSize: 14, color: C.muted, marginBottom: 14 },
  empty: { color: C.muted, fontSize: 14, textAlign: 'center', marginTop: 30, lineHeight: 20, paddingHorizontal: 20 },
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: C.ink, textAlign: 'center', marginBottom: 20 },
  cta: { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
