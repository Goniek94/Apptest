import type {
  Listing,
  Category,
  User,
  Conversation,
  Order,
  GroupBuy,
  PaymentMethod,
} from './types';

const u = 'https://images.unsplash.com/';
export const IMG = {
  trench: `${u}photo-1551488831-00ddcb6c6bd3?w=600&q=80`,
  nb: `${u}photo-1539185441755-769473a23570?w=600&q=80`,
  bag: `${u}photo-1584917865442-de89df76afd3?w=600&q=80`,
  cap: `${u}photo-1588850561407-ed78c282e89b?w=600&q=80`,
  blazer: `${u}photo-1591047139829-d91aecb6caea?w=600&q=80`,
  jeans: `${u}photo-1542272604-787c3835535d?w=600&q=80`,
  sneaker: `${u}photo-1606107557195-0e29a4b5b4aa?w=600&q=80`,
  hoodie: `${u}photo-1556821840-3a63f95609a7?w=600&q=80`,
  dress: `${u}photo-1595777457583-95e059d581b8?w=600&q=80`,
  dressW: `${u}photo-1572804013309-59a88b7e92f1?w=600&q=80`,
  airmax: `${u}photo-1542291026-7eec264c27ff?w=600&q=80`,
  nuptse: `${u}photo-1551028719-00167b16eac5?w=600&q=80`,
  belt: `${u}photo-1624222247344-550fb60583dc?w=600&q=80`,
  sunglasses: `${u}photo-1511499767150-a48a237f0083?w=600&q=80`,
  group: `${u}photo-1483985988355-763728e1935b?w=900&q=80`,
  avatar: `${u}photo-1494790108377-be9c29b29330?w=200&q=80`,
};

export const CATEGORIES: Category[] = [
  { id: 'c1', name: 'Odzież damska', slug: 'odziez-damska', imageUrl: IMG.dress },
  { id: 'c2', name: 'Odzież męska', slug: 'odziez-meska', imageUrl: IMG.hoodie },
  { id: 'c3', name: 'Obuwie', slug: 'obuwie', imageUrl: IMG.sneaker },
  { id: 'c4', name: 'Torebki', slug: 'torebki', imageUrl: IMG.bag },
  { id: 'c5', name: 'Akcesoria', slug: 'akcesoria', imageUrl: IMG.cap },
  { id: 'c6', name: 'Biżuteria', slug: 'bizuteria', imageUrl: IMG.sunglasses },
];

/** ceny w groszach (zgodnie z Prisma.Listing.price). */
export const LISTINGS: Listing[] = [
  { id: 'l1', title: 'Trencz klasyczny', brand: 'ZARA', price: 19900, currency: 'PLN', size: 'M', color: 'Beżowy', condition: 'VERY_GOOD', categorySlug: 'odziez-damska', status: 'ACTIVE', verified: true, imageUrl: IMG.trench, sellerId: 'u1' },
  { id: 'l2', title: 'New Balance 530', brand: 'New Balance', price: 29900, currency: 'PLN', size: '42', color: 'Beżowy', condition: 'NEW', categorySlug: 'obuwie', status: 'ACTIVE', verified: true, imageUrl: IMG.nb, sellerId: 'u2' },
  { id: 'l3', title: 'Torebka na ramię', brand: 'Mango', price: 15900, currency: 'PLN', color: 'Czarny', condition: 'VERY_GOOD', categorySlug: 'torebki', status: 'ACTIVE', verified: false, imageUrl: IMG.bag, sellerId: 'u1' },
  { id: 'l4', title: 'Sukienka letnia', brand: 'H&M', price: 8900, currency: 'PLN', size: 'S', color: 'Zielony', condition: 'GOOD', categorySlug: 'odziez-damska', status: 'ACTIVE', verified: false, imageUrl: IMG.dress, sellerId: 'u3' },
  { id: 'l5', title: "Air Max 1 'Vintage'", brand: 'Nike', price: 45900, currency: 'PLN', size: '42', color: 'Biały', condition: 'VERY_GOOD', categorySlug: 'obuwie', status: 'ACTIVE', verified: true, imageUrl: IMG.airmax, sellerId: 'u2' },
  { id: 'l6', title: 'Kurtka Nuptse', brand: 'The North Face', price: 72000, currency: 'PLN', size: 'M', color: 'Czarny', condition: 'NEW', categorySlug: 'odziez-meska', status: 'ACTIVE', verified: true, imageUrl: IMG.nuptse, sellerId: 'u4' },
  { id: 'l7', title: 'Jeansy 501 Vintage', brand: "Levi's", price: 18900, currency: 'PLN', size: 'W32', color: 'Niebieski', condition: 'GOOD', categorySlug: 'odziez-meska', status: 'ACTIVE', verified: false, imageUrl: IMG.jeans, sellerId: 'u3' },
  { id: 'l8', title: 'Pasek GG Marmont', brand: 'Gucci', price: 89000, currency: 'PLN', size: '90', color: 'Czarny', condition: 'VERY_GOOD', categorySlug: 'akcesoria', status: 'ACTIVE', verified: true, imageUrl: IMG.belt, sellerId: 'u4' },
  { id: 'l9', title: 'Bluza z kapturem', brand: 'Nike', price: 16900, currency: 'PLN', size: 'L', color: 'Szary', condition: 'GOOD', categorySlug: 'odziez-meska', status: 'ACTIVE', verified: false, imageUrl: IMG.hoodie, sellerId: 'u2' },
  { id: 'l10', title: 'Marynarka slim', brand: 'Reserved', price: 24900, currency: 'PLN', size: 'M', color: 'Granatowy', condition: 'VERY_GOOD', categorySlug: 'odziez-meska', status: 'ACTIVE', verified: true, imageUrl: IMG.blazer, sellerId: 'u4' },
  { id: 'l11', title: 'Sukienka wieczorowa', brand: 'Zara', price: 12900, currency: 'PLN', size: 'S', color: 'Czarny', condition: 'NEW', categorySlug: 'odziez-damska', status: 'ACTIVE', verified: true, imageUrl: IMG.dressW, sellerId: 'u1' },
  { id: 'l12', title: 'Czapka z daszkiem', brand: 'New Era', price: 7900, currency: 'PLN', color: 'Beżowy', condition: 'GOOD', categorySlug: 'akcesoria', status: 'ACTIVE', verified: false, imageUrl: IMG.cap, sellerId: 'u3' },
  { id: 'l13', title: 'Okulary przeciwsłoneczne', brand: 'Ray-Ban', price: 34900, currency: 'PLN', color: 'Czarny', condition: 'VERY_GOOD', categorySlug: 'akcesoria', status: 'ACTIVE', verified: true, imageUrl: IMG.sunglasses, sellerId: 'u2' },
  { id: 'l14', title: 'Sneakersy retro', brand: 'Adidas', price: 21900, currency: 'PLN', size: '41', color: 'Biały', condition: 'GOOD', categorySlug: 'obuwie', status: 'ACTIVE', verified: false, imageUrl: IMG.sneaker, sellerId: 'u3' },
];

