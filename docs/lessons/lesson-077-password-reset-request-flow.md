# Lesson 077: Password reset request flow

## Learning Goal

Реализовать **запрос сброса пароля**: `POST /auth/request-password-reset` по email создаёт одноразовый opaque `passwordResetToken` в `password_reset_tokens` (при известном пользователе) и всегда отвечает нейтральным сообщением — без раскрытия, зарегистрирован ли email.

## Implementation Scope

В скоупе:

- [`libs/shared-contracts/src/auth/request-password-reset.types.ts`](../../libs/shared-contracts/src/auth/request-password-reset.types.ts) — `RequestPasswordResetResponse`.
- [`libs/shared-contracts/src/index.ts`](../../libs/shared-contracts/src/index.ts) — экспорт типа.
- [`apps/api/src/auth/password-reset-token.entity.ts`](../../apps/api/src/auth/password-reset-token.entity.ts) — сущность `PasswordResetToken`.
- [`apps/api/src/database/migrations/1748188800000-CreatePasswordResetTokensTable.ts`](../../apps/api/src/database/migrations/1748188800000-CreatePasswordResetTokensTable.ts) — DDL.
- [`apps/api/src/auth/password-reset-token-hash.ts`](../../apps/api/src/auth/password-reset-token-hash.ts) + spec — SHA-256 hex.
- [`apps/api/src/auth/password-reset-token.constants.ts`](../../apps/api/src/auth/password-reset-token.constants.ts) — `DEFAULT_PASSWORD_RESET_TTL_MS` (1 ч).
- [`apps/api/src/auth/password-reset-expires-at.ts`](../../apps/api/src/auth/password-reset-expires-at.ts) + spec.
- [`apps/api/src/auth/password-reset-token.service.ts`](../../apps/api/src/auth/password-reset-token.service.ts) + spec — persist/find/consume/`invalidateActiveForUser`.
- [`apps/api/src/auth/auth-credentials.constants.ts`](../../apps/api/src/auth/auth-credentials.constants.ts) — `PASSWORD_RESET_REQUEST_ACCEPTED_MESSAGE`.
- [`apps/api/src/auth/dto/create-request-password-reset-body.dto.ts`](../../apps/api/src/auth/dto/create-request-password-reset-body.dto.ts) — `{ email }`.
- [`apps/api/src/auth/auth.service.ts`](../../apps/api/src/auth/auth.service.ts) — `requestPasswordReset`.
- [`apps/api/src/auth/auth.controller.ts`](../../apps/api/src/auth/auth.controller.ts) — `POST request-password-reset`.
- [`apps/api/src/auth/auth.module.ts`](../../apps/api/src/auth/auth.module.ts) — `forFeature`, provider, export.
- [`apps/api/src/auth/auth.service.spec.ts`](../../apps/api/src/auth/auth.service.spec.ts) — unit (tests-first gate).
- [`apps/api/test/auth-request-password-reset.e2e-spec.ts`](../../apps/api/test/auth-request-password-reset.e2e-spec.ts) — e2e validation / 200 known / 200 unknown.

Намеренно **не** делаем:

- `POST /auth/reset-password` — [шаг 078](../development-roadmap.md).
- `UserService.updatePassword`, revoke refresh при сбросе — **078**.
- Отправка email / rate-limit на request — позже (ADR в Architecture Notes).
- Env `PASSWORD_RESET_EXPIRES_MS` — константа 1h.

## Dependencies

- [Шаг 076](./lesson-076-auth-verify-email.md) — образец opaque token + HTTP + anti-enumeration messaging.
- [Шаг 075](./lesson-075-email-verification-token-model.md) — persistence pattern (hash-at-rest, consume).
- [Шаг 062](./lesson-062-user-service-create-find-by-email.md) — `UserService.findByEmail`.

## Step-by-Step Changes

1. **Red:** specs для hash, expires-at, `PasswordResetTokenService`, `AuthService.requestPasswordReset`.
2. Entity `PasswordResetToken`, migration `CreatePasswordResetTokensTable`.
3. `PasswordResetTokenService` + hash/TTL helpers; `AuthModule` wiring.
4. **Red:** e2e `auth-request-password-reset.e2e-spec.ts`.
5. DTO, constant, `AuthService.requestPasswordReset`, `POST /api/v1/auth/request-password-reset`.
6. `shared-contracts` + export; **Verify:** `api:test`, `api:test:e2e`, `api:lint`, `api:build`; с Docker — `db:migrate`.
7. Docs sync: roadmap, storytelling, README, learning-path, LOCAL_SETUP; back-link в 076.

## Context

После verify-email пользователь может войти, но не восстановить пароль. Шаг 077 даёт request-flow: таблица reset-токенов, invalidate предыдущих активных токенов при повторном запросе, нейтральный ответ для любого email — основа для **078** (completion).

## Concept

