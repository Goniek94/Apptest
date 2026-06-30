import apiClient from '@/shared/api/client';

export type OfferStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'COUNTERED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface OfferParty {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
  accountType: 'PRIVATE' | 'BUSINESS';
}

export interface OfferListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  images: { url: string }[];
}

export interface ApiOffer {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  proposedById: string;
  amount: number;
  status: OfferStatus;
  message: string | null;
  createdAt: string;
  buyer: OfferParty;
  seller: OfferParty;
  listing: OfferListing;
}

export function fetchMyOffers(): Promise<ApiOffer[]> {
  return apiClient.get<ApiOffer[]>('/offers/mine').then((r) => r.data);
}

export function createOffer(input: { listingId: string; amount: number; message?: string }): Promise<ApiOffer> {
  return apiClient.post<ApiOffer>('/offers', input).then((r) => r.data);
}

export function acceptOffer(id: string): Promise<ApiOffer> {
  return apiClient.patch<ApiOffer>(`/offers/${id}/accept`).then((r) => r.data);
}

export function rejectOffer(id: string): Promise<ApiOffer> {
  return apiClient.patch<ApiOffer>(`/offers/${id}/reject`).then((r) => r.data);
}

export function cancelOffer(id: string): Promise<ApiOffer> {
  return apiClient.patch<ApiOffer>(`/offers/${id}/cancel`).then((r) => r.data);
}

export function counterOffer(id: string, input: { amount: number; message?: string }): Promise<ApiOffer> {
  return apiClient.post<ApiOffer>(`/offers/${id}/counter`, input).then((r) => r.data);
}
