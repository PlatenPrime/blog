# Lesson 076: `POST /auth/verify-email`

## Learning Goal

Замкнуть **подтверждение email**: после register клиент получает opaque `emailVerificationToken`, `POST /auth/verify-email` потребляет активный токен, выставляет `users.email_verified_at` и возвращает ISO-метку подтверждения.

## Implementation Scope

В скоупе:

- [`libs/shared-contracts/src/auth/verify-email.types.ts`](../../libs/shared-contracts/src/auth/verify-email.types.ts) — `VerifyEmailResponse`.
- [`libs/shared-contracts/src/auth/register.types.ts`](../../libs/shared-contracts/src/auth/register.types.ts) — `emailVerificationToken`, `emailVerifiedAt`.
- [`libs/shared-contracts/src/index.ts`](../../libs/shared-contracts/src/index.ts) — экспорт типов.
- [`apps/api/src/database/migrations/1748102400000-AddEmailVerifiedAtToUsers.ts`](../../apps/api/src/database/migrations/1748102400000-AddEmailVerifiedAtToUsers.ts) — колонка `email_verified_at`.
- [`apps/api/src/users/user.entity.ts`](../../apps/api/src/users/user.entity.ts) — `emailVerifiedAt`.
- [`apps/api/src/users/user.service.ts`](../../apps/api/src/users/user.service.ts) — `markEmailVerified` (идемпотентно, не перезаписывает раннюю метку).
- [`apps/api/src/users/user.service.spec.ts`](../../apps/api/src/users/user.service.spec.ts) — unit.
- [`apps/api/src/auth/auth-credentials.constants.ts`](../../apps/api/src/auth/auth-credentials.constants.ts) — `INVALID_EMAIL_VERIFICATION_TOKEN_MESSAGE`.
- [`apps/api/src/auth/dto/create-verify-email-body.dto.ts`](../../apps/api/src/auth/dto/create-verify-email-body.dto.ts) — `{ emailVerificationToken }`.
- [`apps/api/src/auth/auth.service.ts`](../../apps/api/src/auth/auth.service.ts) — `register` + `verifyEmail`.
- [`apps/api/src/auth/auth.controller.ts`](../../apps/api/src/auth/auth.controller.ts) — `POST verify-email`.
- [`apps/api/src/auth/auth.service.spec.ts`](../../apps/api/src/auth/auth.service.spec.ts) — unit (tests-first gate).
- [`apps/api/test/auth-verify-email.e2e-spec.ts`](../../apps/api/test/auth-verify-email.e2e-spec.ts) — e2e validation / 200 / 401.
- [`apps/api/test/auth-register.e2e-spec.ts`](../../apps/api/test/auth-register.e2e-spec.ts) — `emailVerificationToken` в 201.

Намеренно **не** делаем:

- Отправка email / magic link — будущий канал; токен временно в JSON register.
- `POST /auth/resend-verification` — позже.
- Env `EMAIL_VERIFICATION_EXPIRES_MS` — константа 24h (как в 075).
- Полная e2e-матрица register→verify→login — [шаг 085](../development-roadmap.md).

## Dependencies

- [Шаг 075](./lesson-075-email-verification-token-model.md) — `EmailVerificationTokenService`, таблица `email_verification_tokens`.
- [Шаг 063](./lesson-063-auth-register-dto.md) — `AuthService.register`, `RegisterUserResponse`.
- [Шаг 070](./lesson-070-auth-refresh-rotation.md) — образец opaque token + DTO + e2e с моками.

## Step-by-Step Changes

1. Миграция `email_verified_at`, entity + `UserService.markEmailVerified`.
2. Расширить `RegisterUserResponse`, добавить `VerifyEmailResponse`, `shared-contracts:build`.
3. **Red:** `user.service.spec.ts`, `auth.service.spec.ts`; e2e `auth-verify-email.e2e-spec.ts`.
4. DTO, константа ошибки, `AuthService.verifyEmail` + выдача токена на register.
5. `POST /api/v1/auth/verify-email` в контроллере.
6. E2e: mock `EmailVerificationTokenService` / `UserService`, validation / 200 / 401; обновить register e2e.
7. **Verify:** `api:test`, `api:test:e2e`, `api:lint`, `api:build`; с Docker — `db:migrate`.
8. Docs sync: roadmap, storytelling, README, learning-path, LOCAL_SETUP.

## Context

После 075 persistence готов, но пользователь не мог подтвердить email через HTTP. Шаг 076 даёт контракт verify и связывает register с одноразовым токеном — основа для password reset (077+) и политик «verified only».

## Concept

