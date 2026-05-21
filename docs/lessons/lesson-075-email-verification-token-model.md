# Lesson 075: Email verification token model (minimal)

## Learning Goal

Заложить **хранение opaque email-verification токенов**: таблица `email_verification_tokens`, сущность TypeORM, SHA-256 хэш сырого токена и `EmailVerificationTokenService` для persist/find/consume — без HTTP и без `email_verified_at` на `User`.

## Implementation Scope

В скоупе:

- [`apps/api/src/auth/email-verification-token.entity.ts`](../../apps/api/src/auth/email-verification-token.entity.ts) — сущность `EmailVerificationToken`.
- [`apps/api/src/database/migrations/1748016000000-CreateEmailVerificationTokensTable.ts`](../../apps/api/src/database/migrations/1748016000000-CreateEmailVerificationTokensTable.ts) — DDL: FK на `users`, `UNIQUE (token_hash)`, индекс на `user_id`.
- [`apps/api/src/auth/email-verification-token-hash.ts`](../../apps/api/src/auth/email-verification-token-hash.ts) — `hashEmailVerificationToken` (SHA-256 hex).
- [`apps/api/src/auth/email-verification-token-hash.spec.ts`](../../apps/api/src/auth/email-verification-token-hash.spec.ts) — unit.
- [`apps/api/src/auth/email-verification-token.constants.ts`](../../apps/api/src/auth/email-verification-token.constants.ts) — `DEFAULT_EMAIL_VERIFICATION_TTL_MS` (24 ч).
- [`apps/api/src/auth/email-verification-expires-at.ts`](../../apps/api/src/auth/email-verification-expires-at.ts) + spec — pure `emailVerificationExpiresAt(now, ttlMs)`.
- [`apps/api/src/auth/email-verification-token.service.ts`](../../apps/api/src/auth/email-verification-token.service.ts) — `persistForUser`, `findByRawToken`, `findActiveByRawToken`, `consume`.
- [`apps/api/src/auth/email-verification-token.service.spec.ts`](../../apps/api/src/auth/email-verification-token.service.spec.ts) — unit с моком `Repository`.
- [`apps/api/src/auth/auth.module.ts`](../../apps/api/src/auth/auth.module.ts) — `TypeOrmModule.forFeature`, export `EmailVerificationTokenService`.

Намеренно **не** делаем:

- `POST /auth/verify-email`, DTO, e2e — [шаг 076](../development-roadmap.md).
- `users.email_verified_at` — [шаг 076](../development-roadmap.md).
- Отправка email / resend — позже.
- Env `EMAIL_VERIFICATION_EXPIRES_MS` — константа 24h (как refresh до 073); env на 076+ при необходимости.
- Интеграция в `AuthService.register` — [шаг 076](../development-roadmap.md).
- `shared-contracts`, изменения login/register response.

## Dependencies

- [Шаг 060](./lesson-060-user-entity-indexes.md) — таблица `users`, FK target.
- [Шаг 059](./lesson-059-migration-workflow-baseline-schema.md) — `db:migrate*`.
- [Шаг 069](./lesson-069-refresh-token-entity-persistence.md) — образец opaque token + hash-at-rest.
- [Шаг 074](./lesson-074-login-brute-force-lockout.md) — login lockout готов; verify-email — следующий слой.

## Step-by-Step Changes

1. **Red:** `email-verification-token-hash.spec.ts`, `email-verification-expires-at.spec.ts`, `email-verification-token.service.spec.ts`.
2. Сущность `EmailVerificationToken` с `user_id`, `token_hash`, `expires_at`, `consumed_at`.
3. Миграция `CreateEmailVerificationTokensTable`.
4. `EmailVerificationTokenService` + `hashEmailVerificationToken` + constants/TTL helper.
5. `AuthModule`: `forFeature`, provider, export сервиса.
6. **Verify:** `api:test`, `api:lint`, `api:build`; с Docker — `db:migrate`.
7. Docs sync: roadmap, storytelling, README, learning-path, LOCAL_SETUP; back-link в 074.

## Context

После 074 auth-поток защищён от brute-force, но email пользователя ещё не подтверждён. Одноразовая ссылка с opaque токеном требует отдельной таблицы (хэш, TTL, consume) — схема и persistence готовят **076** без переделки DDL.