export const USERS: User[] = [
  { id: 'u1', displayName: 'Anna Kowalska', email: 'anna.kowalska@email.com', avatarUrl: IMG.avatar, accountType: 'PRIVATE', ratingAvg: 4.9, ratingCount: 128, verified: true, joinedLabel: 'marzec 2023' },
  { id: 'u2', displayName: 'moda_seller', email: 'seller@email.com', accountType: 'BUSINESS', ratingAvg: 4.8, ratingCount: 64, verified: true, joinedLabel: 'styczeń 2022' },
];

export const FAVORITES: Listing[] = [LISTINGS[0], LISTINGS[1], LISTINGS[2], LISTINGS[3]];

export const PAYMENT_METHODS: { method: PaymentMethod; title: string; sub: string }[] = [
  { method: 'BLIK', title: 'BLIK', sub: 'Płatność kodem BLIK' },
  { method: 'CARD', title: 'Karta płatnicza', sub: 'Visa, Mastercard, Maestro' },
  { method: 'TRANSFER', title: 'Szybki przelew', sub: 'Przelewy online' },
  { method: 'WALLET', title: 'Apple Pay / Google Pay', sub: 'Płać szybko i bezpiecznie' },
];

export const CONVERSATION: Conversation = {
  id: 'conv1',
  peer: { displayName: 'Kasia90', avatarUrl: IMG.avatar },
  onlineLabel: 'Ostatnio online: dziś o 09:32',
  listing: { title: 'Trencz klasyczny ZARA', price: 19900, imageUrl: IMG.trench, status: 'ACTIVE' },
  messages: [
    { id: 'm1', fromMe: true, body: 'Dzień dobry! Czy płaszcz jest nadal dostępny?', timeLabel: '09:15', read: true },
    { id: 'm2', fromMe: false, body: 'Dzień dobry! Tak, jest nadal dostępny.', timeLabel: '09:16' },
    { id: 'm3', fromMe: true, body: 'Świetnie! Czy mogę prosić o wymiary? Interesuje mnie długość całkowita i szerokość w ramionach.', timeLabel: '09:18', read: true },
    { id: 'm4', fromMe: false, body: 'Oczywiście 🙂 Długość całkowita: 110 cm, szerokość w ramionach: 42 cm.', timeLabel: '09:19' },
    { id: 'm5', fromMe: true, body: 'Dziękuję! Czy mogłaby Pani przesłać jeszcze zdjęcie metki?', timeLabel: '09:20', read: true },
    { id: 'm6', fromMe: false, body: 'Jasne, zaraz prześlę.', timeLabel: '09:21' },
    { id: 'm7', fromMe: false, images: [IMG.trench, IMG.blazer], timeLabel: '09:21' },
  ],
};

export const ORDER: Order = {
  id: 'MM123456',
  listing: { title: 'Trencz klasyczny ZARA', brand: 'ZARA', price: 19900, imageUrl: IMG.trench, size: 'M', color: 'Beżowy' },
  amount: 19900,
  shippingFee: 0,
  status: 'PAID',
  shippingMethod: 'Kurier InPost',
  placedAtLabel: '24.05.2024, 10:34',
  paymentMethod: 'BLIK',
};

export const GROUP_BUYS: GroupBuy[] = [
  { id: 'g1', listing: { title: 'Kurtka Nuptse', brand: 'The North Face', price: 72000, imageUrl: IMG.nuptse }, threshold: 10, joined: 7, deadlineLabel: 'kończy się za 2 dni', status: 'FORMING' },
  { id: 'g2', listing: { title: 'Air Max 1 Vintage', brand: 'Nike', price: 45900, imageUrl: IMG.airmax }, threshold: 8, joined: 8, deadlineLabel: 'próg osiągnięty', status: 'FILLED' },
];
