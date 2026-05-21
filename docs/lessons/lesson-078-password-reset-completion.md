# Lesson 078: Password reset completion

## Learning Goal

Замкнуть **сброс пароля**: `POST /auth/reset-password` потребляет активный `passwordResetToken`, обновляет `users.password_hash`, отзывает все активные refresh-сессии пользователя и инвалидирует остальные reset-токены.

## Implementation Scope

В скоупе:

- [`libs/shared-contracts/src/auth/reset-password.types.ts`](../../libs/shared-contracts/src/auth/reset-password.types.ts) — `ResetPasswordResponse`.
- [`libs/shared-contracts/src/index.ts`](../../libs/shared-contracts/src/index.ts) — экспорт типа.
- [`apps/api/src/auth/auth-credentials.constants.ts`](../../apps/api/src/auth/auth-credentials.constants.ts) — `INVALID_PASSWORD_RESET_TOKEN_MESSAGE`, `PASSWORD_RESET_COMPLETED_MESSAGE`.
- [`apps/api/src/auth/dto/create-reset-password-body.dto.ts`](../../apps/api/src/auth/dto/create-reset-password-body.dto.ts) — `{ passwordResetToken, password }`.
- [`apps/api/src/users/user.service.ts`](../../apps/api/src/users/user.service.ts) — `updatePassword`.
- [`apps/api/src/users/user.service.spec.ts`](../../apps/api/src/users/user.service.spec.ts) — unit.
- [`apps/api/src/auth/refresh-token.service.ts`](../../apps/api/src/auth/refresh-token.service.ts) — `revokeAllActiveForUser`.
- [`apps/api/src/auth/refresh-token.service.spec.ts`](../../apps/api/src/auth/refresh-token.service.spec.ts) — unit.
- [`apps/api/src/auth/auth.service.ts`](../../apps/api/src/auth/auth.service.ts) — `resetPassword`.
- [`apps/api/src/auth/auth.controller.ts`](../../apps/api/src/auth/auth.controller.ts) — `POST reset-password`.
- [`apps/api/src/auth/auth.service.spec.ts`](../../apps/api/src/auth/auth.service.spec.ts) — unit (tests-first gate).
- [`apps/api/test/auth-reset-password.e2e-spec.ts`](../../apps/api/test/auth-reset-password.e2e-spec.ts) — e2e validation / 200 / 401.

Намеренно **не** делаем:

- Отправка email / magic link — будущий канал.
- Auto-login после reset (новые `accessToken` / `refreshToken` в ответе).
- Env `PASSWORD_RESET_EXPIRES_MS` — константа 1h (как в 077).
- Rate-limit на reset — позже.
- Полная e2e-матрица request→reset→login — [шаг 085](../development-roadmap.md).

## Dependencies

- [Шаг 077](./lesson-077-password-reset-request-flow.md) — `password_reset_tokens`, `PasswordResetTokenService`, `POST /auth/request-password-reset`.
- [Шаг 076](./lesson-076-auth-verify-email.md) — образец opaque token consume + HTTP + 401.
- [Шаг 061](./lesson-061-password-hasher-service.md) — `PasswordHasherService.hash` для нового пароля.
- [Шаг 070](./lesson-070-auth-refresh-rotation.md) — refresh persistence, revoke semantics.

## Step-by-Step Changes

1. **Red:** specs для `updatePassword`, `revokeAllActiveForUser`, `AuthService.resetPassword`, e2e `auth-reset-password.e2e-spec.ts`.
2. `ResetPasswordResponse` + export; constants + DTO.
3. `UserService.updatePassword`, `RefreshTokenService.revokeAllActiveForUser`.
4. `AuthService.resetPassword`, `POST /api/v1/auth/reset-password`.
5. **Verify:** `shared-contracts:build`, `api:test`, `api:test:e2e`, `api:lint`, `api:build`.
6. Docs sync: roadmap, storytelling, README, learning-path, LOCAL_SETUP; back-link в 077.

## Context

После 077 пользователь получает `passwordResetToken`, но пароль в БД не меняется. Шаг 078 завершает recovery: одноразовый токен, новый Argon2id-хэш, отзыв всех refresh-сессий — чтобы старые сессии не оставались валидными после компрометации.

## Concept

