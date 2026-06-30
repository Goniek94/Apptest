'use client';
import { useEffect, useState } from 'react';
import type { Listing } from '@modamarket/shared';
import { listFavorites } from '../lib/api/favorites';
import { useCurrentUser, openAuth } from '../lib/auth';
import { AccountLayout } from '../components/layout/AccountLayout';
import { ShopCard } from '../components/product/ProductCard';

export function FavoritesPage() {
  const { user, hydrated } = useCurrentUser();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { setLoading(false); return; }
    listFavorites().then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, [user, hydrated]);

  return (
    <AccountLayout active="ulubione">
      <h1 className="font-serif text-2xl md:text-[28px] font-semibold text-ink mb-1">Ulubione</h1>
      <p className="text-sm text-muted mb-6">Masz {items.length} zapisanych ofert</p>

      {!user && hydrated ? (
        <div className="text-center py-16 text-muted text-sm">
          Zaloguj się, aby zobaczyć ulubione.
          <button onClick={() => openAuth('login')} className="block mx-auto text-gold font-semibold mt-2">Zaloguj się</button>
        </div>
      ) : loading ? (
        <div className="text-center py-16 text-muted text-sm">Wczytywanie…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">Nie masz jeszcze ulubionych ofert.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {items.map((p) => <ShopCard key={p.id} p={p} />)}
        </div>
      )}
    </AccountLayout>
  );
}
