/**
 * Design tokens — jedno źródło prawdy dla web (Tailwind) i mobile (RN StyleSheet).
 * Wartości wyprowadzone z makiet ModaMarket (premium fashion marketplace).
 */

export const colors = {
  bg: '#FAF7F2',        // kremowe tło aplikacji
  surface: '#FFFFFF',   // karty, pola
  surfaceAlt: '#F6F1E8', // delikatne wyróżnienie (np. bąbelki czatu, banner)
  ink: '#1E1B16',       // główny tekst / „dark"
  inkSoft: '#444038',   // tekst drugorzędny (opisy)
  muted: '#9A9387',     // tekst wyciszony, placeholdery
  gold: '#C0913C',      // akcent marki
  goldDeep: '#A8772A',  // ciemniejszy stop gradientu / hover
  goldSoft: '#F2E9D5',  // tła ikon, badge
  line: '#ECE6DB',      // obramowania, separatory
  success: '#3C7A4E',   // statusy „gotowe/opłacone"
  danger: '#C0453C',    // serce ulubionych, błędy
} as const;

/** Złoty gradient z przycisków CTA na makietach. */
export const goldGradient = {
  from: '#C9A24B',
  via: '#B8862F',
  to: '#9C6F23',
  /** gotowy do CSS */
  css: 'linear-gradient(180deg, #C9A24B 0%, #B8862F 55%, #9C6F23 100%)',
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const fonts = {
  serif: "'Playfair Display', Georgia, serif", // nagłówki
  sans: "'Inter', system-ui, sans-serif",      // treść
} as const;

export const fontFamilyNative = {
  serif: 'serif' as const,   // RN: nadpisywane per-platforma w aplikacji
  sans: 'System' as const,
};

export type ColorToken = keyof typeof colors;

export const tokens = { colors, goldGradient, radii, spacing, fonts } as const;
