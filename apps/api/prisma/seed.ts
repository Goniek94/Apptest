/**
 * Seed danych demo — ogłoszenia z obrazami (URL-e Unsplash, bez storage).
 * Uruchom: cd apps/api && npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seed.ts
 */
import { PrismaClient, ItemCondition } from '@prisma/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Wczytanie zmiennych z korzeniowego .env (skrypt poza kontekstem Nest/ConfigService).
const envPath = resolve(__dirname, '../../../.env');
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) {
    let v = m[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

const prisma = new PrismaClient();
const u = 'https://images.unsplash.com/';
const img = (id: string) => `${u}${id}?w=600&q=80`;

type Seed = {
  title: string; brand: string; price: number; size?: string; color?: string;
  condition: ItemCondition; slug: string; image: string; verified?: boolean;
};

const DATA: Seed[] = [
  { title: 'Trencz klasyczny', brand: 'ZARA', price: 19900, size: 'M', color: 'Beżowy', condition: 'VERY_GOOD', slug: 'odziez-damska', image: 'photo-1551488831-00ddcb6c6bd3', verified: true },
  { title: 'New Balance 530', brand: 'New Balance', price: 29900, size: '42', color: 'Beżowy', condition: 'NEW', slug: 'obuwie', image: 'photo-1539185441755-769473a23570', verified: true },
  { title: 'Torebka na ramię', brand: 'Mango', price: 15900, color: 'Czarny', condition: 'VERY_GOOD', slug: 'torebki', image: 'photo-1584917865442-de89df76afd3' },
  { title: 'Sukienka letnia', brand: 'H&M', price: 8900, size: 'S', color: 'Zielony', condition: 'GOOD', slug: 'odziez-damska', image: 'photo-1595777457583-95e059d581b8' },
  { title: "Air Max 1 'Vintage'", brand: 'Nike', price: 45900, size: '42', color: 'Biały', condition: 'VERY_GOOD', slug: 'obuwie', image: 'photo-1542291026-7eec264c27ff', verified: true },
  { title: 'Kurtka Nuptse', brand: 'The North Face', price: 72000, size: 'M', color: 'Czarny', condition: 'NEW', slug: 'odziez-meska', image: 'photo-1551028719-00167b16eac5', verified: true },
  { title: 'Jeansy 501 Vintage', brand: "Levi's", price: 18900, size: 'W32', color: 'Niebieski', condition: 'GOOD', slug: 'odziez-meska', image: 'photo-1542272604-787c3835535d' },
  { title: 'Pasek GG Marmont', brand: 'Gucci', price: 89000, size: '90', color: 'Czarny', condition: 'VERY_GOOD', slug: 'akcesoria', image: 'photo-1624222247344-550fb60583dc', verified: true },
  { title: 'Bluza z kapturem', brand: 'Nike', price: 16900, size: 'L', color: 'Szary', condition: 'GOOD', slug: 'odziez-meska', image: 'photo-1556821840-3a63f95609a7' },
  { title: 'Marynarka slim', brand: 'Reserved', price: 24900, size: 'M', color: 'Granatowy', condition: 'VERY_GOOD', slug: 'odziez-meska', image: 'photo-1591047139829-d91aecb6caea', verified: true },
  { title: 'Sukienka wieczorowa', brand: 'Zara', price: 12900, size: 'S', color: 'Czarny', condition: 'NEW', slug: 'odziez-damska', image: 'photo-1572804013309-59a88b7e92f1', verified: true },
  { title: 'Okulary przeciwsłoneczne', brand: 'Ray-Ban', price: 34900, color: 'Czarny', condition: 'VERY_GOOD', slug: 'akcesoria', image: 'photo-1511499767150-a48a237f0083', verified: true },
];

async function main() {
  // Sprzedawca demo (osobny od konta testowego, by „Moje ogłoszenia" zostały czyste).
  const seller = await prisma.user.upsert({
    where: { email: 'demo.sprzedawca@modamarket.pl' },
    update: {},
    create: {
      email: 'demo.sprzedawca@modamarket.pl',
      passwordHash: 'seed-no-login', // konto wyłącznie do prezentacji ofert
      displayName: 'ModaMarket Demo',
      accountType: 'BUSINESS',
      companyName: 'ModaMarket Demo Sp. z o.o.',
      verified: true,
      ratingAvg: 4.9,
      ratingCount: 128,
    },
  });

  const cats = await prisma.category.findMany();
  const catBySlug = new Map(cats.map((c) => [c.slug, c.id]));

  let created = 0;
  for (const d of DATA) {
    const categoryId = catBySlug.get(d.slug);
    if (!categoryId) continue;

    const exists = await prisma.listing.findFirst({
      where: { sellerId: seller.id, title: d.title },
    });
    if (exists) continue;

    await prisma.listing.create({
      data: {
        sellerId: seller.id,
        title: d.title,
        description: `Starannie wyselekcjonowany produkt premium marki ${d.brand}. Sprawdzony pod kątem autentyczności.`,
        price: d.price,
        brand: d.brand,
        size: d.size ?? null,
        color: d.color ?? null,
        condition: d.condition,
        categoryId,
        verified: d.verified ?? false,
        images: { create: { url: img(d.image), order: 0 } },
      },
    });
    created++;
  }

  const total = await prisma.listing.count();
  console.log(`Seed OK — utworzono ${created} nowych ogłoszeń (łącznie w bazie: ${total}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
