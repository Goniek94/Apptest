# AdBox — pełna dokumentacja projektu

Marketplace mody premium (C2C + B2C). Monorepo (npm workspaces): **jeden backend** obsługuje
**dwa frontendy** (web + mobile) korzystające z **tej samej bazy danych**.

```
marketplace-app/
├── apps/
│   ├── api/      → NestJS 10 + Prisma 6 + PostgreSQL (Supabase)   :4000/api/v1
│   ├── web/      → Next.js 15 (App Router) + Tailwind             :3000
│   └── mobile/   → Expo SDK 54 / React Native
├── packages/shared/   → wspólne typy, formatery, tokeny designu
└── docs/
```

> **Zasada:** ogłoszenie dodane na webie od razu widać na mobilce i odwrotnie — wspólny backend i baza.

---

## 1. Architektura i bezpieczeństwo

| Element | Odpowiada za |
|---|---|
| **JWT access (15 min) + refresh (7 dni)** | Autoryzacja; rotacja refresh tokena przy każdym użyciu |
| **ThrottlerGuard (global)** | Limit 100 żądań / 60 s na IP |
| **RolesGuard + @Roles(ADMIN)** | Dostęp do panelu admina |
| **CORS** | Dev: odbija origin (web `:3000` działa); prod: zawężony do `FRONTEND_URL` |
| **Supabase Storage** | Zdjęcia: buckety publiczne (`listings`, `avatars`), prywatne (`messages` — signed URL 24h) |
| **socket.io (gateway)** | Realtime: pokoje `user:<id>`, handshake z tokenem JWT |

**Tożsamość żądania:** `req.user = { userId, role, accountType }`.
**Klient (web i mobile):** `Authorization: Bearer <accessToken>`; przy 401 automatyczny `POST /auth/refresh`
(single-flight) i ponowienie żądania; przy nieudanym refreshu — wyczyszczenie sesji.

---

## 2. Backend — moduły i odpowiedzialności (`apps/api/src/modules`)