**Completion flow:** `findActiveByRawToken` → `consume` → `updatePassword` → `revokeAllActiveForUser` → `invalidateActiveForUser`. Нейтральное **401** для invalid/expired/consumed (как verify-email). Повторный reset с другим активным токеном того же пользователя после успеха невозможен — остальные reset-токены инвалидируются.

## Code Changes

- Reset: `POST /api/v1/auth/reset-password` body `{ "passwordResetToken": "...", "password": "..." }` → **200** `{ "message": "Password has been reset" }`.
- Invalid token → **401** `Invalid or expired password reset token`.
- Validation: token `MinLength(16)` / `MaxLength(512)`, password `8`–`128`.

## Why This Matters

Без completion request-flow бесполезен для восстановления доступа. Отзыв refresh после смены пароля — базовая гигиена безопасности; инвалидация остальных reset-токенов снижает риск повторного сброса утечённым токеном.

## Architecture Notes

- **Порядок:** consume → update password → revoke refresh → invalidate reset tokens (токен нельзя переиспользовать; сессии обрезаются сразу).
- **`updatePassword`:** `passwordHasher.hash` + `users.update`; `NotFoundException` если user удалён (крайний случай).
- **`revokeAllActiveForUser`:** bulk `revokedAt` для всех неотозванных refresh пользователя.
- **E2e:** мок `PasswordResetTokenService`, `UserService`, `RefreshTokenService` — без Postgres.

## Changed Files

| File                                                                                        | Action                                   |
| ------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `libs/shared-contracts/src/auth/reset-password.types.ts`                                    | created                                  |
| `libs/shared-contracts/src/index.ts`                                                        | changed — export `ResetPasswordResponse` |
| `apps/api/src/auth/auth-credentials.constants.ts`                                           | changed — reset messages                 |
| `apps/api/src/auth/dto/create-reset-password-body.dto.ts`                                   | created                                  |
| `apps/api/src/users/user.service.ts`                                                        | changed — `updatePassword`               |
| `apps/api/src/users/user.service.spec.ts`                                                   | changed — update password tests          |
| `apps/api/src/auth/refresh-token.service.ts`                                                | changed — `revokeAllActiveForUser`       |
| `apps/api/src/auth/refresh-token.service.spec.ts`                                           | changed — revoke all tests               |
| `apps/api/src/auth/auth.service.ts`                                                         | changed — `resetPassword`                |
| `apps/api/src/auth/auth.controller.ts`                                                      | changed — `POST reset-password`          |
| `apps/api/src/auth/auth.service.spec.ts`                                                    | changed — reset password unit tests      |
| `apps/api/test/auth-reset-password.e2e-spec.ts`                                             | created                                  |
| `docs/lessons/lesson-078-password-reset-completion.md`                                      | created                                  |
| `docs/lessons/lesson-077-password-reset-request-flow.md`                                    | changed — link to 078, scope done        |
| `docs/development-roadmap.md`                                                               | changed — шаг 078 done                   |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` / `docs/LOCAL_SETUP.md` | changed                                  |

## Verification

```bash
npx nx run shared-contracts:build
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint
npx nx run api:build
```

## TDD Sequence

- **Red:** specs для `updatePassword`, `revokeAllActiveForUser`, `AuthService.resetPassword`, e2e reset-password.
- **Green:** DTO, constants, services, HTTP endpoint.
- **Refactor:** без изменения контрактов.

## What To Remember

1. Reset token одноразовый — `consume` до смены пароля.
2. После успеха все refresh пользователя отозваны — старый refresh → **401** на `/auth/refresh`.
3. Остальные активные reset-токены пользователя инвалидируются (`invalidateActiveForUser`).
4. Unit spec обязателен при изменении `apps/api/src/` (pre-commit gate).
5. Следующий слой Track 2 — RBAC schema (**079**), seed + guards (**080+**): [lesson-079](./lesson-079-roles-permissions-schema.md).

## Definition of Done

- [x] `POST /api/v1/auth/reset-password` → **200** + `message`; invalid → **401**.
- [x] `UserService.updatePassword` + `RefreshTokenService.revokeAllActiveForUser`.
- [x] Unit + e2e green; docs sync.

## Verify

```bash
npx nx run api:test
npx nx run api:test:e2e
```

## Homework

Вручную: `POST /auth/register` → `POST /auth/request-password-reset` → `POST /auth/reset-password` с `passwordResetToken` и новым паролем → **200**; `POST /auth/login` с новым паролем → токены; старый `refreshToken` → **401** на `/auth/refresh`.
