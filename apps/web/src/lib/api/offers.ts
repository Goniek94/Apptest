import apiClient from './client';

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export const createOffer = (input: { listingId: string; amount: number; message?: string }) =>
  apiClient.post('/offers', input).then((r) => r.data);
export const acceptOffer = (id: string) => apiClient.patch(`/offers/${id}/accept`).then((r) => r.data);
export const rejectOffer = (id: string) => apiClient.patch(`/offers/${id}/reject`).then((r) => r.data);
export const cancelOffer = (id: string) => apiClient.patch(`/offers/${id}/cancel`).then((r) => r.data);
