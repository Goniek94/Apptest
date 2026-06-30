import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ModaMarket — marketplace mody premium',
  description: 'Kupuj i sprzedawaj modę z zaufaniem. Oferty, „Kup w zespole", bezpieczne płatności.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
