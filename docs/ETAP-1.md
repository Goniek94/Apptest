# Etap 1 — jak uruchomić i sprawdzić

Krótki przewodnik odbioru technicznego Etapu 1 (monorepo: `apps/api`, `apps/web`,
`apps/mobile`, `packages/shared`, `prisma`). Wszystkie komendy uruchamiamy z
korzenia monorepo, chyba że napisano inaczej.

## 1. Konfiguracja

```bash
npm install
cp .env.example .env      # uzupełnij realne wartości (DB, JWT, Supabase)
```

Kontrakt zmiennych środowiskowych jest egzekwowany przy starcie API
(`apps/api/src/config/env.validation.ts`) — brak/niepoprawna wartość = aplikacja
nie wstaje (fail-fast). Minimum wymagane **do startu API**: `DATABASE_URL`,
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`.

`DIRECT_URL` jest **opcjonalny dla samego API** (runtime łączy się przez
`DATABASE_URL`), ale wymaga go **Prisma CLI** do migracji — połączenie bezpośrednie
(`:5432`), bo pooler Supabase (`:6543`) nie obsługuje migracji.

## 2. Baza danych (Prisma)

```bash
npx prisma format            # formatowanie schematu
npx prisma validate          # walidacja schematu
npx prisma generate          # generacja klienta
```

Historia migracji jest w `prisma/migrations/` (migracja bazowa `0_init` odpowiada
aktualnemu schematowi). Sposób założenia schematu zależy od stanu bazy:

- **Świeże, puste środowisko:**
  ```bash
  npx prisma migrate deploy        # zakłada schemat z migracji
  ```
- **Istniejąca baza** (utworzona wcześniej przez `db push`) — należy ją
  **jednorazowo zbaselinować**, oznaczając migrację bazową jako już zastosowaną.
  To **nie uruchamia SQL i nie modyfikuje danych** — zapisuje tylko fakt w tabeli
  `_prisma_migrations`:
  ```bash
  npx prisma migrate resolve --applied 0_init
  ```
  > Krok **ręczny i jednorazowy** (wymaga dostępu do bazy). Nie wykonujemy go
  > automatycznie, by nie ruszać produkcyjnej bazy bez świadomej decyzji.

## 3. Uruchomienie

```bash
npm run dev:web                       # apps/web (Next.js) → http://localhost:3000
npm run start:dev --workspace apps/api   # apps/api (NestJS) → http://localhost:4000
npm run dev:mobile                    # apps/mobile (Expo)
```

API udostępnia dokumentację Swagger pod `http://localhost:4000/api/docs`.

## 4. Kontrole jakości (to powinno przechodzić przy odbiorze)

| Komenda | Co sprawdza |
| --- | --- |
| `npm run typecheck --workspace packages/shared` | typy współdzielone |
| `npm run typecheck --workspace apps/api` | typy backendu |
| `npm run typecheck --workspace apps/web` | typy weba |
| `npm run build --workspace apps/web` | produkcyjny build weba (przechodzi) |
| `npm run build --workspace apps/api` | build backendu |
| `npm run test --workspace apps/api` | testy jednostkowe krytycznych ścieżek |
| `cd apps/mobile && npx tsc --noEmit` | typy aplikacji mobilnej |

## 5. Testy krytycznych ścieżek (`apps/api`)

Pokryte ścieżki (uruchom `npm run test --workspace apps/api`):

- **Auth — rotacja refresh tokenów** (`auth.service.spec.ts`): rotacja, wykrycie
  ponownego użycia/nieaktualnego tokenu (unieważnienie sesji), zły typ tokenu.
- **Oferty — atomowa akceptacja** (`offers.service.spec.ts`): warunkowy claim,
  rezerwacja ogłoszenia, brak podwójnej akceptacji (przegrany wyścig).
- **Rezerwacje — atomowość** (`reservations.service.spec.ts`): accept/cancel z
  guardem statusu ogłoszenia, zwolnienie ogłoszenia po anulowaniu.
- **Ownership ogłoszeń** (`listings.service.spec.ts`): tylko właściciel edytuje/usuwa.
- **Role admina** (`roles.guard.spec.ts`): dostęp do endpointów `@Roles(ADMIN)`.

## 6. Świadome ograniczenia Etapu 1 (poza zakresem)

Reset hasła przez e-mail (Resend/SMTP), realne płatności, checkout, wysyłki,
escrow, faktury, pełne „Kup w grupie", publikacja w sklepach mobilnych — należą
do Etapu 2/3 i nie są częścią odbioru Etapu 1.

