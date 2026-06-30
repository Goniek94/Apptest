import apiClient from './client';
import type { OfferStatus } from './offers';
import type { ReservationStatus } from './reservations';

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

export interface MessageOffer {
  id: string;
  amount: number;
  status: OfferStatus;
  proposedById: string;
  buyerId: string;
  sellerId: string;
}

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

export const fetchConversations = () => apiClient.get<Conversation[]>('/conversations').then((r) => r.data);
export const fetchThread = (id: string) => apiClient.get<Thread>(`/conversations/${id}`).then((r) => r.data);
export const sendMessage = (id: string, body: string) =>
  apiClient.post<Message>(`/conversations/${id}/messages`, { body }).then((r) => r.data);
export const startConversation = (listingId: string) =>
  apiClient.post<{ id: string }>(`/conversations/start?listingId=${listingId}`).then((r) => r.data);
export const markConversationRead = (id: string) => apiClient.post(`/conversations/${id}/read`).then(() => undefined);
export const deleteConversation = (id: string) => apiClient.delete(`/conversations/${id}`).then(() => undefined);
export const fetchUnreadCount = () =>
  apiClient.get<{ count: number }>('/conversations/unread-count').then((r) => r.data.count);

/** Wyślij zdjęcie w rozmowie (multipart → backend → bucket „messages"). */
export async function sendImageMessage(id: string, file: File): Promise<Message> {
  const form = new FormData();
  form.append('file', file, file.name);
  const { data } = await apiClient.post<Message>(`/conversations/${id}/messages/image`, form, {
    headers: { 'Content-Type': undefined } as any,
  });
  return data;
}
