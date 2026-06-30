import apiClient from './client';
import { toListing, type ApiListing } from './listings';
import type { Listing } from '@modamarket/shared';

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
