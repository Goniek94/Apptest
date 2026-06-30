import { Platform } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import apiClient from '@/shared/api/client';
import type { OfferStatus } from '@/features/offers/api/offers';
import type { ReservationStatus } from '@/features/reservations/api/reservations';
import type { PickedImage } from '@/features/catalog/api/listings';

export type MessageType = 'TEXT' | 'IMAGE' | 'OFFER' | 'RESERVATION' | 'SYSTEM';

export interface ConvUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
  accountType: 'PRIVATE' | 'BUSINESS';
}

export interface ConvListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  images: { url: string }[];
}

/** Oferta dołączona do wiadomości typu OFFER (do narysowania karty). */
export interface MessageOffer {
  id: string;
  amount: number;
  status: OfferStatus;
  proposedById: string;
  buyerId: string;
  sellerId: string;
}

/** Rezerwacja dołączona do wiadomości typu RESERVATION. */
export interface MessageReservation {
  id: string;
  hours: number;
  status: ReservationStatus;
  buyerId: string;
  sellerId: string;
  expiresAt: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  type: MessageType;
  imageUrl?: string | null;
  offerId: string | null;
  offer: MessageOffer | null;
  reservation?: MessageReservation | null;
  readAt: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string | null;
  buyer: ConvUser;
  seller: ConvUser;
  listing: ConvListing | null;
  lastMessage: Message | null;
  unread: number;
  updatedAt: string;
}

export interface Thread {
  conversation: Omit<Conversation, 'lastMessage' | 'unread'>;
  messages: Message[];
}

export function fetchConversations(): Promise<Conversation[]> {
  return apiClient.get<Conversation[]>('/conversations').then((r) => r.data);
}

export function fetchThread(id: string): Promise<Thread> {
  return apiClient.get<Thread>(`/conversations/${id}`).then((r) => r.data);
}

export function sendMessage(id: string, body: string): Promise<Message> {
  return apiClient.post<Message>(`/conversations/${id}/messages`, { body }).then((r) => r.data);
}

/** Wyślij zdjęcie w rozmowie (multipart → backend → bucket „messages"). */
export async function sendImageMessage(id: string, asset: PickedImage): Promise<Message> {
  const form = new FormData();
  const name = asset.name ?? `chat-${Date.now()}.jpg`;
  if (Platform.OS === 'web') {
    const blob = await (await fetch(asset.uri)).blob();
    form.append('file', blob, name);
  } else {
    // iPhone (HEIC) — sharp na serwerze tego nie czyta; konwersja do JPEG na telefonie.
    const jpeg = await manipulateAsync(asset.uri, [], { compress: 0.8, format: SaveFormat.JPEG });
    form.append('file', { uri: jpeg.uri, name: `chat-${Date.now()}.jpg`, type: 'image/jpeg' } as any);
  }
  const { data } = await apiClient.post<Message>(`/conversations/${id}/messages/image`, form, {
    headers: { 'Content-Type': undefined } as any,
  });
  return data;
}

export function startConversation(listingId: string): Promise<{ id: string }> {
  return apiClient.post<{ id: string }>(`/conversations/start?listingId=${listingId}`).then((r) => r.data);
}

export function markConversationRead(id: string): Promise<void> {
  return apiClient.post(`/conversations/${id}/read`).then(() => undefined);
}

export function deleteConversation(id: string): Promise<void> {
  return apiClient.delete(`/conversations/${id}`).then(() => undefined);
}

export function fetchUnreadCount(): Promise<number> {
  return apiClient.get<{ count: number }>('/conversations/unread-count').then((r) => r.data.count);
}
