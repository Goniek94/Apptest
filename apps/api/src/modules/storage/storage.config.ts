/**
 * Konfiguracja storage — JEDNO źródło prawdy o bucketach.
 *
 * Podział wg prywatności:
 *   • listings, avatars — PUBLICZNE (stały URL, każdy odczyt; zapis tylko przez backend)
 *   • messages, disputes — PRYWATNE (dostęp wyłącznie przez wygasający signed URL)
 *
 * Wewnątrz bucketa pliki są sortowane w foldery wg właściciela (patrz storage.paths.ts),
 * np. listings/{sellerId}/{listingId}/{id}.webp — łatwo odnaleźć wszystko danej oferty.
 */
export const BUCKETS = {
  listings: { name: 'listings', public: true, fileSizeLimit: 10 * 1024 * 1024 },
  avatars: { name: 'avatars', public: true, fileSizeLimit: 5 * 1024 * 1024 },
  messages: { name: 'messages', public: false, fileSizeLimit: 10 * 1024 * 1024 },
  disputes: { name: 'disputes', public: false, fileSizeLimit: 10 * 1024 * 1024 },
} as const;

export type BucketName = keyof typeof BUCKETS;

/** Typy wejściowe akceptowane z aplikacji (z telefonu mogą przyjść też HEIC/HEIF). */
export const ACCEPTED_INPUT_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

/** Wszystko normalizujemy do webp — taki format trafia do bucketa. */
export const STORED_MIME = 'image/webp';

/** Parametry normalizacji obrazu (sharp). */
export const IMAGE = {
  maxWidth: 1600,
  maxHeight: 1600,
  webpQuality: 80,
  avatarSize: 512,
} as const;
