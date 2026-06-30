# API — Autoryzacja i użytkownik

Bazowy URL: `http://<host>:4000/api/v1`
Swagger: `http://<host>:4000/api/docs`

## Model tokenów

- **accessToken** — JWT, ważny 15 min (`JWT_ACCESS_EXPIRES_IN`). Wozisz go w nagłówku
  `Authorization: Bearer <accessToken>` przy żądaniach chronionych.
- **refreshToken** — JWT, ważny 7 dni (`JWT_REFRESH_EXPIRES_IN`). Służy tylko do odświeżania.
- **Rotacja:** każdy `/auth/refresh` wydaje nową parę i **unieważnia poprzedni** refresh.
  W bazie trzymany jest jedynie **SHA-256** ostatniego refreshu (`User.hashedRefreshToken`);
  niezgodność = sesja unieważniona (ochrona przed kradzieżą/replayem).
- Hasła: **bcrypt** (12 rund). Refresh nie idzie przez bcrypt (limit 72 bajtów obcinałby JWT) —
  stąd SHA-256.

Payload JWT: `{ sub, role, accountType, type: 'access' | 'refresh' }`.

---

## POST /auth/register

Rejestracja. Backend od razu loguje (zwraca komplet). Limit: 10/godz.

**Body (konto prywatne):**
```json
{
  "email": "anna@example.com",
  "password": "tajneHaslo123",
  "displayName": "Anna",
  "accountType": "PRIVATE"
}
```

**Body (konto firmowe):** dodatkowo wymagane `companyName` i `nip` (dokładnie 10 cyfr):
```json
{
  "email": "butik@example.com",
  "password": "tajneHaslo123",
  "displayName": "Butik Moda",
  "accountType": "BUSINESS",
  "companyName": "Moda Sp. z o.o.",
  "nip": "1234567890"
}
```

**Walidacja:** `password` 8–72 znaki, `displayName` 2–80, `nip` `^\d{10}$`.

**201:**
```json
{
  "user": {
    "id": "uuid", "email": "anna@example.com", "role": "USER",
    "accountType": "PRIVATE", "displayName": "Anna",
    "bio": null, "avatarUrl": null, "companyName": null, "nip": null,
    "createdAt": "…", "updatedAt": "…"
  },
  "accessToken": "eyJ…",
  "refreshToken": "eyJ…"
}
```

**409** — e-mail zajęty. **400** — błąd walidacji DTO.

---

## POST /auth/login

Logowanie. Limit: 20/15 min.

**Body:** `{ "email": "anna@example.com", "password": "tajneHaslo123" }`

**200:** identyczny kształt jak rejestracja (`user` + `accessToken` + `refreshToken`).

**401:** `"Niepoprawny e-mail lub hasło."` — stały komunikat niezależnie od tego, czy konto
istnieje (anti user-enumeration).

---

## POST /auth/refresh

Rotacja tokenów. Limit: 30/godz.

**Body:** `{ "refreshToken": "eyJ…" }`

**200:** `{ "accessToken": "eyJ…", "refreshToken": "eyJ…" }` (nowa para).

**401:** token nieprawidłowy/wygasły/nieaktualny (po rotacji lub wylogowaniu).

---

## POST /auth/logout  🔒

Unieważnia refresh po stronie serwera (`hashedRefreshToken → null`). Wymaga Bearer.

**200:** `{ "success": true }`

---

## GET /users/me  🔒

Profil zalogowanego użytkownika (kształt jak `user` wyżej). Wymaga Bearer.

## PATCH /users/me  🔒

Aktualizacja profilu. Wszystkie pola opcjonalne:
`displayName`, `bio`, `avatarUrl`, `companyName`, `nip`.

---

## Jak to konsumuje mobile

1. `login`/`register` → zapis pary tokenów w `expo-secure-store` (`api/auth.ts`).
2. Każde żądanie: interceptor dokłada `Authorization: Bearer <access>` (`api/client.ts`).
3. Na **401** klient sam robi `POST /auth/refresh` (refresh w ciele), zapisuje nową parę
   i ponawia żądanie. Równoległe 401 czekają na jeden refresh (single-flight).
4. Nieudany refresh → czyszczenie tokenów → `AuthContext` odsyła do `AuthScreen`.

> Uwaga na spójność kluczy: backend zwraca **camelCase** (`accessToken`/`refreshToken`)
> i dokładnie te pola czyta klient mobilny.
