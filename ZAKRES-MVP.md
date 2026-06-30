# ZAKRES I HARMONOGRAM MVP — Platforma marketplace (moda)

Dokument roboczy / załącznik do umowy głównej. Stan: zakres MVP uzgodniony.

---

## 0. Informacje ogólne

**Model platformy:** hybryda
- **C2C** — osoby prywatne sprzedające pojedyncze rzeczy (unikaty, 1 szt.), tylko „Kup teraz".
- **B2C** — firmy / butiki z asortymentem (stock, N szt.), „Kup teraz" **oraz** „Kup w grupie".

**Priorytet:** aplikacja mobilna (mobile-first). Web jako wersja towarzysząca na tym samym API.

**Budżet:** 40 000 zł netto = 8 000 (Etap 0, wliczone jako poczet) + 32 000 (realizacja MVP).
**Poza MVP (Etap 3, osobna wycena):** realne integracje płatności, publikacja w sklepach, testy/QA.

**Stack techniczny:**
- Backend: **NestJS + Prisma + PostgreSQL**, REST + WebSocket, JWT, Swagger.
- Mobile: **Expo / React Native** (expo-router, axios, secure-store).
- Web: **Next.js** (istniejący prototyp, ten sam backend).
- Media: upload + przetwarzanie zdjęć. Bezpieczeństwo: helmet, throttling, walidacja.

