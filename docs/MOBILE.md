# Aplikacja mobilna (Expo) — struktura i konwencje

Apka jest **mobile-first** i odwzorowuje **mobilny widok z weba** (Next.js, sekcje `md:hidden`)
jako docelowy wygląd. Stack: Expo SDK 54, React Native 0.81, React 19, `@react-navigation`
(stack + bottom-tabs), `react-native-svg` (ikony), `expo-linear-gradient` (gradienty),
`expo-secure-store` (tokeny), `axios` (API).

## Architektura: feature-first

Kod jest pogrupowany **wg domeny**, nie wg typu pliku. Każda domena trzyma swoje ekrany
(i własne komponenty/logikę) razem — skaluje się czysto przy kilkunastu ekranach.

```
apps/mobile/
├─ App.tsx                  korzeń: SafeAreaProvider → AuthProvider → RootNavigator
├─ assets/hero/             grafiki hero (te same co web)
└─ src/
   ├─ app/
   │  └─ navigation/
   │     ├─ RootNavigator.tsx   stack: Tabs + Produkt + Ulubione + KupWGrupie + Auth(modal) + splash sesji
   │     ├─ Tabs.tsx            dolny ciemny tab-bar + górny pasek (logo/serce/dzwonek)
   │     └─ types.ts            RootStackParamList / TabParamList (typowane trasy)
   ├─ features/                 DOMENY
   │  ├─ home/screens/          HomeScreen (search, hero, kategorie, Polecane, Aktualności, baner)
   │  ├─ catalog/screens/       SearchScreen (Sklep), ProductScreen (Produkt)
   │  ├─ auth/
   │  │  ├─ api/auth.ts         endpointy: login/register/fetchMe/logout
   │  │  ├─ context/AuthContext.tsx   sesja (hydracja, signIn/signUp/signOut)
   │  │  └─ screens/AuthScreen.tsx    logowanie + rejestracja (modal)
   │  ├─ selling/screens/       SellScreen (Dodaj ogłoszenie)
   │  ├─ messages/screens/      MessagesScreen
   │  ├─ orders/screens/        (zamówienie + płatność — w toku)
   │  ├─ group-buy/screens/     GroupBuyScreen (Kup w grupie)
   │  ├─ favorites/screens/     FavoritesScreen (Ulubione)
   │  └─ profile/screens/       ProfileScreen (profil + menu konta)
   └─ shared/                   WSPÓŁDZIELONE w całej apce
      ├─ ui/                    design-system: Icon (SVG), Button, Badge, Pill, Avatar, Field, SectionHead, Card
      ├─ components/            ProductCard, ProductGrid, Placeholder
      ├─ api/client.ts          axios + Bearer + single-flight refresh na 401
      ├─ lib/tokens.ts          access/refresh w secure-store + mirror w pamięci
      ├─ theme.ts               tokeny kolorów (z @modamarket/shared) + serif
      └─ config.ts              EXPO_PUBLIC_API_URL (z prefiksem /api/v1)
```

## Alias importów: `@/`

Zamiast kruchych `../../../` używamy aliasu **`@/` → `src/`** (skonfigurowany w
`babel.config.js` przez `module-resolver` i w `tsconfig.json` w `paths`).

```ts
import { Icon } from '@/shared/ui/Icon';
import { useAuth } from '@/features/auth/context/AuthContext';
```

> Po zmianie `babel.config.js` Metro wymaga czyszczenia cache: `npx expo start -c`.

## Design-system (`shared/ui`)

Lustro komponentów i tokenów z weba (Tailwind → StyleSheet):

- **Icon** — `react-native-svg` z **tym samym zestawem ścieżek** co web (`components/ui/Icon`),
  więc ikony są identyczne. Użycie: `<Icon name="heart" size={18} color={C.gold} />`.
- **Button** (`gold`/`dark`/`ghost`/`outline`), **Badge**, **Pill**, **Avatar**, **Field**,
  **SectionHead**, **Card** — odpowiedniki klas `btn-gold`, `card-surface`, `rounded-pill` itd.
- Kolory/serif z `shared/theme` (źródło: `@modamarket/shared` — wspólne z webem).

## Nawigacja

- **Dolny tab-bar** (ciemny, jak `AppShell.MobileTabBar`): Strona główna · Sklep · Sprzedaj ·
  Wiadomości · Profil. Aktywne = złote, nieaktywne = przygaszone.
- **Górny pasek**: logo (wieszak + „ModaMarket") + serce (Ulubione) + dzwonek (Wiadomości).
- **Stack** nad tabami: `Produkt`, `Ulubione`, `KupWGrupie`, `Auth` (modal).
- **Gość-first**: wejście pokazuje Home; logowanie to modal otwierany przy akcjach „tylko dla
  zalogowanych" (kup, profil gościa itp.). Sesja przeżywa restart (secure-store).

## Dane

Na czas portu UI ekrany korzystają z mocków z `@modamarket/shared` (`LISTINGS`, `USERS`, `IMG`,
`grosze`, `conditionLabel`). Docelowo podmieniane na dane z API (warstwa `shared/api` + per-feature `api/`).

## Status portu (widoki mobilne z weba)

| Ekran | Stan |
|---|---|
| Home | ✅ wierny |
| Sklep / Szukaj | ✅ (search + chipsy + siatka; filtry zaawansowane w toku) |
| Produkt | ✅ (galeria 1 zdj., atrybuty, trust, sprzedawca, akcje; wielozdjęciowa galeria w toku) |
| Ulubione | ✅ siatka |
| Profil | ✅ (gość + zalogowany + menu) |
| Auth | ✅ logowanie/rejestracja |
| Sprzedaj + Zdjęcia | ⏳ zaślepka |
| Wiadomości (lista + czat) | ⏳ zaślepka |
| Zamówienie + Płatność | ⏳ |
| Kup w grupie | ⏳ zaślepka |
| Ustawienia (sekcje) | ⏳ |
