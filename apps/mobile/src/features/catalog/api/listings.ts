import { Platform } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import apiClient from '@/shared/api/client';
import type { Listing, ItemCondition } from '@modamarket/shared';

/** Surowy kształt ogłoszenia z API (zdjęcia jako tablica, kategoria/sprzedawca zagnieżdżone). */
export interface ApiListing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  brand: string | null;
  size: string | null;
  color: string | null;
  material: string | null;
  widthCm: number | null;
  lengthCm: number | null;
  condition: ItemCondition;
  negotiable: boolean;
  unisex: boolean;
  quantity: number;
  groupBuy: boolean;
  status: Listing['status'];
  verified: boolean;
  sellerId: string;
  images: { id: string; url: string; order: number }[];
  category?: { id: string; name: string; slug: string };
  seller?: { id: string; displayName: string; avatarUrl: string | null; ratingAvg?: number; ratingCount?: number; verified?: boolean; accountType?: 'PRIVATE' | 'BUSINESS' };
  orders?: { id: string; status: string }[]; // niezakończone transakcje (tylko w „Moje ogłoszenia")
  createdAt: string;
}

export interface ListingsQuery {
  q?: string;
  categorySlug?: string;
  brand?: string;
  size?: string;
  color?: string;
  condition?: ItemCondition;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

export interface CreateListingInput {
  title: string;
  description?: string;
  price: number; // grosze
  brand?: string;
  size?: string;
  color?: string;
  material?: string;
  widthCm?: number;
  lengthCm?: number;
  condition: ItemCondition;
  negotiable?: boolean;
  unisex?: boolean;
  quantity?: number;
  groupBuy?: boolean;
  categoryId: string;
}

/** API → kształt UI (Listing z @modamarket/shared): pierwsze zdjęcie jako imageUrl. */
export function toListing(a: ApiListing): Listing {
  return {
    id: a.id,
    title: a.title,
    brand: a.brand ?? undefined,
    price: a.price,
    currency: a.currency,
    size: a.size ?? undefined,
    color: a.color ?? undefined,
    condition: a.condition,
    categorySlug: a.category?.slug ?? '',
    status: a.status,
    verified: a.verified,
    imageUrl: a.images?.[0]?.url ?? '',
    images: a.images?.map((i) => i.url) ?? [],
    sellerId: a.sellerId,
  };
}

interface Paginated<T> { items: T[]; total: number; page: number; limit: number; pages: number }

export async function fetchListings(query: ListingsQuery = {}): Promise<{ items: Listing[]; total: number; pages: number }> {
  const { data } = await apiClient.get<Paginated<ApiListing>>('/listings', { params: query });
  return { items: data.items.map(toListing), total: data.total, pages: data.pages };
}

export async function fetchListing(id: string): Promise<{ listing: Listing; raw: ApiListing }> {
  const { data } = await apiClient.get<ApiListing>(`/listings/${id}`);
  return { listing: toListing(data), raw: data };
}

export async function createListing(input: CreateListingInput): Promise<ApiListing> {
  const { data } = await apiClient.post<ApiListing>('/listings', input);
  return data;
}

/** Moje ogłoszenia (wymaga zalogowania) — zwraca surowe ApiListing (ze statusem). */
export async function fetchMyListings(): Promise<ApiListing[]> {
  const { data } = await apiClient.get<ApiListing[]>('/listings/mine');
  return data;
}

export async function deleteListing(id: string): Promise<void> {
  await apiClient.delete(`/listings/${id}`);
}

export async function updateListing(id: string, input: Partial<CreateListingInput>): Promise<ApiListing> {
  const { data } = await apiClient.patch<ApiListing>(`/listings/${id}`, input);
  return data;
}

export async function deleteListingImage(imageId: string): Promise<void> {
  await apiClient.delete(`/listings/images/${imageId}`);
}

/** Ustaw istniejące zdjęcie jako główne (okładka) — przesuwa je na początek. */
export async function setListingImageCover(imageId: string): Promise<void> {
  await apiClient.patch(`/listings/images/${imageId}/cover`);
}

export interface PickedImage { uri: string; name?: string; type?: string }

/**
 * Wgranie zdjęcia ogłoszenia (multipart → backend → Supabase Storage).
 * Web: zamieniamy uri na Blob; natywnie: przekazujemy { uri, name, type }.
 */
export async function uploadListingImage(listingId: string, asset: PickedImage) {
  const form = new FormData();
  const name = asset.name ?? `photo-${Date.now()}.jpg`;

  if (Platform.OS === 'web') {
    const blob = await (await fetch(asset.uri)).blob();
    form.append('file', blob, name);
  } else {
    // iPhone zapisuje zdjęcia w HEIC, którego sharp na serwerze nie odczyta — konwertujemy
    // do JPEG na telefonie przed wysyłką (gwarantuje format, który backend przetworzy).
    const jpeg = await manipulateAsync(asset.uri, [], { compress: 0.8, format: SaveFormat.JPEG });
    form.append('file', { uri: jpeg.uri, name: `photo-${Date.now()}.jpg`, type: 'image/jpeg' } as any);
  }

  // Kasujemy domyślny application/json — przeglądarka/RN ustawią multipart/form-data
  // z poprawnym boundary same. Inaczej backend (multer) nie sparsuje pliku.
  const { data } = await apiClient.post(`/listings/${listingId}/images`, form, {
    headers: { 'Content-Type': undefined } as any,
  });
  return data;
}
