import { Platform } from 'react-native';
import { colors } from '@modamarket/shared';

// Kolory pochodzą ze wspólnego rdzenia (@modamarket/shared) — jedno źródło prawdy z web.
export const C = colors;

// Serif per-platforma (Playfair niedostępny natywnie bez expo-font; tu fallback systemowy).
export const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string;