| Moduł | Odpowiada za | Główne endpointy |
|---|---|---|
| **auth** | Rejestracja (prywatne + firmowe z NIP), logowanie, refresh, reset hasła (scaffold), weryfikacja e-mail (scaffold) | `POST /auth/register`, `/login`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password` |
| **users** | Profil zalogowanego, aktualizacja danych + ustawień (`settings` JSON), walidacja (nazwa min. 2, NIP 10 cyfr) | `GET /users/me`, `PATCH /users/me` |
| **categories** | Drzewo kategorii 3-poziomowe (~137 liści) | `GET /categories` |
| **listings** | CRUD ogłoszeń, filtry/sort/paginacja, upload zdjęć (sharp→webp), pola firmowe (`quantity`, `groupBuy`) bramkowane kontem BUSINESS | `GET /listings`, `GET /listings/:id`, `POST /listings`, `PATCH/DELETE /listings/:id`, `POST /listings/:id/images`, `GET /listings/mine` |
| **favorites** | Ulubione | `GET /favorites`, `POST/DELETE /favorites/:id` |
| **offers** | Negocjacja ceny — oferta w czacie, akceptacja/odrzucenie/wycofanie | `POST /offers`, `PATCH /offers/:id/{accept,reject,cancel}` |
| **reservations** | Rezerwacja przedmiotu (24h–5 dni), akceptacja sprzedawcy, auto-wygasanie | `POST /reservations`, `PATCH /reservations/:id/{accept,reject,cancel}` |
| **messages** | Rozmowy + wiadomości (TEXT/IMAGE/OFFER/RESERVATION/SYSTEM), licznik nieprzeczytanych | `GET /conversations`, `GET /conversations/:id`, `POST /conversations/:id/messages(/image)`, `POST /conversations/start` |
| **reviews** | Oceny po transakcji (1–5★ + sentyment + komentarz), bramkowane zakończonym zamówieniem, anty-duplikat, przeliczanie `ratingAvg/ratingCount`, statystyki | `POST /reviews`, `GET /reviews/user/:id`, `GET /reviews/user/:id/stats`, `GET /reviews/pending` |
| **orders** | Transakcje użytkownika + portfel (read-only; tworzenie zamówień = Etap 2) | `GET /orders/mine`, `GET /orders/wallet` |
| **notifications** | Powiadomienia z deduplikacją (anti-spam) + emisja realtime `notification:new` | `GET /notifications`, `/unread-count`, `PATCH /read`, `/:id/read` |
| **admin** | Statystyki + moderacja użytkowników (ban/weryfikacja/rola) i ogłoszeń (weryfikacja/status/usuń) | `GET /admin/stats`, `/admin/users`, `/admin/listings`, `PATCH/DELETE …` |
| **realtime** (`@Global`) | Gateway socket.io, emisja zdarzeń | events: `message:new`, `conversation:update`, `offer:update`, `reservation:update`, `notification:new` |

---

## 3. Web (`apps/web`) — co podłączone do backendu

Framework: **Next.js 15**. Warstwa integracji: `apps/web/src/lib/`.

### Warstwa API (`src/lib/`)
| Plik | Odpowiada za |
|---|---|
| `api/client.ts` | Instancja axios, `baseURL` z `NEXT_PUBLIC_API_URL`, interceptor JWT + refresh 401 (single-flight) |
| `api/tokens.ts` | Tokeny w `localStorage` (SSR-safe) |
| `api/auth.ts` | login / register / fetchMe / logout |
| `auth.ts` | Globalny store sesji + hooki `useAuth()` / `useCurrentUser()` + modal logowania |
| `api/listings.ts` | Ogłoszenia (lista/szczegół/twoje), tworzenie, upload zdjęć (`File`) |
| `api/categories.ts` | Drzewo kategorii |
| `api/favorites.ts` | Ulubione |
| `api/messages.ts` | Rozmowy/wiadomości (tekst + zdjęcie) |
| `api/offers.ts`, `api/reservations.ts` | Akcje ofert i rezerwacji w czacie |
| `api/orders.ts` | Transakcje + portfel |
| `api/reviews.ts` | Oceny + statystyki + oczekujące |
| `api/users.ts` | Aktualizacja profilu/ustawień |
| `api/admin.ts` | Statystyki + moderacja |
| `realtime.ts` | Singleton socket.io + hook `useRealtimeEvent()` |

### Strony (`src/routes/*` renderowane przez `app/(main)/*`)
| Strona | Status | Źródło danych |
|---|---|---|
| **Logowanie / Rejestracja** | ✅ realne | `/auth/*` (konta firmowe z NIP, walidacja) |
| **Home** | ✅ realne | `/listings` |
| **Szukaj** | ✅ realne | `/listings` + filtry/sort + `?q=`, `?categorySlug=` |
| **Produkt** | ✅ realne | `/listings/:id` (+ „Napisz" → `startConversation`) |
| **Sprzedaj** | ✅ realne | `POST /listings` + upload zdjęć + kategorie z backendu |
| **Ulubione** | ✅ realne | `/favorites` |
| **Moje ogłoszenia** | ✅ realne | `/listings/mine` + usuwanie + filtr statusu |
| **Profil** | ✅ realne | user + `/listings/mine` + `/orders/mine` + `/orders/wallet` |
| **Ustawienia → Dane** | ✅ realne | `PATCH /users/me` (displayName, bio, firmowe) |
| **Wiadomości** | ✅ realne | rozmowy + wątek + wysyłka tekst/zdjęcie + **realtime** + karty oferty/rezerwacji (akcept/odrzuć) |
| **Portfel** | ✅ realne | `/orders/wallet` + operacje z `/orders/mine` |
| **Panel admina** (dashboard) | ✅ realne | `/admin/stats` |
| **Admin → Użytkownicy** | ✅ realne | lista + ban/weryfikacja |
| **Admin → Ogłoszenia** | ✅ realne | lista + weryfikacja/archiwizacja/usuwanie |

### Web — jeszcze na mocku / pending (UI istnieje, brak podpięcia)
- **Ustawienia** → Powiadomienia / Prywatność / Preferencje / Bezpieczeństwo / Adresy / Płatności (toggle lokalne; `settings` w backendzie gotowe — do podpięcia jak na mobilce)
- **Powiadomienia** (dzwonek/lista) — brak strony na webie (API gotowe)
- **Recenzje** — oceny widać na produkcie/profilu; brak osobnego UI wystawiania i listy na webie (API gotowe)
- **Płatność / Checkout / pojedyncze Zamówienie** — Etap 2
- **Admin** → Transakcje / Zwroty / Wiadomości systemowe / Ustawienia platformy — mock
- **Kup w zespole** — strona poglądowa (mechanika = Etap 2, [KUP-W-GRUPIE.md](KUP-W-GRUPIE.md))

---

## 4. Mobile (`apps/mobile`) — status

W pełni funkcjonalna (Expo). Podłączone: auth (prywatne/firmowe), listingi, sprzedaż z uploadem,
kategorie, ulubione, wiadomości + realtime, oferty, **rezerwacje** (UI inicjowania + akceptacji),
powiadomienia (dzwonek + badge + nawigacja), profil, ustawienia (Dane + Powiadomienia/Prywatność/
Preferencje zapisywane), Transakcje, Portfel, panel admina.
Pending: pełny UI wystawiania recenzji, reset hasła (ekran „ustaw nowe hasło"), płatności (Etap 2).

---

## 5. Co działa end-to-end (zweryfikowane na żywo)

- Logowanie/rejestracja (web i mobile) → token → `GET /users/me`; CORS dla `:3000` OK.
- Dodanie ogłoszenia (`POST /listings` 201) → widoczne w Szukaj/Home na obu platformach.
- Wiadomości w obie strony + realtime + wysyłka zdjęcia (signed URL).
- Oferta cenowa i rezerwacja w czacie (PENDING→ACCEPTED, ogłoszenie→RESERVED, auto-wygasanie).
- Oceny: `POST /reviews` 201, anty-duplikat 400, statystyki `positivePercentage`, przeliczony `ratingAvg`.
- Admin (rola ADMIN): `/admin/stats` realne liczby, moderacja użytkowników i ogłoszeń.

**Konta testowe:** `mateusz@modamarket.pl / Mateusz1234` (ADMIN) · `anna@modamarket.pl / Anna1234`.

---

## 6. Co zostało (Etap 2 — Transakcje)

Płatności (operator: Przelewy24/Stripe) → tworzenie realnych zamówień → escrow → wysyłki →
zwroty/reklamacje (model `Dispute` gotowy) → pełna mechanika „Kup w grupie" → realna wysyłka e-maili
(domyka reset hasła) → logowanie Google/Apple. Pkt płatności jest blokerem dla reszty.

---

## 7. Uruchomienie

```bash
# 1) Backend (raz — wspólny dla web i mobile)
cd apps/api && npm run start:dev        # http://localhost:4000/api/v1  (docs: /api/docs)

# 2) Web
cd apps/web && npm run dev              # http://localhost:3000   (.env.local: NEXT_PUBLIC_API_URL)

# 3) Mobile
cd apps/mobile && npx expo start        # Expo Go / 'w'  (IP w LAN auto z Metro)
```

Po zmianie schematu Prisma: `npx prisma db push --schema prisma/schema.prisma --skip-generate`
+ `npx prisma generate`, następnie **restart backendu** (nowe moduły/typy nie doczytują się w watchu).