### Rejestracja i weryfikacja konta — celowo wyłączone na tym etapie

- **Rejestracja jest świadomie wyłączona w Etapie 1.** Formularz „Załóż konto" pozostaje
  **jako widok** (web + mobile), ale kliknięcie przycisku **nie zakłada konta** — pokazuje
  komunikat, że rejestracja będzie wkrótce dostępna. Pełna logika rejestracji jest w kodzie
  (gotowa, przetestowana), tylko **nieaktywna w UI**.
- **Konta testowe i administracyjne zakładane są bezpośrednio w bazie danych** (skrypt
  Prisma). Na tym etapie nie otwieramy publicznej rejestracji, bo bez bramki e-mail/SMS
  nie ma sensu (brak weryfikacji adresu/numeru).
- **Weryfikacja adresu e-mail i numeru telefonu** oraz **reset hasła przez e-mail** — kod
  i endpointy są gotowe (`/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`,
  `resend-verification`, `mail.service.ts`), ale **realna wysyłka** wymaga zewnętrznego
  dostawcy e-mail/SMS. Integracja należy do **Etapu 2/3** (usługi e-mail/SMS = koszt
  zewnętrzny Zamawiającego, sekcja 9 umowy). Uruchamianie tego teraz byłoby marnowaniem
  zasobów; „włączenie" pełnej rejestracji + weryfikacji = wtedy drobna zmiana (podpięcie
  dostawcy + odblokowanie przycisku).

## 7. Dług techniczny — świadomie przeniesiony na dalsze etapy

> Na podstawie audytu technicznego (2026-06-29/30). Poniższe pozycje są **znane i
> zaakceptowane** jako dług techniczny. Etap 1 zamykamy z tą listą; nie wymagają
> dużego refactoru ani przebudowy architektury — to lokalne wzmocnienia do domknięcia
> w kolejnych etapach.
>
> **Aktualizacja 2026-06-30:** **K1 (migracje Prisma) i K4 (mobile typecheck) — domknięte.**
> Pozostaje **K2** (constraints DB), **K3** (sesja web — plan gotowy niżej) i **K5** (atomowość
> storage+baza) + lista P1/P2 → Etap 2/3.

### P0 — domknąć na starcie Etapu 2 (przed logiką zakupów/płatności)

