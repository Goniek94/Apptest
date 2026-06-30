import type { ItemCondition } from '@modamarket/shared';
import type { PickedImage } from '@/features/catalog/api/listings';

/** Roboczy szkic ogłoszenia — przekazywany z formularza do podglądu przed publikacją. */
export interface ListingDraft {
  title: string;
  description?: string;
  price: number; // grosze
  brand?: string;
  size?: string;
  material?: string;
  colors: string[]; // do 2
  widthCm?: number;
  lengthCm?: number;
  condition: ItemCondition;
  negotiable: boolean;
  unisex: boolean;
  quantity: number;
  groupBuy: boolean;
  categoryId: string;
  categoryLabel: string; // np. „Odzież męska › Koszulki sportowe"
}

export interface SellPreviewParams {
  draft: ListingDraft;
  photos: PickedImage[];
}
