import { colors, radii } from '@modamarket/shared/tokens';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: colors.bg,
        surface: colors.surface,
        'surface-alt': colors.surfaceAlt,
        ink: colors.ink,
        'ink-soft': colors.inkSoft,
        muted: colors.muted,
        gold: colors.gold,
        'gold-deep': colors.goldDeep,
        'gold-soft': colors.goldSoft,
        line: colors.line,
        success: colors.success,
        danger: colors.danger,
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: `${radii.md}px`,
        lg: `${radii.lg}px`,
        xl: `${radii.xl}px`,
        pill: `${radii.pill}px`,
      },
      backgroundImage: {
        gold: 'linear-gradient(180deg, #C9A24B 0%, #B8862F 55%, #9C6F23 100%)',
      },
      maxWidth: {
        phone: '440px',
      },
    },
  },
  plugins: [],
};