**Request flow:** `findByEmail` → если user: `invalidateActiveForUser` → `persistForUser` → **200** с `message` + `passwordResetToken` (временно в JSON, пока нет SMTP). Если user нет: только `message`, без persist. **Anti-enumeration:** одинаковый `message` и **200**; поле `passwordResetToken` только при найденном пользователе — осознанный dev-компромисс до почтового канала (как `emailVerificationToken` на register).

## Code Changes

- Request: `POST /api/v1/auth/request-password-reset` body `{ "email": "user@example.com" }`.
- Known user → **200** `{ "message": "...", "passwordResetToken": "..." }`.
- Unknown email → **200** `{ "message": "..." }` (без `passwordResetToken`).
- TTL: `DEFAULT_PASSWORD_RESET_TTL_MS` (1h) через `passwordResetExpiresAt`.

## Why This Matters

Без request-flow нельзя безопасно начать recovery. Отдельная таблица и invalidate старых токенов снижают риск переиспользования утечёк; нейтральный ответ защищает от перечисления аккаунтов по email.

## Architecture Notes

- **`invalidateActiveForUser`:** перед новым токеном помечает `consumed_at` у всех активных reset-токенов пользователя.
- **`consume` / `findActiveByRawToken`:** готовы для **078**, не вызываются из request endpoint.
- **Enumeration trade-off:** `passwordResetToken` в JSON только для существующего email — убрать при подключении mailer.
- **E2e:** мок `PasswordResetTokenService` + `UserService`, без Postgres.
- **Rate-limit:** не в minimal scope; документировать как follow-up.

## Changed Files

| File                                                                                        | Action                                  |
| ------------------------------------------------------------------------------------------- | --------------------------------------- |
| `libs/shared-contracts/src/auth/request-password-reset.types.ts`                            | created                                 |
| `libs/shared-contracts/src/index.ts`                                                        | changed — export                        |
| `apps/api/src/auth/password-reset-token.entity.ts`                                          | created                                 |
| `apps/api/src/auth/password-reset-token-hash.ts`                                            | created                                 |
| `apps/api/src/auth/password-reset-token-hash.spec.ts`                                       | created                                 |
| `apps/api/src/auth/password-reset-token.constants.ts`                                       | created                                 |
| `apps/api/src/auth/password-reset-expires-at.ts`                                            | created                                 |
| `apps/api/src/auth/password-reset-expires-at.spec.ts`                                       | created                                 |
| `apps/api/src/auth/password-reset-token.service.ts`                                         | created                                 |
| `apps/api/src/auth/password-reset-token.service.spec.ts`                                    | created                                 |
| `apps/api/src/database/migrations/1748188800000-CreatePasswordResetTokensTable.ts`          | created                                 |
| `apps/api/src/auth/auth-credentials.constants.ts`                                           | changed — accepted message              |
| `apps/api/src/auth/dto/create-request-password-reset-body.dto.ts`                           | created                                 |
| `apps/api/src/auth/auth.service.ts`                                                         | changed — `requestPasswordReset`        |
| `apps/api/src/auth/auth.controller.ts`                                                      | changed — `POST request-password-reset` |
| `apps/api/src/auth/auth.module.ts`                                                          | changed — `forFeature`, service         |
| `apps/api/src/auth/auth.service.spec.ts`                                                    | changed — request reset unit tests      |
| `apps/api/test/auth-request-password-reset.e2e-spec.ts`                                     | created                                 |
| `docs/lessons/lesson-077-password-reset-request-flow.md`                                    | created                                 |
| `docs/lessons/lesson-076-auth-verify-email.md`                                              | changed — link to 077                   |
| `docs/development-roadmap.md`                                                               | changed — шаг 077 done                  |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` / `docs/LOCAL_SETUP.md` | changed                                 |

## Verification

```bash
npx nx run shared-contracts:build
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint
npx nx run api:build
```

С Postgres: `npm run db:migrate` — применяется `CreatePasswordResetTokensTable1748188800000`.

## TDD Sequence

- **Red:** specs для hash, expires-at, service, `AuthService.requestPasswordReset`, e2e.
- **Green:** entity, migration, service, HTTP endpoint.
- **Refactor:** без изменения контрактов.

## What To Remember

1. Сырой reset token только в ответе request (пока нет email) — в БД хэш.
2. Одинаковый `message` для known/unknown email; **200** всегда на request.
3. Повторный request инвалидирует предыдущие активные reset-токены пользователя.
4. Unit spec обязателен при изменении `apps/api/src/` (pre-commit gate).
5. Следующий слой — password reset completion (**078**).

## Definition of Done

- [x] `password_reset_tokens` + migration + `PasswordResetTokenService`.
- [x] `POST /api/v1/auth/request-password-reset` → **200** + neutral `message`; token при known user.
- [x] Unit + e2e green; docs sync.

## Verify

```bash
npx nx run api:test
npx nx run api:test:e2e
```

## Homework

Вручную: `POST /auth/register` → `POST /auth/request-password-reset` с тем же email → **200** с `passwordResetToken`; несуществующий email → **200** только с `message`.
