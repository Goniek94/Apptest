# Storage (zdjęcia) — Supabase

Pliki trzymamy w Supabase Storage. Upload zawsze idzie **przez backend** (proxy): aplikacja
wysyła zdjęcie do API, backend je waliduje i normalizuje (`sharp`: auto-orientacja wg EXIF,
zmniejszenie do max 1600 px, konwersja do **webp**, usunięcie metadanych/geolokalizacji),
a dopiero potem zapisuje w buckecie. Klient nigdy nie dotyka klucza serwisowego.

## Buckety (podział wg prywatności)

| Bucket | Dostęp | Zawartość | Limit |
|---|---|---|---|
| `listings` | **publiczny** (stały URL) | zdjęcia ofert | 10 MB |
| `avatars` | **publiczny** (stały URL) | awatary użytkowników/firm | 5 MB |
| `messages` | **prywatny** (signed URL) | załączniki/zdjęcia z czatu | 10 MB |
| `disputes` | **prywatny** (signed URL) | dowody do zwrotów/sporów | 10 MB |

- Publiczne: oferty i awatary są z natury widoczne dla każdego → stały, cache'owalny URL.
- Prywatne: czat i spory zawierają treści wrażliwe → dostęp tylko przez **wygasający signed URL**
  generowany przez backend dla uprawnionych.
- Każdy bucket przyjmuje wyłącznie `image/webp` (bo backend normalizuje do webp) i ma limit rozmiaru.

Buckety powstają **automatycznie przy starcie API** (`StorageService.ensureBuckets()`, idempotentnie) —
nie trzeba klikać nic w panelu Supabase.

## Układ folderów (taksonomia)

Jedno źródło prawdy: [`storage.paths.ts`](../apps/api/src/modules/storage/storage.paths.ts).
Nazwy plików to UUID (brak kolizji, brak wycieku nazwy z urządzenia).

```
listings/  {sellerId}/{listingId}/{uuid}.webp
avatars/   {userId}/{uuid}.webp
messages/  {conversationId}/{messageId}/{uuid}.webp
disputes/  {disputeId}/{uuid}.webp
```

Dzięki temu odnalezienie zasobów jest proste:

| Chcę znaleźć… | Prefiks |
|---|---|
| wszystkie zdjęcia jednej oferty | `listings/{sellerId}/{listingId}/` |
| wszystkie oferty sprzedawcy | `listings/{sellerId}/` |
| wszystkie zdjęcia z rozmowy | `messages/{conversationId}/` |
| dowody w jednym sporze | `disputes/{disputeId}/` |

## Moduł w kodzie

`apps/api/src/modules/storage/`

| Plik | Rola |
|---|---|
| `storage.config.ts` | definicje bucketów (publiczny/limit), typy wejściowe, parametry `sharp` |
| `storage.paths.ts` | budowniczowie ścieżek (taksonomia) |
| `storage.service.ts` | klient Supabase (service_role), `ensureBuckets`, `uploadImage`, `signedUrl`, `remove` |
| `storage.module.ts` | `@Global` — `StorageService` dostępny wszędzie |

`StorageService` jest globalny → moduły domenowe (ogłoszenia, profil, wiadomości, spory)
po prostu go wstrzykują i wołają `uploadImage(bucket, StoragePaths.x(...), file)`.

W bazie trzymamy **ścieżkę** (`ListingImage.path`) jako kanoniczne odniesienie do pliku
(potrzebne do usuwania), a dla bucketów publicznych dodatkowo gotowy `url`.

## Konfiguracja (.env, korzeń repo)

```
SUPABASE_URL=https://<projekt>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role — SEKRET, nigdy na froncie>
```

`service_role key`: Supabase Dashboard → **Project Settings → API → `service_role`**.
Ma pełne prawa (omija RLS) — wyłącznie po stronie backendu, nigdy w aplikacji mobilnej/web.

## Co dalej

- **Ogłoszenia:** endpoint uploadu zdjęć oferty (multipart) → `listings` + zapis `ListingImage`.
- **Profil:** upload awatara (kwadratowy przycinek 512 px) → `avatars`.
- **Wiadomości / spory:** upload do prywatnych bucketów + serwowanie przez signed URL.
