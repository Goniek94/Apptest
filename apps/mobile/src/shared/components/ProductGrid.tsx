import React from 'react';
import { View } from 'react-native';
import type { Listing } from '@modamarket/shared';
import { ProductCard } from '@/shared/components/ProductCard';

/**
 * Siatka 2-kolumnowa kart produktu — wspólna dla Home/Sklep/Ulubione.
 * Dla nieparzystej liczby elementów ostatnia karta nie rozjeżdża się na całą szerokość.
 */
export function ProductGrid({ items, gap = 12 }: { items: Listing[]; gap?: number }) {
  const rows: Listing[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));

  return (
    <View style={{ gap: 20 }}>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap }}>
          {row.map((p, i) => <ProductCard key={`${p.id}-${i}`} p={p} />)}
          {row.length === 1 && <View style={{ flex: 1 }} />}
        </View>
      ))}
    </View>
  );
}
