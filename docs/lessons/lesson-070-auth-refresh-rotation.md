# Lesson 070: `POST /auth/refresh` + rotation

## Learning Goal

Замкнуть **долгую сессию**: login выдаёт opaque `refreshToken`, `POST /auth/refresh` обменивает активный refresh на новую пару `accessToken` + `refreshToken` с rotation в БД (`markReplaced` + `revoked_at`).

## Implementation Scope

В скоупе:

- [`libs/shared-contracts/src/auth/login.types.ts`](../../libs/shared-contracts/src/auth/login.types.ts) — `refreshToken` в `LoginUserResponse`.
- [`libs/shared-contracts/src/auth/refresh.types.ts`](../../libs/shared-contracts/src/auth/refresh.types.ts) — `RefreshSessionResponse`.
- [`libs/shared-contracts/src/index.ts`](../../libs/shared-contracts/src/index.ts) — экспорт типов.
- [`apps/api/src/auth/generate-opaque-token.ts`](../../apps/api/src/auth/generate-opaque-token.ts) — `crypto.randomBytes(32).toString('base64url')`.
- [`apps/api/src/auth/generate-opaque-token.spec.ts`](../../apps/api/src/auth/generate-opaque-token.spec.ts) — unit.
- [`apps/api/src/auth/refresh-token.constants.ts`](../../apps/api/src/auth/refresh-token.constants.ts) — `DEFAULT_REFRESH_TOKEN_TTL_MS` (30 дней до env на 073).
- [`apps/api/src/auth/auth-credentials.constants.ts`](../../apps/api/src/auth/auth-credentials.constants.ts) — `INVALID_REFRESH_TOKEN_MESSAGE`.
- [`apps/api/src/auth/dto/create-refresh-body.dto.ts`](../../apps/api/src/auth/dto/create-refresh-body.dto.ts) — `{ refreshToken }`.
- [`apps/api/src/auth/auth.service.ts`](../../apps/api/src/auth/auth.service.ts) — `issueRefreshForUser`, `login` + refresh, `refresh()`.
- [`apps/api/src/auth/auth.controller.ts`](../../apps/api/src/auth/auth.controller.ts) — `POST refresh`.
- [`apps/api/src/auth/auth.service.spec.ts`](../../apps/api/src/auth/auth.service.spec.ts) — unit (tests-first gate).
- [`apps/api/test/auth-refresh.e2e-spec.ts`](../../apps/api/test/auth-refresh.e2e-spec.ts) — e2e rotation / 401 / validation.
- [`apps/api/test/auth-login.e2e-spec.ts`](../../apps/api/test/auth-login.e2e-spec.ts) — `refreshToken` в login.
- [`apps/api/test/auth-jwt-guard.e2e-spec.ts`](../../apps/api/test/auth-jwt-guard.e2e-spec.ts) — mock `RefreshTokenService` на login.

Намеренно **не** делаем:

- `POST /auth/logout` — [шаг 071](./lesson-071-auth-logout-revoke-refresh.md) (done).
- Reuse detection / revoke family — [шаг 072](./lesson-072-auth-refresh-reuse-detection.md) (done).
- `JWT_REFRESH_EXPIRES_IN` env — [шаг 073](../development-roadmap.md).
- HttpOnly cookies — отложено (см. `cors.config.ts`).
- Полная e2e-матрица register→login→refresh — [шаг 086](../development-roadmap.md).

## Dependencies

- [Шаг 069](./lesson-069-refresh-token-entity-persistence.md) — `RefreshTokenService`, таблица `refresh_tokens`.
- [Шаг 066](./lesson-066-jwt-access-token-service.md) — `JwtAccessTokenService.signForUser`.
- [Шаг 065](./lesson-065-auth-login.md) — `AuthService.login`.

## Step-by-Step Changes

1. Расширить `LoginUserResponse`, добавить `RefreshSessionResponse`, `shared-contracts:build`.
2. **Red:** `auth.service.spec.ts`, `generate-opaque-token.spec.ts`; e2e `auth-refresh.e2e-spec.ts`.
3. `generateOpaqueToken`, TTL-константа, DTO, сообщение об ошибке refresh.
4. `AuthService`: persist refresh на login; `refresh()` — find active → persist successor → `markReplaced` → новый access JWT.
5. `POST /api/v1/auth/refresh` в контроллере.
6. E2e: mock `RefreshTokenService`, validation / 200 rotation / 401.
7. **Verify:** `api:test`, `api:test:e2e`, `api:lint`, `api:build`.
8. Синхронизировать roadmap, storytelling, README, learning-path, LOCAL_SETUP.

