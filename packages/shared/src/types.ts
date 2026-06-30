/**
 * Lekkie typy domenowe — odwzorowanie enumów/modeli z prisma/schema.prisma.
 * Frontend operuje na tych typach; backend (Etap 1) zwróci zgodny kształt.
 */

export type Role = 'USER' | 'ADMIN';
export type AccountType = 'PRIVATE' | 'BUSINESS';

export type ListingStatus = 'ACTIVE' | 'RESERVED' | 'SOLD' | 'ARCHIVED';
export type ItemCondition = 'NEW' | 'LIKE_NEW' | 'VERY_GOOD' | 'GOOD';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'DISPUTED';

export type PaymentProvider = 'TPAY' | 'P24' | 'AUTOPAY';
export type PaymentMethod = 'BLIK' | 'CARD' | 'TRANSFER' | 'WALLET';

export type GroupBuyStatus = 'FORMING' | 'FILLED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

export interface User {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  accountType: AccountType;
  ratingAvg: number;
  ratingCount: number;
  verified: boolean;
  joinedLabel?: string; // np. „marzec 2023" (widok profilu)
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
}

export interface Listing {
  id: string;
  title: string;
  brand?: string;
  /** cena w groszach (zgodnie z Prisma.Listing.price) */
  price: number;
  currency: string;
  size?: string;
  color?: string;
  condition: ItemCondition;
  categorySlug: string;
  status: ListingStatus;
  verified: boolean;
  imageUrl: string;
  images?: string[];
  sellerId: string;
}

export interface OrderTimelineStep {
  status: OrderStatus;
  label: string;
  description?: string;
  at?: string;
  done: boolean;
  active?: boolean;
}

export interface Order {
  id: string;          // np. „MM123456"
  listing: Pick<Listing, 'title' | 'brand' | 'price' | 'imageUrl' | 'size' | 'color'>;
  amount: number;      // grosze
  shippingFee: number; // grosze
  status: OrderStatus;
  shippingMethod?: string;
  placedAtLabel?: string;
  paymentMethod?: PaymentMethod;
}

export interface ChatMessage {
  id: string;
  fromMe: boolean;
  body?: string;
  images?: string[];
  timeLabel: string;
  read?: boolean;
}

export interface Conversation {
  id: string;
  peer: Pick<User, 'displayName' | 'avatarUrl'>;
  onlineLabel?: string;
  listing?: Pick<Listing, 'title' | 'price' | 'imageUrl' | 'status'>;
  messages: ChatMessage[];
}

export interface GroupBuy {
  id: string;
  listing: Pick<Listing, 'title' | 'brand' | 'price' | 'imageUrl'>;
  threshold: number;
  joined: number;
  deadlineLabel: string;
  status: GroupBuyStatus;
}