| # | Temat | Stan | Docelowo |
| --- | --- | --- | --- |
| K1 | **Migracje Prisma** | ✅ **ZROBIONE** — `prisma/migrations/0_init/` + `migration_lock.toml`; `prisma validate` przechodzi (z `DIRECT_URL` z `.env.example`). | Gotowe. Istniejącą bazę baselinujemy `migrate resolve --applied 0_init` (sekcja 2). |
| K4 | **Mobile `typecheck`/`test`** | ✅ **ZROBIONE** — `typecheck: tsc --noEmit` w `apps/mobile`; root `typecheck` = shared+api+web+mobile. | Gotowe. Do dołożenia w Etapie 2: testy mobile + pełne CI. |
| K3 | **Sesja web — tokeny w `localStorage`** | ⏳ Etap 2 — **plan gotowy** (patrz „Plan K3" niżej). | Refresh → HttpOnly cookie; szczegóły poniżej. |
| K2 | **Twarde constraints w DB** | ⏳ Etap 2. | Migracje SQL: dodatnie kwoty/ilości, unikalny dedupe powiadomień, indeksy pod statusy/zapytania, partial-unique dla aktywnych rezerwacji/ofert. |

### P1 — w trakcie Etapu 2

- **Sesje per-urządzenie.** `User.hashedRefreshToken` trzyma **jeden** token → logowanie na web wyrzuca sesję mobilną (i odwrotnie). Wydzielić tabelę sesji/urządzeń.
- **Atomowość storage ↔ baza.** Rekord wiadomości/`ListingImage` powstaje niezależnie od uploadu — dodać cleanup po błędzie / outbox / kompensację.
- **Wygasanie rezerwacji.** Obecnie lazy (`sweepExpired` przy `findMine`) — przejść na cron/queue przed logiką zakupów.
- **Paginacja list admina/rozmów** (limit/offset lub cursor) — listy mogą urosnąć.
- **N+1 w licznikach nieprzeczytanych** rozmów — pojedyncze zapytanie agregujące.
- **Reconnect socketu po rotacji access tokena** — wymusić ponowny handshake nowym tokenem.
- **Kontrakty API** — generowanie typów ze Swaggera/OpenAPI lub mocniejszy pakiet `shared` zgodny z DTO (ujednolicić web/mobile).
- **Model order/payment** doprecyzować przed zakupami: idempotency keys, status machine, provider refs, snapshoty cen/danych.

### Plan K3 — sesja web na HttpOnly cookie

> Standardowy, sprawdzony wzorzec (NestJS + `cookie-parser`). Kopiujemy mechanikę,
> dostosowujemy tylko `sameSite` do deployu AdBox (różne domeny Vercel ↔ Railway).

**Co bierzemy 1:1 (NestJS + cookie-parser):**
- `setAuthCookies(res, access, refresh)`: `res.cookie('token'/'refreshToken', …, { httpOnly: true, secure: isProd, maxAge, path: '/' })`.
- `clearAuthCookies(res)` (logout) = `res.clearCookie(...)`.
- `main.ts`: `app.use(cookieParser())` + CORS `{ origin: FRONTEND_URL, credentials: true }`.
- Kontroler: `@Res({ passthrough: true })`; refresh czyta `req.cookies?.refreshToken` (nie z body).
- Web: usunąć refresh z `localStorage`; fetch/axios z `credentials: 'include'`; access krótko w pamięci.

**Dostosowanie do deployu AdBox (front i backend na różnych domenach):**
| Droga | Konfiguracja | CSRF | Ocena |
| --- | --- | --- | --- |
| **A. Cross-domain** (zostaje Vercel↔Railway) | `sameSite: 'none'; secure: true`; CORS z konkretnym originem (nie `*`) | trzeba dodać token CSRF | działa, więcej pracy |
| **B. Jedna domena** ⭐ | proxy Vercel `/api/*` → Railway **lub** subdomeny `adbox.pl` + `api.adbox.pl` → `sameSite: 'lax'` | „gratis" z `sameSite` | **rekomendowane** — wzór działa prawie bez zmian |

**Uwaga o mobile:** apka (Expo) zostaje na **SecureStore + Bearer** (cookie jej nie dotyczą). Backend musi
akceptować **OBA** tryby: cookie (web) **i** nagłówek `Authorization` (mobile) — czyli strategia JWT
czyta token najpierw z `req.cookies.token`, a w razie braku z `Authorization: Bearer`.

**Status:** P1, wdrożenie w Etapie 2 „w spokoju" (dotyka logowania na żywo → wymaga testów). Wzór gotowy,
niespodzianek brak.

### P2 — przed stabilizacją MVP

- Wyszukiwanie `contains` → PostgreSQL FTS/trigramy + indeksy.
- Ujednolicić klienty API web/mobile (wspólna logika refresh/błędów w `shared`).
- Typowane zdarzenia realtime (zamiast `any`).
- Testy UI/hooków web i mobile; e2e backendu (auth, listing CRUD, rezerwacje, oferty, wiadomości, admin RBAC).
- Audit log działań admina.
- Uporządkować strukturę `settings` (wersjonowanie/osobne tabele) i profil firmowy.
- **NIP** — checksum + unikalność (obecnie tylko walidacja formatu).

### P3 — kosmetyka

- Ujednolicić nazewnictwo **AdBox/ModaMarket** (kod, docs, nazwy paczek).
- Skrócić/sformatować długie linie w serwisach; ograniczyć komentarze opisujące przyszłe funkcje.
- Lint/format scripts + pre-commit/pre-push hooks.
- W produkcji ograniczyć/zabezpieczyć dostęp do `/api/docs`.

### Naprawione podczas odbioru (już NIE dług)

- **Upload zdjęć z iPhone (HEIC).** `sharp` na serwerze nie czyta HEIC → konwersja HEIC→JPEG na telefonie przed wysyłką (`expo-image-manipulator`).
- **Zapis zdjęć na produkcji.** `SUPABASE_SERVICE_ROLE_KEY` na hostingu miał wpisany URL zamiast klucza → upload zwracał 500. Poprawiono zmienną środowiskową.

> Uwaga metodologiczna: audyt analizował **kod repo**, więc nie wykrył powyższych dwóch
> błędów **runtime/konfiguracji** — wyłapano je dopiero testem na żywym sprzęcie/deployu.
> Wniosek na Etap 2: audyt kodu trzymać razem z testami na realnym urządzeniu i środowisku.