## Context

После 069 persistence готов, но клиент не мог продлить сессию без повторного login. Шаг 070 даёт rotation: каждый refresh инвалидирует предыдущий хэш в Postgres и выдаёт новый opaque токен.

## Concept

**Refresh token rotation:** активный refresh → новая запись в `refresh_tokens` → старая помечается `revoked_at` + `replaced_by_token_id`. Повторное использование отозванного токена даёт `401` (`findActiveByRawToken` = null). Access JWT остаётся stateless; refresh — stateful opaque строка в JSON body (redaction уже в Pino).

## Code Changes

- Login: `accessToken` + `refreshToken` (`LoginUserResponse`).
- Refresh: `RefreshSessionResponse` — только токены, без профиля пользователя.
- Транспорт: `POST /api/v1/auth/refresh` body `{ "refreshToken": "..." }`.

## Why This Matters

Без rotation скомпрометированный refresh живёт до TTL. Связка `markReplaced` + новый хэш — база для logout (071) и reuse policy (072).

## Architecture Notes

- **Порядок:** `persistForUser` (successor) → `markReplaced` (predecessor).
- **TTL:** `DEFAULT_REFRESH_TOKEN_TTL_MS` в коде; env — шаг 073.
- **Ошибки refresh:** одно нейтральное сообщение, без утечки «expired vs revoked».
- **E2e:** мок `RefreshTokenService`, как `UserService` на 063 — без Postgres.

## Changed Files

| File                                                                | Action                    |
| ------------------------------------------------------------------- | ------------------------- |
| `libs/shared-contracts/src/auth/login.types.ts`                     | changed — `refreshToken`  |
| `libs/shared-contracts/src/auth/refresh.types.ts`                   | created                   |
| `libs/shared-contracts/src/index.ts`                                | changed — export          |
| `apps/api/src/auth/generate-opaque-token.ts`                        | created                   |
| `apps/api/src/auth/generate-opaque-token.spec.ts`                   | created                   |
| `apps/api/src/auth/refresh-token.constants.ts`                      | created                   |
| `apps/api/src/auth/auth-credentials.constants.ts`                   | changed                   |
| `apps/api/src/auth/dto/create-refresh-body.dto.ts`                  | created                   |
| `apps/api/src/auth/auth.service.ts`                                 | changed — login + refresh |
| `apps/api/src/auth/auth.controller.ts`                              | changed — `POST refresh`  |
| `apps/api/src/auth/auth.service.spec.ts`                            | changed                   |
| `apps/api/test/auth-refresh.e2e-spec.ts`                            | created                   |
| `apps/api/test/auth-login.e2e-spec.ts`                              | changed                   |
| `apps/api/test/auth-jwt-guard.e2e-spec.ts`                          | changed                   |
| `docs/lessons/lesson-070-auth-refresh-rotation.md`                  | created                   |
| `docs/lessons/lesson-069-refresh-token-entity-persistence.md`       | changed — link            |
| `docs/development-roadmap.md`                                       | changed — шаг 070 done    |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` | changed                   |
| `docs/LOCAL_SETUP.md`                                               | changed — next step 071   |

## Verification

- `npx nx run shared-contracts:build`
- `npx nx run api:test` — `auth.service.spec.ts`, `generate-opaque-token.spec.ts`
- `npx nx run api:test:e2e` — `auth-refresh.e2e-spec.ts`, `auth-login.e2e-spec.ts`
- `npx nx run api:lint` — без предупреждений
- `npx nx run api:build` — успешная сборка

## TDD Sequence

- **Red:** unit `AuthService` refresh/login; e2e validation + rotation + 401.
- **Green:** service, controller, contracts, token generator.
- **Refactor:** `requireUserForCredentials` helper в `AuthService`.

## Definition of Done

- [x] Login возвращает `accessToken` + `refreshToken`.
- [x] `POST /api/v1/auth/refresh` ротирует токен; неактивный refresh → `401`.
- [x] Unit + e2e в том же change set, что production-код auth.
- [x] Документация синхронизирована.
- [x] `nx run api:test` green.

## What To Remember

- Сырой refresh — только в ответе клиенту и в body запроса; в БД — SHA-256 хэш.
- Rotation: successor save → predecessor `markReplaced`.
- Reuse detection (семейство токенов) — **072**, не 070.

## Verify

```bash
npx nx run shared-contracts:build
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint
npx nx run api:build
```

## Homework

Вручную: login → сохранить `refreshToken` → `POST /auth/refresh` → убедиться, что старый refresh больше не принимается (401).
