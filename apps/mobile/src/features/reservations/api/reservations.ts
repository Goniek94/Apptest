import apiClient from '@/shared/api/client';

export type ReservationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export const RESERVATION_PERIODS: { hours: number; label: string }[] = [
  { hours: 24, label: '24 godziny' },
  { hours: 48, label: '48 godzin' },
  { hours: 72, label: '3 dni' },
  { hours: 120, label: '5 dni' },
];

export function createReservation(input: { listingId: string; hours: number; message?: string }) {
  return apiClient.post('/reservations', input).then((r) => r.data);
}
export const acceptReservation = (id: string) => apiClient.patch(`/reservations/${id}/accept`).then((r) => r.data);
export const rejectReservation = (id: string) => apiClient.patch(`/reservations/${id}/reject`).then((r) => r.data);
export const cancelReservation = (id: string) => apiClient.patch(`/reservations/${id}/cancel`).then((r) => r.data);
export const fetchMyReservations = () => apiClient.get('/reservations/mine').then((r) => r.data);
