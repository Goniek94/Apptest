import apiClient from './client';

export type ReviewSentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

export interface Review {
  id: string;
  rating: number;
  sentiment: ReviewSentiment;
  comment: string | null;
  createdAt: string;
  author: { id: string; displayName: string; avatarUrl: string | null; accountType: 'PRIVATE' | 'BUSINESS' };
  order: { id: string; listing: { id: string; title: string } | null };
}

export interface ReviewStats {
  total: number;
  average: number;
  positive: number;
  neutral: number;
  negative: number;
  positivePercentage: number;
}

export interface PendingReview {
  orderId: string;
  listing: { id: string; title: string; images: { url: string }[] } | null;
  counterparty: { id: string; displayName: string; avatarUrl: string | null } | null;
  role: 'BUYER' | 'SELLER';
}

export const fetchReviewsForUser = (userId: string) =>
  apiClient.get<Review[]>(`/reviews/user/${userId}`).then((r) => r.data);

export const fetchReviewStats = (userId: string) =>
  apiClient.get<ReviewStats>(`/reviews/user/${userId}/stats`).then((r) => r.data);

export const fetchPendingReviews = () =>
  apiClient.get<PendingReview[]>('/reviews/pending').then((r) => r.data);

export const submitReview = (input: { orderId: string; rating: number; sentiment: ReviewSentiment; comment?: string }) =>
  apiClient.post<Review>('/reviews', input).then((r) => r.data);
