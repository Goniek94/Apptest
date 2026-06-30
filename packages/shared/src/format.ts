import type { ItemCondition, OrderStatus, ListingStatus, PaymentMethod } from './types';

/** Formatuje kwotę w ZŁOTYCH (liczba zł) — np. zl(199) => „199,00 zł". */
export const zl = (n: number): string =>
  n.toLocaleString('pl-PL', { minimumFractionDigits: 2 }) + ' zł';

/** Formatuje kwotę zapisaną w GROSZACH (jak w Prisma.Listing.price) — grosze(19900) => „199,00 zł". */
export const grosze = (n: number): string => zl(n / 100);

export const conditionLabel = (c: ItemCondition): string =>
  ({
    NEW: 'Nowy',
    LIKE_NEW: 'Jak nowy',
    VERY_GOOD: 'Bardzo dobry',
    GOOD: 'Dobry',
  }[c]);

export const listingStatusLabel = (s: ListingStatus): string =>
  ({
    ACTIVE: 'Aktywne',
    RESERVED: 'Zarezerwowane',
    SOLD: 'Sprzedane',
    ARCHIVED: 'Archiwalne',
  }[s]);

export const orderStatusLabel = (s: OrderStatus): string =>
  ({
    PENDING: 'Oczekuje',
    PAID: 'Opłacone',
    SHIPPED: 'Wysłane',
    DELIVERED: 'Dostarczone',
    COMPLETED: 'Zakończone',
    CANCELLED: 'Anulowane',
    REFUNDED: 'Zwrócone',
    DISPUTED: 'Spór',
  }[s]);

/** Kolejność kroków na timeline zamówienia (makieta „Proces zamówienia"). */
export const ORDER_FLOW: OrderStatus[] = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'];

export const paymentMethodLabel = (m: PaymentMethod): string =>
  ({
    BLIK: 'BLIK',
    CARD: 'Karta płatnicza',
    TRANSFER: 'Szybki przelew',
    WALLET: 'Apple Pay / Google Pay',
  }[m]);
