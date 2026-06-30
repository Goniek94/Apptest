# Setup i uruchomienie — ModaMarket

## Wymagania

- Node.js 18+ (testowane na 22)
- Telefon z **Expo Go** (App Store / Google Play) do testów mobilnych
- Telefon i komputer w **tej samej sieci Wi-Fi**

## 1. Backend (`apps/api`)

```bash
cd apps/api
npm install            # raz
npm run start:dev      # tryb watch, http://localhost:4000
```

- Konfiguracja: plik `.env` w **korzeniu** monorepo (współdzielony z web). Wymaga m.in.
  `DATABASE_URL`, `DIRECT_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORT=4000`.
  Walidacja `zod` zatrzyma start, jeśli czegoś brak.
- API: `http://localhost:4000/api/v1`
- Swagger (klikalne testy endpointów): `http://localhost:4000/api/docs`

### Schemat bazy

```bash
cd apps/api          # albo z korzenia, gdzie jest prisma/
npx prisma db push   # synchronizacja schematu z Supabase (używa DIRECT_URL)
npx prisma studio    # podgląd danych w przeglądarce
```

## 2. Mobile (`apps/mobile`)

```bash
cd apps/mobile
npm install                  # raz (standalone, poza workspaces)
npx expo start               # QR do Expo Go
```

### Konfiguracja adresu API (kluczowe!)

Telefon **nie widzi** `localhost` komputera. W `apps/mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://<IP-LAN-KOMPUTERA>:4000/api/v1
```

- Aktualne IP LAN tego komputera: **192.168.0.48** → już wpisane w `.env`.
- Jeśli IP się zmieni (inna sieć/DHCP), sprawdź `ipconfig` (pole „IPv4") i zaktualizuj `.env`,
  potem zrestartuj `expo start` (zmienne `EXPO_PUBLIC_*` wczytywane są przy starcie).
- Zawsze z prefiksem **`/api/v1`**.

### Zapora Windows (jednorazowo, wymaga administratora)

Żeby telefon dobił się do portu 4000, dodaj regułę inbound — **PowerShell jako administrator**:

```powershell
New-NetFirewallRule -DisplayName "ModaMarket API 4000" -Direction Inbound `
  -Action Allow -Protocol TCP -LocalPort 4000 -Profile Private
```

(Alternatywnie: przy pierwszym połączeniu Windows sam zapyta „Zezwól Node.js" — zaznacz sieci
prywatne i potwierdź.)

## 3. Test logowania z telefonu — krok po kroku

1. Uruchom backend: `cd apps/api && npm run start:dev`.
2. Upewnij się, że `apps/mobile/.env` ma poprawne IP LAN (patrz wyżej).
3. Uruchom apkę: `cd apps/mobile && npx expo start`.
4. Zeskanuj QR w **Expo Go** (ten sam Wi-Fi co komputer).
5. Otworzy się **AuthScreen**:
   - **Załóż konto** → wybierz „Osoba prywatna" lub „Firma", podaj nazwę, e-mail, hasło
     (min. 8 znaków), zaakceptuj regulamin → *Załóż konto*.
   - albo **Zaloguj się** istniejącym kontem.
6. Po sukcesie wejdziesz do aplikacji (zakładki). Zakładka **Profil** pokazuje Twoje dane
   i przycisk **Wyloguj się**.
7. Tokeny zapisują się w bezpiecznym magazynie — po zamknięciu i ponownym otwarciu apki
   sesja powinna się odtworzyć automatycznie (splash → od razu zakładki).

### Szybki test API bez telefonu

Swagger: `http://localhost:4000/api/docs` — `POST /auth/register`, potem `Authorize`
wklejając `accessToken`, i `GET /users/me`.

## Najczęstsze problemy

| Objaw | Przyczyna / rozwiązanie |
|---|---|
| `Network Error` w apce | Złe IP w `.env` (localhost?) albo firewall blokuje 4000 → patrz wyżej |
| Działa na komputerze, nie na telefonie | Inny Wi-Fi, albo brak reguły zapory dla portu 4000 |
| `EXPO_PUBLIC_API_URL is not set` w konsoli | Brak `.env` w `apps/mobile` (skopiuj z `.env.example`) |
| Po zmianie `.env` brak efektu | Zmienne czytane przy starcie — zrestartuj `expo start` |
| Backend nie startuje (zod) | Brak/zła zmienna w korzeniowym `.env` |
| `EADDRINUSE :4000` | Inna instancja API już działa — ubij ją lub użyj jej |