## Concept

**Opaque verification + hash-at-rest:** как refresh на 069, сырой токен из письма никогда не пишется в Postgres — только SHA-256. **`consumed_at`** (не `revoked_at`) помечает одноразовое использование. Default TTL **24 часа** через `DEFAULT_EMAIL_VERIFICATION_TTL_MS` и `emailVerificationExpiresAt` — без env в minimal scope.

## Code Changes

- `persistForUser({ userId, rawToken, expiresAt })` — hash → `save`.
- `findActiveByRawToken` — `consumedAt IS NULL` и `expiresAt > now()`.
- `consume(id)` — `consumedAt = now()` только для неконсумированных строк.

## Why This Matters

Без таблицы нельзя честно реализовать verify-email: токен должен быть одноразовым и с истечением. Отдельный сервис позволяет мокать persistence в e2e **076** без Postgres.

## Architecture Notes

- **`ON DELETE CASCADE` на `user_id`:** при удалении пользователя токены верификации исчезают.
- **Уникальный `token_hash`:** один lookup по представленному токену.
- **Генерация `rawToken`:** вне скоупа (076 вызовет `generateOpaqueToken` из [`generate-opaque-token.ts`](../../apps/api/src/auth/generate-opaque-token.ts)).
- **Индекс `user_id`:** подготовка к invalidate/resend на будущих шагах.

## Changed Files

| File                                                                                        | Action                          |
| ------------------------------------------------------------------------------------------- | ------------------------------- |
| `apps/api/src/auth/email-verification-token.entity.ts`                                      | created                         |
| `apps/api/src/auth/email-verification-token-hash.ts`                                        | created                         |
| `apps/api/src/auth/email-verification-token-hash.spec.ts`                                   | created                         |
| `apps/api/src/auth/email-verification-token.constants.ts`                                   | created                         |
| `apps/api/src/auth/email-verification-expires-at.ts`                                        | created                         |
| `apps/api/src/auth/email-verification-expires-at.spec.ts`                                   | created                         |
| `apps/api/src/auth/email-verification-token.service.ts`                                     | created                         |
| `apps/api/src/auth/email-verification-token.service.spec.ts`                                | created                         |
| `apps/api/src/database/migrations/1748016000000-CreateEmailVerificationTokensTable.ts`      | created                         |
| `apps/api/src/auth/auth.module.ts`                                                          | changed — `forFeature`, service |
| `docs/lessons/lesson-075-email-verification-token-model.md`                                 | created                         |
| `docs/lessons/lesson-074-login-brute-force-lockout.md`                                      | changed — link to 075           |
| `docs/development-roadmap.md`                                                               | changed — шаг 075 done          |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` / `docs/LOCAL_SETUP.md` | changed                         |

## Verification

- `npx nx run api:test` — hash, expires-at, service specs зелёные.
- `npx nx run api:lint` — без предупреждений.
- `npx nx run api:build` — успешная сборка.
- С поднятым Postgres (`npm run db:up`): `npm run db:migrate` — применяется `CreateEmailVerificationTokensTable1748016000000`.

## TDD Sequence

- **Red:** specs для hash, expires-at, service (мок репозитория).
- **Green:** entity, migration, service, module wiring.
- **Refactor:** без изменения публичного API сервиса.

## Definition of Done

- [x] Таблица `email_verification_tokens` + entity + hash + service.
- [x] Unit-тесты green; `EmailVerificationTokenService` экспортирован из `AuthModule`.
- [x] Roadmap 075 = done; docs/storytelling синхронизированы.

## What To Remember

1. Email verification — **stateful opaque** токен, не JWT.
2. В БД только **hash**; raw token живёт в ссылке письма.
3. **`consumed_at`** — одноразовость; expired — по `expires_at`.
4. HTTP и `email_verified_at` — **076**, не смешивать с моделью.
5. Default TTL 24h — константа; env можно добавить позже.

## Verify

```bash
npx nx run api:test
npx nx run api:lint
npx nx run api:build
```

## Homework

- Прогнать `db:migrate` локально и проверить `\d email_verification_tokens` в `psql`.
- На 076: спроектировать `POST /auth/verify-email` и колонку `email_verified_at`.
