# ModaMarket — stan projektu (Etap 1)

> Aktualizacja: 2026-06-21. Dokument opisuje **co zostało zbudowane i co działa** oraz **co jest zaślepione / zaplanowane**.
> Stos: monorepo (npm workspaces) — `apps/api` (NestJS 10 + Prisma 6 + PostgreSQL/Supabase), `apps/mobile` (Expo / React Native), `apps/web` (podgląd), `packages/shared`.

---

## 1. Backend (`apps/api`) — co działa

### Rdzeń
- NestJS 10 + Prisma 6 + PostgreSQL (Supabase, pooler runtime / direct migrations).
- Bezpieczeństwo: `helmet`, CORS, kompresja, globalny **rate-limiting** (`@nestjs/throttler`, nadpisywany per-endpoint), walidacja DTO (`class-validator`), walidacja zmiennych środowiskowych.
- Swagger: `/api/docs`. Prefiks API: `/api/v1`, port `4000`.
- **Storage** (Supabase): 4 buckety wg prywatności — `listings`/`avatars` (publiczne), `messages`/`disputes` (prywatne, signed-URL). Normalizacja obrazów do `webp` (sharp), zdejmowanie EXIF, uporządkowane ścieżki.

### Autoryzacja
- Rejestracja (konto **prywatne** lub **firmowe** z NIP), logowanie.
- JWT: **access (15 min)** + **refresh (7 dni)** z rotacją (hash SHA-256, unieważnianie sesji).
- `RolesGuard` + `@Roles` (rola w tokenie i `request.user`).
- **Reset hasła + weryfikacja e-mail — scaffold**: tokeny jednorazowe (tabela `AuthToken`, trzymany tylko hash), endpointy `forgot-password` / `reset-password` / `verify-email` / `resend-verification`, anti-enumeration. Mail **zaślepiony** (loguje link) — gotowy pod podpięcie dostawcy.
- Blokada konta (`bannedAt`) odrzuca logowanie.

### Ogłoszenia i katalog
- CRUD ogłoszeń (właściciel-only): tytuł, opis, cena (grosze), marka, **rozmiar**, **materiał**, kolor (do 2), wymiary (szer./dł. cm), stan, **negocjowalność**, kategoria.
- Zdjęcia: dodaj / usuń / **ustaw główne** (okładka), reguła **min. 1 zdjęcie**, maks. 10.
- Listowanie publiczne: **wyszukiwanie + filtry** (kategoria z podkategoriami, rozmiar, kolor, stan, cena) + **sortowanie** + paginacja.
- „Moje ogłoszenia": lista właściciela + niezakończone zamówienia doklejane (pod filtr „W toku").
- **Kategorie**: taksonomia 7 głównych + **~85 podkategorii** (styl Vinted), ustalona kolejność, auto-sync przy starcie + czyszczenie osieroconych.
- Ulubione: dodaj / usuń / lista.

### Negocjacja ceny (oferty) — spięta z czatem
- Kupujący składa ofertę < ceny → tworzy się rozmowa + **karta oferty w czacie** + powiadomienie dla sprzedającego.
- Akcje: **Akceptuj / Odrzuć / Wycofaj / Kontroferta** (można też kontrofertować po odrzuceniu).
- Statusy: PENDING / ACCEPTED / REJECTED / COUNTERED / CANCELLED / EXPIRED.

### Wiadomości
- Konwersacje (kupujący↔sprzedający wokół ogłoszenia), wątek wiadomości, „rozpocznij rozmowę z ogłoszenia".
- Typy wiadomości: **tekst**, **zdjęcie** (bucket prywatny, signed-URL 24h), **oferta** (karta), **systemowa**.
- Oznaczanie przeczytanych, licznik nieprzeczytanych (badge), usuwanie rozmowy.

### Real-time (WebSocket, socket.io)
- Gateway z autoryzacją JWT (token w handshake), prywatne pokoje `user:<id>`.
- Zdarzenia: `message:new`, `conversation:update`, `offer:update`, `notification:new` — wiadomości i oferty wpadają natychmiast, bez odświeżania.

### Panel administratora (tylko rola ADMIN)
- Statystyki (użytkownicy, ogłoszenia, do weryfikacji, oferty, zablokowani).
- Użytkownicy: szukaj, **zweryfikuj**, **zablokuj/odblokuj**, zmiana roli.
- Ogłoszenia: szukaj, **zweryfikuj**, **archiwizuj/przywróć**, **usuń**.

---

## 2. Aplikacja mobilna (`apps/mobile`) — co działa

