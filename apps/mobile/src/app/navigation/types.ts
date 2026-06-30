/** Typy tras — jedno źródło prawdy dla nawigacji (autouzupełnianie + bezpieczeństwo). */
import type { SellPreviewParams } from '@/features/selling/types';
import type { ApiListing } from '@/features/catalog/api/listings';

export type RootStackParamList = {
  Tabs: undefined;
  Produkt: { id: string };
  Ulubione: undefined;
  MojeOgloszenia: undefined;
  EdytujOgloszenie: { edit: ApiListing };
  KupWGrupie: undefined;
  Platnosc: { item: { id: string; title: string; price: number; imageUrl: string; size?: string; color?: string } } | undefined;
  Zamowienie: undefined;
  ONas: undefined;
  Pomoc: undefined;
  Kontakt: undefined;
  Ustawienia: undefined;
  UstawieniaDane: undefined;
  UstawieniaPowiadomienia: undefined;
  UstawieniaPrywatnosc: undefined;
  UstawieniaPreferencje: undefined;
  Rozmowa: { conversationId: string };
  Admin: undefined;
  Transakcje: undefined;
  Portfel: undefined;
  Powiadomienia: undefined;
  PodgladOgloszenia: SellPreviewParams;
  OgloszenieOpublikowane: { id: string; photoError?: boolean };
  Auth: undefined;
};

export type TabParamList = {
  'Strona główna': undefined;
  Sklep: undefined;
  Sprzedaj: undefined;
  Wiadomości: undefined;
  Profil: undefined;
};
