# Architektura — ModaMarket

Premium marketplace modowy, **mobile-first** (apka natywna to priorytet, web jest towarzyszący).
Model hybrydowy: **C2C** (osoby prywatne, „Kup teraz") + **B2C** (butiki/firmy ze stanem
magazynowym, „Kup teraz" + „Kup w grupie" ze zniżką).

## Monorepo

```
marketplace-app/
├─ apps/
│  ├─ api/        NestJS 10 + Prisma 6 + PostgreSQL (Supabase) — REST /api/v1
│  ├─ web/        Vite + React + Tailwind — prototyp/companion (źródło designu)
│  └─ mobile/     Expo / React Native — apka natywna (priorytet)
├─ packages/
│  └─ shared/     @modamarket/shared — tokeny designu, typy, formatery, mock
├─ prisma/        schema.prisma (14 tabel, źródło prawdy modelu danych)
└─ docs/          ta dokumentacja
```

- **Workspaces** (npm): `packages/*`, `apps/web`, `apps/api`.
- **`apps/mobile` jest standalone** (poza workspaces) — Expo/Metro nie lubi hoistowania
  `node_modules`, więc ma własny `npm install`. Współdzielony rdzeń wciąga przez
  `"@modamarket/shared": "file:../../packages/shared"`.

## Backend (`apps/api`)

NestJS 10, modularny — architektura warstwowa (kontroler → serwis → Prisma) z naciskiem
na bezpieczeństwo i walidację.

| Warstwa | Element |
|---|---|
| Bezpieczeństwo | helmet, compression, CORS (`FRONTEND_URL`), globalny `ValidationPipe` (whitelist + forbidNonWhitelisted + transform) |
| Rate limiting | `@nestjs/throttler` globalnie (100/min) + per-endpoint (`@Throttle`) |
| Auth | JWT access (15 min) + refresh (7 dni) z **rotacją** i hashem refreshu (SHA-256) w bazie |
| Walidacja env | `zod` (`config/env.validation.ts`) — fail-fast przy złej konfiguracji |
| DB | Prisma 6, Supabase Postgres (pooler: 6543 runtime, 5432 migracje przez `DIRECT_URL`) |
| Docs | Swagger pod `/api/docs` |

Prefiks globalny: **`/api/v1`**. Port: **4000**.

### Model tokenów (mobile-first)

Tokeny wracają w **ciele odpowiedzi** (`{ user, accessToken, refreshToken }`), nie tylko w cookie —
bo telefon nie ma cookie jar. Mobile trzyma je w bezpiecznym magazynie urządzenia
(iOS Keychain / Android Keystore) przez `expo-secure-store`. Szczegóły: [API-auth.md](API-auth.md).

## Mobile (`apps/mobile`)

Expo SDK 52, React Native 0.76, `@react-navigation` (bottom-tabs + native-stack).

```
src/
├─ config.ts              EXPO_PUBLIC_API_URL (adres backendu z prefiksem /api/v1)
├─ lib/tokens.ts          secure-store + mirror w pamięci (Bearer synchronicznie)
├─ api/client.ts          axios + interceptor Bearer + single-flight refresh na 401
├─ api/auth.ts            login / register / fetchMe / logout + typ User
├─ context/AuthContext.tsx  hydracja sesji przy starcie, signIn/signUp/signOut
├─ screens/auth/AuthScreen.tsx  logowanie + rejestracja (1:1 z designem web)
├─ screens/...            Home, Detail, Profil (reszta = stuby do portu)
└─ theme.ts               tokeny z @modamarket/shared
```

### Przepływ sesji

```
App
└─ AuthProvider                 (boot: loadTokens → jeśli access → GET /users/me)
   └─ RootGate
      ├─ loading  → Splash
      ├─ !user    → AuthScreen          (login / register)
      └─ user     → NavigationContainer → Tabs (Home/Szukaj/Dodaj/Ulubione/Profil)
```

Po udanym `signIn`/`signUp` `AuthProvider` ustawia `user` → `RootGate` przełącza na aplikację.
`signOut` w zakładce Profil unieważnia refresh na serwerze i czyści magazyn → powrót do `AuthScreen`.

### Odświeżanie tokenów

`api/client.ts` przechwytuje **401**, robi `POST /auth/refresh` (refresh w ciele), zapisuje nową
parę i ponawia oryginalne żądanie. Równoległe 401-ki czekają na jeden trwający refresh
(single-flight). Nieudany refresh → czyszczenie tokenów → bramka odsyła do logowania.

## Status etapów

- **Etap 1 (w toku):** auth + users (gotowe, zweryfikowane end-to-end). Dalej: ogłoszenia CRUD,
  szukaj/filtry, wiadomości, podstawowy admin, profil/ustawienia, „negocjuj cenę".
- **Etap 2:** Kup teraz/w grupie, escrow (logika symulowana), zwroty/spory, Google/Apple login,
  operator wysyłki (logika), faktury, rozbudowany admin + uprawnienia.
- **Etap 3 (osobno):** realne integracje płatności, publikacja w sklepach, testy.

Płatności w MVP są **symulowane** (pełna logika, fikcyjne pieniądze).
