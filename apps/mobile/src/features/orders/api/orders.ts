import apiClient from '@/shared/api/client';

export type OrderStatus =
  | 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'DISPUTED';

export interface OrderParty {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
  accountType: 'PRIVATE' | 'BUSINESS';
}

export interface ApiOrder {
  id: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  commission: number;
  shippingFee: number;
  status: OrderStatus;
  createdAt: string;
  listing: { id: string; title: string; price: number; currency: string; images: { url: string }[] };
  buyer: OrderParty;
  seller: OrderParty;
}

export interface WalletSummary {
  available: number;
  pending: number;
  earnedTotal: number;
  salesCount: number;
  currency: string;
}

export const fetchMyOrders = () => apiClient.get<ApiOrder[]>('/orders/mine').then((r) => r.data);
export const fetchWallet = () => apiClient.get<WalletSummary>('/orders/wallet').then((r) => r.data);
