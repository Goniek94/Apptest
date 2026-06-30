export interface RecentItem {
  id: string;
  title: string;
  price: number;
  image: string;
  ts: number;
}

const KEY = 'mm_recent';
const MAX = 8;

/** Zapisuje obejrzany produkt na początek listy „ostatnio oglądane". */
export function pushRecent(it: Omit<RecentItem, 'ts'>): void {
  if (typeof window === 'undefined' || !it.id) return;
  try {
    const cur: RecentItem[] = JSON.parse(localStorage.getItem(KEY) || '[]');
    const next = [{ ...it, ts: Date.now() }, ...cur.filter((x) => x.id !== it.id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}

export function getRecent(): RecentItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}