- **Nawigacja**: dolne taby (Główna / Sklep / Sprzedaj / Czat / Profil) z **badge nieprzeczytanych** na Czacie; dolna nawigacja dostępna też na pod-ekranach (np. „Moje ogłoszenia").
- **Home / Sklep**: lista + **filtry zaawansowane** (kategoria/rozmiar/kolor/stan/cena, sortowanie, widok siatka/lista).
- **Szczegóły produktu (1:1 z makiety)**: galeria + podgląd pełnoekranowy, detale (w tym materiał, wymiary), sprzedawca, „**Napisz**" (tworzy rozmowę), „**Złóż ofertę cenową**" (tylko gdy ogłoszenie negocjowalne), „Kup teraz", „Kup w grupie".
- **Sprzedaj / Edycja ogłoszenia**:
  - zdjęcia (dodawanie/usuwanie, ustawianie okładki ⭐),
  - **walidacja inline** (czerwone ramki + komunikaty pod polami + banner; znika przy poprawie),
  - **wybór kategorii i atrybutów pełnoekranowo (jak Vinted)** — Kategoria z drill-down (główne → podkategorie) + szukajka; Marka/Stan/Rozmiar/Materiał/Kolory jako pełnoekranowe panele z wyszukiwarką,
  - **rozmiary zależne od kategorii** (buty = numery, dzieci = cm, akcesoria = „Uniwersalny", reszta = litery),
  - przełącznik „Cena do negocjacji",
  - podgląd przed publikacją → publikacja; edycja → „Zapisz zmiany" z modalem sukcesu.
- **Moje ogłoszenia**: lista ze statusem, filtr statusu jako **dropdown** (Wszystkie / **W toku** / Aktywne / Zarezerwowane / Sprzedane / Archiwalne), edycja, **usuwanie z potwierdzeniem**, sticky „Dodaj ogłoszenie".
- **Wiadomości**: zakładki **Odebrane / Inne** + wyszukiwarka; w wierszu ikony **✓ przeczytane** i **🗑 usuń**.
- **Rozmowa**: dymki z **godziną** i **statusem ✓/✓✓**, **karty ofert** (Akceptuj/Odrzuć/Wycofaj, po odrzuceniu „Zaproponuj swoją cenę"), **wysyłka zdjęć** (tap = pełny ekran), real-time.
- **Profil (1:1)**: karta powitalna, statystyki, „Szybki dostęp" (Moje ogłoszenia, Ulubione, Wiadomości, Ustawienia, Pomoc, **Panel administracyjny tylko dla ADMIN**), wylogowanie.
- **Ustawienia konta**: hub + **Dane osobowe** (realny zapis `PATCH /users/me`) + Powiadomienia/Prywatność/Preferencje (UI), „Wróć" na dole.
- **Strony treściowe**: O nas, Pomoc, Kontakt.
- **Logowanie/Rejestracja**: konta prywatne/firmowe, „Nie pamiętasz hasła?" (wywołuje scaffold resetu).
- **Panel administratora** (mobile): statystyki + moderacja użytkowników i ogłoszeń (gated rolą ADMIN).

---

## 3. Co przetestowane na żywo
- Logowanie obu kont testowych; „Napisz z ogłoszenia" → utworzenie rozmowy (HTTP 201).
- Wymiana wiadomości w obie strony (kupujący ↔ sprzedający), licznik nieprzeczytanych.
- Wysyłka zdjęcia w czacie → zapis w prywatnym buckecie + działający signed-URL.
- Panel admina: `admin/stats` zwraca realne liczby; rola ADMIN egzekwowana.
- Kategorie zsynchronizowane (7 głównych / ~85 podkategorii).

**Konta testowe:** `mateusz@modamarket.pl` / `Mateusz1234` (ADMIN) · `anna@modamarket.pl` / `Anna1234`.

---

## 4. Zaślepione / zaplanowane (świadomie poza Etapem 1)
- **Płatności i zamówienia** — brak realnego obiegu (checkout to UI; „Kup teraz" nie tworzy zamówienia). Konsekwencje: filtr „W toku" pozostaje pusty do czasu wdrożenia, akceptacja oferty kończy się na statusie. → Etap 2 (płatności/wysyłki/zwroty).
- **Odczyt powiadomień** — `Notification` są zapisywane i emitowane (`notification:new`), ale brak endpointu do ich listowania → zakładka „Inne" jest placeholderem.
- **Recenzje/oceny** — brak modułu; `ratingAvg/ratingCount` = 0.
- **Wysyłka e-maili** — `MailService.deliver()` to no-op (link widać w logach backendu); do podpięcia dostawcy.
- **Ekran „ustaw nowe hasło"** z linku (krok 2 resetu) — backend gotowy, brak ekranu mobilnego.
- **„Kup w grupie"** — UI bez logiki; docelowo **tylko dla firm**, wymaga pola ilości (`quantity > 1`) na ogłoszeniu (notatka kierunkowa).
- **Rezerwacja przedmiotu** (request → akceptacja sprzedawcy, okres do 5 dni) — pomysł zaakceptowany, do zbudowania.
- **Web** — dopracowanie na końcu; teraz fokus na mobilce. Uwaga: na webie `Alert.alert` jest niewidoczny — kluczowe potwierdzenia/walidacje przeniesione na własne modale/inline; pozostałe Alerty do przejścia przy fazie web.

---

## 5. Uruchomienie (skrót)
```
# Backend
cd apps/api && npm run start:dev      # http://localhost:4000/api/v1, docs: /api/docs

# Mobile (Expo)
cd apps/mobile && npx expo start       # 'w' = web preview, lub Expo Go
```
Po dodaniu nowych zależności backendu / zmianie schematu: zrestartuj backend (watch nie doczyta nowych paczek). Szczegóły: [SETUP.md](SETUP.md), [ARCHITEKTURA.md](ARCHITEKTURA.md), [MOBILE.md](MOBILE.md), [STORAGE.md](STORAGE.md), [API-auth.md](API-auth.md).
