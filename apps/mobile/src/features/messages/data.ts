import { IMG } from '@modamarket/shared';
import type { IconName } from '@/shared/ui/Icon';

export type Convo = {
  id: string;
  name: string;
  avatar: string;
  product: string;
  productImg: string;
  last: string;
  time: string;
  unread?: number;
  dot?: 'gold' | 'gray';
  online?: boolean;
};

/** Demo rozmów (docelowo z API wiadomości). */
export const CONVOS: Convo[] = [
  { id: 'kasia90', name: 'Kasia90', avatar: IMG.avatar, product: 'Trencz klasyczny ZARA', productImg: IMG.trench, last: 'Dziękuję! Czy mogłaby Pani przesłać …', time: '09:20', unread: 1, online: true },
  { id: 'anna', name: 'Anna Kowalska', avatar: IMG.avatar, product: 'New Balance 530', productImg: IMG.nb, last: 'Czy buty są jeszcze dostępne?', time: '08:48', dot: 'gold', online: true },
  { id: 'vintage', name: 'VintageRoom', avatar: IMG.avatar, product: 'Torebka Furla', productImg: IMG.bag, last: 'Świetnie, dziękuję za informacje!', time: 'Wczoraj', dot: 'gold' },
  { id: 'tomek', name: 'TomekStyle', avatar: IMG.avatar, product: 'Sukienka midi', productImg: IMG.dress, last: 'Czy istnieje możliwość rezerwacji?', time: 'Wczoraj', dot: 'gray' },
  { id: 'ola', name: 'Ola Boutique', avatar: IMG.avatar, product: 'Loafersy skórzane', productImg: IMG.belt, last: 'Dziękuję za szybką odpowiedź!', time: '2 dni temu', online: true },
  { id: 'marek', name: 'Marek_88', avatar: IMG.avatar, product: 'Kurtka Nuptse', productImg: IMG.nuptse, last: 'Czy możliwa wysyłka jutro?', time: '2 dni temu', dot: 'gold', online: true },
  { id: 'lena', name: 'LenaStyle', avatar: IMG.avatar, product: 'Jeansy 501 Vintage', productImg: IMG.jeans, last: 'Dziękuję, biorę! 🙂', time: '3 dni temu', dot: 'gray' },
  { id: 'piotr', name: 'Piotr K.', avatar: IMG.avatar, product: 'Bluza z kapturem Nike', productImg: IMG.hoodie, last: 'Jaki dokładnie rozmiar?', time: '3 dni temu' },
  { id: 'zofia', name: 'Zofia92', avatar: IMG.avatar, product: 'Okulary Ray-Ban', productImg: IMG.sunglasses, last: 'Super, gorąco polecam!', time: '4 dni temu', online: true },
  { id: 'kuba', name: 'kuba_vintage', avatar: IMG.avatar, product: 'Marynarka slim', productImg: IMG.blazer, last: 'Czy cena do negocjacji?', time: '5 dni temu', dot: 'gold' },
];

export const SYSTEM: { icon: IconName; title: string; text: string; time: string }[] = [
  { icon: 'bell', title: 'Powiadomienia', text: 'Twoje ogłoszenie „Sukienka letnia" zostało wyróżnione.', time: '09:30' },
  { icon: 'shield', title: 'Bezpieczeństwo', text: 'Pamiętaj, aby rozmawiać i płacić tylko w aplikacji AdBox.', time: 'Wczoraj' },
  { icon: 'help', title: 'Obsługa klienta', text: 'Dziękujemy za kontakt. Odpowiemy najszybciej, jak to możliwe.', time: '2 dni temu' },
];

export const MSG_TABS = ['Odebrane', 'Wysłane', 'Inne'] as const;
export type MsgTab = (typeof MSG_TABS)[number];
