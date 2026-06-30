# „Kup w grupie" — specyfikacja (do wdrożenia po Etapie 1)

> Status: **zaprojektowane, NIE wdrożone w pełni.** Gotowy jest model danych + konfiguracja na ogłoszeniu
> (firma) + bramkowanie firmowe. Mechanika zbiórek (dołączanie, próg, 24h, „Kup teraz") = do zrobienia.
> Najpierw domykamy Etap 1.

## Idea (uzgodniona z klientem)
- Funkcja **tylko dla kont firmowych** (BUSINESS). Przy wystawianiu opcjonalny przełącznik „Wystaw jako Kup w grupie".
- Firma sprzedaje **wiele identycznych sztuk** (`quantity`, np. 20 koszulek).
- Ogłoszenie grupowe ma: **zniżkę %** (`groupDiscount`, np. 15%), **próg** (`groupMin`, min. osób) i **maks. osób w grupie** (`groupMax`).
- Ludzie **dołączają do zbiórki bez płatności** — to tylko rezerwacja miejsca; licznik „2/5".
- Po osiągnięciu **progu** cena **automatycznie spada o zniżkę** dla całej grupy → pojawia się **„Kup teraz"** w obniżonej cenie.
- To **nie** zrzutka na jeden przedmiot — jest kilka sztuk, więc **każdy kupuje własną** (osobne zamówienia, ta sama niższa cena). Płatności NIE trzeba dzielić.
- **Zbiórka ważna 24h** (jedno okno). Nie zbierze progu w 24h → wygasa.
- **Wiele grup na jednym ogłoszeniu:** 20 szt., maks. 5 osób → nawet **4 równoległe grupy**. Nowa grupa powstaje, gdy nie ma otwartej, a zostały jeszcze sztuki.

## Model danych (już w schemacie)
**Listing** (pola firmowe):
- `quantity Int` — liczba identycznych sztuk
- `groupBuy Boolean` — czy ogłoszenie jest grupowe
- `groupDiscount Int` — % zniżki po osiągnięciu progu
- `groupMin Int` — próg (min. osób)
- `groupMax Int` — maks. osób w jednej grupie

**GroupBuy** (jedna zbiórka; ogłoszenie ma `groupBuys GroupBuy[]`):
- `threshold` (= groupMin), `capacity` (≤ groupMax i ≤ dostępne sztuki), `discountPct` (snapshot z ogłoszenia)
- `deadline` (createdAt + 24h), `status` (FORMING / FILLED / COMPLETED / EXPIRED / CANCELLED)
- `participants GroupBuyParticipant[]`

**GroupBuyParticipant:** `groupBuyId` + `userId` (+ `paymentRef` na przyszłość), `@@unique([groupBuyId, userId])`.

## Reguła cenowa
`cena grupowa = round(price * (100 - discountPct) / 100)`. Zniżka aktywna **dopiero** po `status = FILLED` (osiągnięty próg). Cena pojedyncza (poza grupą) bez zmian.

## Przepływ (do wdrożenia — Etap 2/po Etapie 1)
1. **Dołącz** → znajdź otwartą grupę ogłoszenia (FORMING, `participants < capacity`, `deadline > now`); jeśli brak, a zostały sztuki → utwórz nową (capacity = min(groupMax, dostępne sztuki), deadline = now+24h). Dodaj uczestnika (bez płatności).
2. **Licznik / countdown** — „X/Y osób, brakuje N", pozostały czas do `deadline`.
3. **Próg osiągnięty** (`participants ≥ threshold`) → `status = FILLED` → odblokowanie **„Kup teraz"** w cenie grupowej dla każdego uczestnika.
4. **Kup teraz** → osobne zamówienie per osoba (`Order`, amount = cena grupowa). Płatność = **zaślepka** (realna w Etapie 2: płatności/wysyłki).
5. **Wygaśnięcie** — `deadline` minął bez progu → `status = EXPIRED` (zbiórka nieudana, brak zniżki). Zwolnione sztuki wracają do puli.
6. **Pula sztuk** — sumarycznie aktywne/zakończone grupy nie mogą zająć więcej niż `quantity` sztuk.

## Co już zrobione
- Schemat (pola + relacje), migracja w bazie.
- Bramkowanie firmowe na backendzie: `quantity`/`groupBuy` (i pozostałe) ustawia tylko konto BUSINESS; prywatne = 1 / false.
- Formularz „Sprzedaj": dla firm „Ilość sztuk" (± stepper) + przełącznik „Wystaw jako Kup w grupie".
- Produkt: „Dostępne: X szt.", przycisk „Kup w grupie" tylko gdy `groupBuy`, badge „Firma" przy sprzedawcy.

## Do zrobienia (kolejny etap)
- Pola konfiguracji zbiórki w formularzu (gdy grupowy): **zniżka %**, **próg**, **maks. osób** (zapis `groupDiscount`/`groupMin`/`groupMax`).
- Backend `groupbuy`: `join` / `leave` / `status`, tworzenie wielu grup, FILLED/EXPIRED (cron lub lazy), „Kup teraz" → Order.
- Realny `GroupBuyScreen`: stan grupy, licznik, countdown 24h, lista uczestników, „Dołącz" → po progu „Kup teraz".
- Realtime: aktualizacja licznika grupy na żywo.
