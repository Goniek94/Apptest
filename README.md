# ModaMarket — marketplace mody (web + mobile)

Platforma sprzedażowa premium dla branży modowej. **Web i mobile dzielą wspólny rdzeń**
(`packages/shared`: tokeny designu, typy, logika), dzięki czemu nie dublujemy pracy.

Workflow: **najpierw budujemy część wizualną na web (wg makiet), potem portujemy i dopracowujemy na mobile.**

## Architektura (monorepo, npm workspaces)

```
marketplace-app/
├─ packages/
│  └─ shared/        # @modamarket/shared — tokeny, typy, format, dane demo (wspólne web↔mobile)
├─ apps/
│  ├─ web/           # Next.js (App Router) + TypeScript + Tailwind  (źródło prawdy wizualnej, SSR/SEO)
│  ├─ mobile/        # Expo (React Native) + react-navigation  (port z web)
│  └─ api/           # NestJS + Prisma  (Etap 1 — jeszcze nie utworzone)
└─ prisma/
   └─ schema.prisma  # schemat bazy MVP (przejdzie do apps/api)
```

> Uwaga: `apps/mobile` jest **poza** npm workspaces (Expo/Metro nie współpracuje z hoistingiem).
> Korzysta z `@modamarket/shared` przez `file:` + własny `metro.config.js` (watchFolders na monorepo).

## Stack

- **Web:** Next.js 15 (App Router), React 18, TypeScript, Tailwind (config mapuje tokeny z `@modamarket/shared`)
- **Mobile:** Expo SDK 52, React Native, @react-navigation (bottom-tabs + native-stack)
- **Wspólny rdzeń:** TypeScript (`packages/shared`)
- **Backend (Etap 1+):** NestJS + Prisma + PostgreSQL · płatności przez operatora (Tpay/P24) · storage S3/Supabase

## Uruchomienie

```bash
# 1. Zależności web + shared (z roota, workspaces)
npm install

# 2. Web (źródło prawdy wizualnej)
npm run dev:web              # http://localhost:3000

# 3. Mobile (osobny install — poza workspaces)
cd apps/mobile
npm install
npx expo start              # 'w' = web, 'a' = Android, 'i' = iOS
```

## Ekrany MVP (wg makiet)

Home · Rejestracja/Logowanie · Profil · Dodaj ogłoszenie · Zdjęcia produktu ·
Wyszukiwarka + filtry · Ulubione · Wiadomości · Proces zamówienia · Płatności ·
Szczegóły produktu · Kup w zespole (wyróżnik).

Web: wszystkie ekrany zbudowane (komponenty w `apps/web/src/routes/`, trasy w `apps/web/src/app/`).
Mobile: Home + Szczegóły sportowane; reszta = zaślepki do portu.

## Etapy realizacji

- **Etap 0 — Fundament (✔):** monorepo, design system, routing, szkielet wszystkich ekranów web, scaffold mobile
- **Etap 1 — Rdzeń:** backend (NestJS+Prisma), konta/logowanie, ogłoszenia, wyszukiwarka, czat; port ekranów na mobile
- **Etap 2 — Transakcje:** płatności (operator), wysyłki, zamówienia, panel admin, „Kup w zespole", reklamacje
- **Etap 3 — Testy, wdrożenie, publikacja** (App Store / Google Play)