**Płatności w MVP:** logika i pełne przepływy na **płatnościach symulowanych** (escrow, zamówienia, kup w grupie, zwroty działają end-to-end na „udawanych" środkach). Realny operator = Etap 3.

---

## MODUŁY — FUNKCJE I PODFUNKCJE

### Moduł 0 — Fundament *(Etap 0, wliczone)*
- 0.1 Repozytorium GitHub + struktura monorepo (api / mobile / web / shared).
- 0.2 Wstępna architektura systemu.
- 0.3 Projekt bazy danych (Prisma).
- 0.4 Layout / makieta aplikacji (gotowe).
- 0.5 Dokument zakresu MVP (niniejszy).

### Moduł 1 — Uwierzytelnianie i konta
- 1.1 Rejestracja
  - e-mail + hasło
  - wybór typu konta: **prywatne / firma (butik)**
  - akceptacja regulaminu i polityki prywatności
  - weryfikacja e-mail (token; w MVP może być symulowana)
- 1.2 Logowanie
  - e-mail + hasło (JWT: access + refresh)
  - **logowanie Google**
  - **logowanie Apple**
  - „zapamiętaj mnie", wylogowanie
- 1.3 Odzyskiwanie hasła (reset przez e-mail)
- 1.4 Profil użytkownika
  - dane podstawowe (nazwa, avatar, bio, lokalizacja)
  - **dane firmowe** (nazwa, NIP, REGON, adres) — dla kont BUSINESS
  - edycja profilu, zmiana hasła
- 1.5 Role i uprawnienia (user / admin) + guardy autoryzacji
- 1.6 Konta firmowe (BUSINESS): oznaczenie „butik", podstawowa weryfikacja danych

### Moduł 2 — Ogłoszenia i katalog
- 2.1 Dodawanie ogłoszenia
  - tytuł, opis, cena, kategoria, marka, rozmiar, kolor, stan, materiał
  - **ILOŚĆ:** prywatny = 1 (unikat) / firma = N (stock)
  - zdjęcia (wiele, okładka, kolejność)
  - wymiary (opcjonalnie), rozmiar przesyłki
  - dla firm: **konfiguracja „Kup w grupie"** (próg, cena grupowa, czas)
  - zapis szkicu / publikacja
- 2.2 Edycja ogłoszenia
- 2.3 Usuwanie / ukrywanie / archiwizacja
- 2.4 „Moje ogłoszenia" — statusy (aktywne / w trakcie / zakończone / ukryte)
- 2.5 Szczegóły ogłoszenia (galeria, dane, sprzedawca, CTA kup/wiadomość)
- 2.6 Kategorie i podkategorie
- 2.7 Ulubione (dodaj / usuń / lista)
- 2.8 Zarządzanie zdjęciami (dodawanie, usuwanie, okładka, kolejność)

### Moduł 3 — Wyszukiwarka i filtry
- 3.1 Wyszukiwarka tekstowa (marka, produkt, tytuł)
- 3.2 Filtry: kategoria (+ podkategorie), rozmiar, kolor, stan, cena (zakres), typ sprzedawcy
- 3.3 Sortowanie (trafność, cena rosnąco / malejąco, najnowsze)
- 3.4 Paginacja / nieskończone przewijanie
- 3.5 Widok siatka / lista
- 3.6 Licznik wyników

### Moduł 4 — Wiadomości
- 4.1 Lista rozmów (zakładki: odebrane / wysłane / systemowe)
- 4.2 Czat **real-time** (WebSocket) — wysyłanie / odbieranie
- 4.3 Karta produktu w rozmowie
- 4.4 Statusy wiadomości (wysłane / odczytane), licznik nieprzeczytanych
- 4.5 Załączniki (zdjęcia) — opcjonalnie
- 4.6 Usuwanie rozmów
- 4.7 Powiadomienia / wiadomości systemowe

### Moduł 5 — Zakupy i transakcje *(płatności symulowane)*
- 5.1 „Kup teraz"
  - rezerwacja przedmiotu (blokada podwójnej sprzedaży)
  - wybór dostawy + adresu
  - utworzenie zamówienia + przepływ statusów (PENDING → PAID → SHIPPED → DELIVERED → COMPLETED)
  - **escrow-logika** (blokada → zwolnienie po dostawie) — symulacja
  - prowizja platformy
- 5.2 „Kup w grupie" *(tylko firmy / oferty ze stockiem)*
  - dołączenie do grupy + blokada środków uczestnika (symulacja)
  - **próg** (liczba osób) + **czas** (deadline)
  - **cena grupowa / zniżka**
  - zebranie progu → realizacja; brak → **masowy zwrot**
  - „dołącz do istniejącej" / „stwórz własną grupę"
- 5.3 Checkout (podsumowanie, metoda — symulowana, adres)
- 5.4 Portfel (saldo, historia, wniosek o wypłatę — symulacja)
- 5.5 Powiadomienia o statusach zamówień

### Moduł 6 — Zwroty, spory, anulowanie
- 6.1 Anulowanie zamówienia (zasady wg etapu zamówienia + auto-anulowanie przy braku wysyłki)
- 6.2 Zwroty — **dwie ścieżki**:
  - C2C (sprzedawca prywatny) → wg regulaminu / escrow
  - B2C (firma) → prawo konsumenta (14 dni odstąpienia + rękojmia)
- 6.3 Reklamacje (uszkodzony / niezgodny z opisem)
- 6.4 Spory: otwarcie, dowody, rozstrzygnięcie w panelu admina, refund / wypłata
- 6.5 Reguły automatyczne (brak potwierdzenia odbioru → auto-akceptacja po terminie)

### Moduł 7 — Konta firmowe i faktury
- 7.1 Rozszerzone dane firmy (NIP, REGON, adres)
- 7.2 **Generowanie faktur (PDF)** za transakcje / prowizje
- 7.3 Numeracja, dane nabywcy / sprzedawcy, stawki VAT
- 7.4 Pobieranie / udostępnianie faktur
- 7.5 Zbieranie danych pod **DAC7** (raportowanie sprzedawców)

### Moduł 8 — Panel administracyjny (rozbudowany)
- 8.1 Pulpit (statystyki: użytkownicy, ogłoszenia, transakcje, przychód)
- 8.2 Użytkownicy (lista, filtry, weryfikacja, blokady, role)
- 8.3 Ogłoszenia (moderacja, zatwierdzanie, zgłoszenia, ukrywanie)
- 8.4 Transakcje (przegląd, statusy)
- 8.5 Zwroty i reklamacje (rozstrzyganie sporów)
- 8.6 Wiadomości systemowe (wysyłka do grup, szablony, zaplanowane/szkice)
- 8.7 Statystyki / raporty (sprzedaż w czasie, najlepsze kategorie)
- 8.8 Ustawienia platformy (prowizje, kategorie, wysyłka, polityka zwrotów, moderacja, integracje)

### Moduł 9 — Aplikacja mobilna (priorytet) + Web
- 9.1 Pełna obsługa wszystkich powyższych funkcji w aplikacji mobilnej (Expo).
- 9.2 Web towarzyszący (ten sam backend / API).

### Moduł 10 — Stabilizacja MVP
- 10.1 Seed danych demonstracyjnych
- 10.2 Deploy backendu (środowisko robocze / staging)
- 10.3 Build aplikacji mobilnej (wewnętrzny)
- 10.4 Dokumentacja API (Swagger)

---

## ETAP 3 — POZA MVP (osobna wycena)
- Realna integracja operatora płatności (escrow na żywo, KYC, wypłaty).
- Publikacja aplikacji w **Google Play / App Store** (konta deweloperskie, proces review).
- Testy automatyczne / QA, audyt bezpieczeństwa, wdrożenie produkcyjne.
- Ewentualne integracje: faktury/księgowość zewnętrzna, kurierzy + etykiety, wyszukiwarka (Meilisearch), AI auto-listing.

---

## HARMONOGRAM (kolejność wg zależności — czasy orientacyjne)

| Sprint | Zakres | Moduły |
|---|---|---|
| **A** | Fundament + auth + konta (prywatne/firmy) + logowanie Google/Apple | 0, 1 |
| **B** | Ogłoszenia (+ stock), katalog, kategorie, ulubione, filtry, wyszukiwarka | 2, 3 |
| **C** | Wiadomości (czat real-time + powiadomienia) | 4 |
| **D** | „Kup teraz" + „Kup w grupie" + zamówienia + escrow (symulacja) | 5 |
| **E** | Zwroty, spory, anulowanie (ścieżki C2C / B2C) | 6 |
| **F** | Konta firmowe + faktury + rozbudowany panel administracyjny | 7, 8 |
| **G** | Stabilizacja MVP (seed, deploy, build, dokumentacja API) | 9, 10 |

Realizacja iteracyjna — po każdym sprincie działający, demonstrowalny zakres w aplikacji mobilnej.

---

## ZAŁOŻENIA I KWESTIE DO POTWIERDZENIA
- **„Kup w grupie":** próg = liczba osób ustalana przez butik (w ramach stocku), zniżka stała (jeden poziom), brak progu w czasie → zwrot wszystkim. *(do potwierdzenia)*
- **Operator płatności** — wybór w Etapie 3.
- **Weryfikacja e-mail / SMS** — w MVP symulowana, realna w Etapie 3.
- Płatności w MVP — symulowane (bez przepływu realnych środków).
