import apiClient from '@/shared/api/client';
import type { Listing } from '@modamarket/shared';
import { toListing, type ApiListing } from '@/features/catalog/api/listings';

/** Lista ulubionych — zwraca ogłoszenia (wymaga zalogowania). */
export async function listFavorites(): Promise<Listing[]> {
  const { data } = await apiClient.get<ApiListing[]>('/favorites');
  return data.map(toListing);
}

export async function addFavorite(listingId: string): Promise<void> {
  await apiClient.post(`/favorites/${listingId}`);
}

export async function removeFavorite(listingId: string): Promise<void> {
  await apiClient.delete(`/favorites/${listingId}`);
}
