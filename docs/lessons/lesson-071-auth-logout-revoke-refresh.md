# Lesson 071: `POST /auth/logout` + revoke refresh

## Learning Goal

Завершить **выход из долгой сессии**: клиент отправляет opaque `refreshToken`, сервер помечает строку в `refresh_tokens` как отозванную (`revoked_at`), без выдачи новых токенов. Ответ **idempotent 204** — не раскрываем, был ли токен валиден.

## Implementation Scope

В скоупе:

- [`apps/api/src/auth/auth.service.ts`](../../apps/api/src/auth/auth.service.ts) — `logout()` через `findByRawToken` + `revoke`.
- [`apps/api/src/auth/auth.controller.ts`](../../apps/api/src/auth/auth.controller.ts) — `POST logout`, `@HttpCode(NO_CONTENT)`.
- [`apps/api/src/auth/dto/create-refresh-body.dto.ts`](../../apps/api/src/auth/dto/create-refresh-body.dto.ts) — переиспользование `{ refreshToken }` (та же форма, что у refresh).
- [`apps/api/src/auth/auth.service.spec.ts`](../../apps/api/src/auth/auth.service.spec.ts) — unit (tests-first gate).
- [`apps/api/test/auth-logout.e2e-spec.ts`](../../apps/api/test/auth-logout.e2e-spec.ts) — validation + 204 cases.

Намеренно **не** делаем:

- Revoke-all по `user_id` — отдельное расширение (индекс на 069).
- Reuse detection — [шаг 072](../development-roadmap.md).
- JWT / Bearer на logout — refresh достаточно для stateful сессии.
- HttpOnly cookies — отложено.
- Полная e2e-матрица register→login→refresh→logout — [шаг 086](../development-roadmap.md).

## Dependencies

- [Шаг 070](./lesson-070-auth-refresh-rotation.md) — rotation, `CreateRefreshBodyDto`.
- [Шаг 069](./lesson-069-refresh-token-entity-persistence.md) — `RefreshTokenService.revoke`, `findByRawToken`.

## Step-by-Step Changes

1. **Red:** unit `AuthService.logout`; e2e `auth-logout.e2e-spec.ts`.
2. `AuthService.logout`: `findByRawToken` → если `revokedAt === null` → `revoke(id)`; иначе no-op.
3. `POST /api/v1/auth/logout` в контроллере, 204 No Content.
4. E2e: mock `RefreshTokenService`, validation / 204 active / unknown / already revoked.
5. **Verify:** `api:test`, `api:test:e2e`, `api:lint`, `api:build`.
6. Синхронизировать roadmap, storytelling, README, learning-path, LOCAL_SETUP.

## Context

После 070 клиент мог продлевать сессию, но не мог её завершить на сервере. `RefreshTokenService.revoke` уже был покрыт unit-тестами на 069, но не вызывался из HTTP.

## Concept

**Idempotent logout:** всегда `204`, чтобы не перечислять «токен существует / уже отозван / неизвестен». Внутри — best-effort `revoke` только для строки с `revoked_at IS NULL` (включая просроченные, но ещё не отозванные — через `findByRawToken`, не `findActiveByRawToken`).

## Code Changes

- `AuthService.logout(dto: CreateRefreshBodyDto): Promise<void>`.
- `POST /api/v1/auth/logout` body `{ "refreshToken": "..." }` → **204**, пустое тело.

## Why This Matters

Без logout скомпрометированный refresh живёт до TTL даже после «выхода» в UI. Revoke закрывает stateful сессию; access JWT истекает сам по TTL.

## Architecture Notes

- **Симметрия с refresh:** тот же DTO; refresh — 401 при неактивном, logout — всегда 204 (разные угрозы enumeration).
- **Не rotation:** не вызываем `persistForUser` / `markReplaced`.
- **E2e:** мок `RefreshTokenService`, как 070 — без Postgres.

## Changed Files

| File                                                                | Action                      |
| ------------------------------------------------------------------- | --------------------------- |
| `apps/api/src/auth/auth.service.ts`                                 | changed — `logout()`        |
| `apps/api/src/auth/auth.controller.ts`                              | changed — `POST logout`     |
| `apps/api/src/auth/auth.service.spec.ts`                            | changed — logout unit tests |
| `apps/api/test/auth-logout.e2e-spec.ts`                             | created                     |
| `docs/lessons/lesson-071-auth-logout-revoke-refresh.md`             | created                     |
| `docs/lessons/lesson-070-auth-refresh-rotation.md`                  | changed — link to 071       |
| `docs/development-roadmap.md`                                       | changed — шаг 071 done      |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` | changed                     |
| `docs/LOCAL_SETUP.md`                                               | changed — next step 072     |

## Verification

- `npx nx run api:test` — `auth.service.spec.ts`
- `npx nx run api:test:e2e` — `auth-logout.e2e-spec.ts`
- `npx nx run api:lint` — без предупреждений
- `npx nx run api:build` — успешная сборка

## TDD Sequence

- **Red:** unit logout revoke / no-op / unknown; e2e validation + 204.
- **Green:** service + controller route.
- **Refactor:** нет (логика минимальна).

## Definition of Done

- [x] `POST /api/v1/auth/logout` → **204** idempotent.
- [x] Активная (не `revoked`) строка получает `revoked_at` через `revoke`.
- [x] Unit + e2e в том же change set, что production-код auth.
- [x] Документация синхронизирована.
- [x] `nx run api:test` green.

## What To Remember

- Logout использует `findByRawToken`, не `findActiveByRawToken` — отзываем и просроченные, но не revoked.
- Idempotent 204 — намеренный выбор против enumeration.
- Reuse policy (семейство токенов) — **072**, не 071.

## Verify

```bash
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint
npx nx run api:build
```

## Homework

Вручную: login → `POST /auth/logout` с `refreshToken` → `POST /auth/refresh` с тем же токеном → **401**.