**Verify flow:** `findActiveByRawToken` → `consume` → `markEmailVerified`. Нейтральное **401** для invalid/expired/consumed (без enumeration). **Идемпотентность:** повторный verify с новым активным токеном для уже подтверждённого пользователя — **consume** токена, **markEmailVerified** не меняет раннюю `email_verified_at`. Register отдаёт `emailVerificationToken` в JSON (временно, пока нет почтового канала).

## Code Changes

- Register: `emailVerificationToken` + `emailVerifiedAt: null` в `RegisterUserResponse`.
- Verify: `POST /api/v1/auth/verify-email` body `{ "emailVerificationToken": "..." }` → **200** `{ "emailVerifiedAt": "..." }`.
- TTL токена: `DEFAULT_EMAIL_VERIFICATION_TTL_MS` (24h) через `emailVerificationExpiresAt`.

## Why This Matters

Без verify-email регистрация не доказывает владение адресом. Колонка `email_verified_at` — единый флаг для RBAC, reset и аудита; opaque токен остаётся stateful и одноразовым, как refresh.

## Architecture Notes

- **Порядок verify:** `consume` → `markEmailVerified` (токен нельзя переиспользовать даже при гонке).
- **`markEmailVerified`:** если `email_verified_at` уже задан — no-op update, вернуть существующую дату.
- **E2e:** мок `EmailVerificationTokenService`, как refresh на 070 — без Postgres.
- **Login response:** без `emailVerificationToken` — только register расширен (login types не менялись).

## Changed Files

| File                                                                                        | Action                                   |
| ------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `libs/shared-contracts/src/auth/verify-email.types.ts`                                      | created                                  |
| `libs/shared-contracts/src/auth/register.types.ts`                                          | changed — verification fields            |
| `libs/shared-contracts/src/index.ts`                                                        | changed — export `VerifyEmailResponse`   |
| `apps/api/src/database/migrations/1748102400000-AddEmailVerifiedAtToUsers.ts`               | created                                  |
| `apps/api/src/users/user.entity.ts`                                                         | changed — `emailVerifiedAt`              |
| `apps/api/src/users/user.service.ts`                                                        | changed — `markEmailVerified`            |
| `apps/api/src/users/user.service.spec.ts`                                                   | changed — mark verified tests            |
| `apps/api/src/auth/auth-credentials.constants.ts`                                           | changed — invalid verification message   |
| `apps/api/src/auth/dto/create-verify-email-body.dto.ts`                                     | created                                  |
| `apps/api/src/auth/auth.service.ts`                                                         | changed — register + `verifyEmail`       |
| `apps/api/src/auth/auth.controller.ts`                                                      | changed — `POST verify-email`            |
| `apps/api/src/auth/auth.service.spec.ts`                                                    | changed — register + verify unit tests   |
| `apps/api/test/auth-verify-email.e2e-spec.ts`                                               | created                                  |
| `apps/api/test/auth-register.e2e-spec.ts`                                                   | changed — token in 201                   |
| `apps/api/test/auth-login.e2e-spec.ts`                                                      | changed — `emailVerifiedAt` on fake user |
| `docs/lessons/lesson-076-auth-verify-email.md`                                              | created                                  |
| `docs/lessons/lesson-075-email-verification-token-model.md`                                 | changed — link to 076                    |
| `docs/development-roadmap.md`                                                               | changed — шаг 076 done                   |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` / `docs/LOCAL_SETUP.md` | changed                                  |

## Verification

```bash
npx nx run shared-contracts:build
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint
npx nx run api:build
```

С Postgres: `npm run db:migrate` — применяется `AddEmailVerifiedAtToUsers1748102400000`.

## TDD Sequence

- **Red:** specs для `markEmailVerified`, `AuthService.verifyEmail`, e2e verify-email.
- **Green:** минимальный сервис + controller + register integration.
- **Refactor:** без изменения контрактов.

## What To Remember

1. Сырой verification token только в ответе register (пока нет email) — в БД хэш.
2. Одно сообщение **401** для всех неактивных токенов.
3. `markEmailVerified` идемпотентен — не затирает первую дату verify.
4. Unit spec обязателен при любом изменении `apps/api/src/` (pre-commit gate).
5. Password reset request — [077](./lesson-077-password-reset-request-flow.md); completion — [078](./lesson-078-password-reset-completion.md).

## Definition of Done

- [x] `email_verified_at` + migration + `markEmailVerified`.
- [x] `POST /api/v1/auth/verify-email` → **200** + `emailVerifiedAt`; invalid → **401**.
- [x] Register → `emailVerificationToken` + `emailVerifiedAt: null`.
- [x] Unit + e2e green; docs sync.

## Verify

```bash
npx nx run api:test
npx nx run api:test:e2e
```

## Homework

Вручную: `POST /auth/register` → скопировать `emailVerificationToken` → `POST /auth/verify-email` → **200** с `emailVerifiedAt`; повтор с тем же токеном → **401**.
