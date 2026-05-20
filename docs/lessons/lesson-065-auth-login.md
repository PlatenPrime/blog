# Lesson 065: `POST /auth/login`

## Learning Goal

Добавить **вход по email и паролю**: тот же транспортный контракт `{ email, password }`, проверка через `UserService.findByEmail` и `PasswordHasherService.verify`, публичный `LoginUserResponse` в `shared-contracts` — без JWT и без утечки `passwordHash`.

## Implementation Scope

В скоупе:

- [`libs/shared-contracts/src/auth/login.types.ts`](../../libs/shared-contracts/src/auth/login.types.ts) — `LoginUserResponse`.
- [`apps/api/src/auth/auth-credentials.constants.ts`](../../apps/api/src/auth/auth-credentials.constants.ts) — единое сообщение для неверных учётных данных.
- [`apps/api/src/auth/dto/create-login-body.dto.ts`](../../apps/api/src/auth/dto/create-login-body.dto.ts) — валидация входа.
- [`apps/api/src/auth/auth.service.ts`](../../apps/api/src/auth/auth.service.ts) — `login()`, общий `toPublicUserResponse`.
- [`apps/api/src/auth/auth.controller.ts`](../../apps/api/src/auth/auth.controller.ts) — `POST login`, `@HttpCode(200)`.
- [`apps/api/src/auth/auth.service.spec.ts`](../../apps/api/src/auth/auth.service.spec.ts) — unit (tests-first gate).
- [`apps/api/test/auth-login.e2e-spec.ts`](../../apps/api/test/auth-login.e2e-spec.ts) — e2e с моками `UserService` и `PasswordHasherService`.

Намеренно **не** делаем:

- JWT, `JwtStrategy`, guards — [шаг 066](../development-roadmap.md).
- Rate limiting / lockout — [шаг 074](../development-roadmap.md).
- Refresh / logout — [шаги 069–071](../development-roadmap.md).

## Dependencies

- [Шаг 061](./lesson-061-password-hasher-service.md) — `PasswordHasherService.verify`.
- [Шаг 062](./lesson-062-user-service-create-find-by-email.md) — `UserService.findByEmail`.
- [Шаг 064](./lesson-064-unique-email-friendly-conflict.md) — нормализация email в `findByEmail`.
- [Шаг 038](./lesson-038-global-exception-filter.md) — `UnauthorizedException` → problem+json.

## Step-by-Step Changes

1. Добавить `LoginUserResponse` в `shared-contracts` и экспорт из `index.ts`.
2. Константа `INVALID_LOGIN_CREDENTIALS_MESSAGE` и `CreateLoginBodyDto`.
3. **Red:** расширить `auth.service.spec.ts` — happy path, user null, verify false.
4. `AuthService.login`: `findByEmail` → `verify` → map; внедрить `PasswordHasherService`.
5. `AuthController`: `@Post('login')`, `@HttpCode(200)`.
6. E2e: override `UserService` + `PasswordHasherService`, validation / 200 / 401.
7. **Verify:** `shared-contracts:build`, `api:test`, `api:test:e2e`, `api:lint`, `api:build`.
8. Синхронизировать roadmap, storytelling, README, learning-path, LOCAL_SETUP.

## Context

После 064 регистрация предсказуема, но «войти» ещё нельзя. Login — минимальный use-case «доказать личность» до выдачи токена на 066.

## Concept

**Один ответ на оба провала:** неизвестный email и неверный пароль → одно `401 UNAUTHORIZED` с `Invalid email or password`, чтобы не перечислять аккаунты. Нормализация email остаётся в `UserService`, не в DTO.

## Code Changes

- `POST /api/v1/auth/login` → `200` + `LoginUserResponse` при верных данных.
- Неверные credentials → `401` + `UNAUTHORIZED` problem+json.
- Невалидное тело / extra fields → `400` `VALIDATION_FAILED`, как у register.

## Why This Matters

Без login JWT (066) не к чему привязать субъект. Отдельный тип `LoginUserResponse` готовит контракт к расширению токеном на следующем шаге без ломания register.

## Architecture Notes

- **E2e:** моки `findByEmail` и `verify` — Postgres не нужен; unit spec обязателен для pre-commit gate.
- **`toPublicUserResponse`:** общий маппинг для register и login без дублирования полей.

## Changed Files

| File                                                                | Action                  |
| ------------------------------------------------------------------- | ----------------------- |
| `libs/shared-contracts/src/auth/login.types.ts`                     | created                 |
| `libs/shared-contracts/src/index.ts`                                | changed — export type   |
| `apps/api/src/auth/auth-credentials.constants.ts`                   | created                 |
| `apps/api/src/auth/dto/create-login-body.dto.ts`                    | created                 |
| `apps/api/src/auth/auth.service.ts`                                 | changed — login         |
| `apps/api/src/auth/auth.controller.ts`                              | changed — POST login    |
| `apps/api/src/auth/auth.service.spec.ts`                            | changed — login tests   |
| `apps/api/test/auth-login.e2e-spec.ts`                              | created                 |
| `docs/lessons/lesson-065-auth-login.md`                             | created                 |
| `docs/lessons/lesson-064-unique-email-friendly-conflict.md`         | changed — link to 065   |
| `docs/development-roadmap.md`                                       | changed — шаг 065 done  |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` | changed                 |
| `docs/LOCAL_SETUP.md`                                               | changed — next step 066 |

## Verification

- `npx nx run shared-contracts:build` — экспорт `LoginUserResponse`.
- `npx nx run api:test` — unit-тесты зелёные.
- `npx nx run api:test:e2e` — `auth-login.e2e-spec.ts` зелёный.
- `npx nx run api:lint` / `api:build` — без ошибок.

## TDD Sequence

- **Red/Green:** `auth.service.spec.ts` — моки `findByEmail` + `verify`, 401 с одним сообщением.
- **Green:** `AuthService.login`, DTO, controller.
- **Refactor:** общий `toPublicUserResponse`; e2e на моках без Postgres.

## Definition of Done

- [x] `POST /api/v1/auth/login` → `200` + `LoginUserResponse`.
- [x] Неверные credentials → `401` `UNAUTHORIZED`, одно сообщение для unknown user и wrong password.
- [x] Невалидное тело → `VALIDATION_FAILED` (400).
- [x] `passwordHash` не в HTTP-ответе.
- [x] Unit `auth.service.spec.ts` в том же change set, что production-код.
- [x] Документация синхронизирована.

## What To Remember

- Не раскрывать, существует ли email — одна константа для обоих 401.
- `PasswordHasherService` уже экспортируется из `UsersModule` — `AuthModule` менять не нужно.
- Следующий шаг 066 — JWT access token: [development-roadmap.md](../development-roadmap.md).

## Verify

```bash
npx nx run shared-contracts:build
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint
npx nx run api:build
```

## Homework

Почему login возвращает `200`, а register — `201`? Когда бы вы вернули `204` для login?
