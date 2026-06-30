import apiClient from './client';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

/** Węzeł drzewa kategorii — do 3 poziomów (główne → podkategorie → pod-podkategorie). */
export interface CategoryTree extends Category {
  children?: CategoryTree[];
}

/** Drzewo kategorii (główne + podkategorie) do wyboru w „Sprzedaj". */
export async function fetchCategoryTree(): Promise<CategoryTree[]> {
  const { data } = await apiClient.get<CategoryTree[]>('/categories');
  return data;
}
