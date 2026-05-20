# Lesson 064: Unique email + friendly CONFLICT

## Learning Goal

Закрыть **дубликат email при регистрации**: нормализация адреса в доменном слое, предсказуемый **409 CONFLICT** (problem+json) вместо 500 от Postgres, и защита от гонки двух параллельных `register` через маппинг `23505`.

## Implementation Scope

В скоупе:

- [`apps/api/src/users/normalize-user-email.ts`](../../apps/api/src/users/normalize-user-email.ts) — `trim` + `toLowerCase`.
- [`apps/api/src/users/user-email.constants.ts`](../../apps/api/src/users/user-email.constants.ts) — сообщение и имя constraint.
- [`apps/api/src/database/is-postgres-unique-violation.ts`](../../apps/api/src/database/is-postgres-unique-violation.ts) — распознавание `QueryFailedError` / `23505`.
- [`apps/api/src/users/user.service.ts`](../../apps/api/src/users/user.service.ts) — проверка перед `save`, `catch` на гонку.
- Unit specs: `normalize-user-email.spec.ts`, `is-postgres-unique-violation.spec.ts`, расширенный `user.service.spec.ts`.
- [`apps/api/test/auth-register.e2e-spec.ts`](../../apps/api/test/auth-register.e2e-spec.ts) — сценарий 409 при `ConflictException` из `UserService`.

Намеренно **не** делаем:

- `POST /auth/login`, JWT — [шаг 065](../development-roadmap.md).
- Миграция `UNIQUE (lower(email))` / CITEXT — application-level нормализация достаточна для Track 2.
- Изменения `shared-contracts` — код `CONFLICT` уже есть с Track 1.

## Dependencies

- [Шаг 060](./lesson-060-user-entity-indexes.md) — `UQ_users_email`.
- [Шаг 062](./lesson-062-user-service-create-find-by-email.md) — `UserService.create` / `findByEmail`.
- [Шаг 063](./lesson-063-auth-register-dto.md) — `POST /auth/register`.
- [Шаг 038](./lesson-038-global-exception-filter.md) — `ConflictException` → problem+json.

## Step-by-Step Changes

1. **Red:** unit-тесты на `normalizeUserEmail`, `isPostgresUniqueViolation`, duplicate/race в `user.service.spec.ts`.
2. Реализовать хелперы и константы сообщения.
3. Обновить `UserService`: нормализация в `findByEmail` / `create`, проактивный `ConflictException`, `catch` `UQ_users_email`.
4. E2e: мок `UserService.create` → `ConflictException`, ожидание 409 + `CONFLICT`.
5. **Verify:** `nx run api:test`, `api:test:e2e`, `api:lint`, `api:build`.
6. Синхронизировать roadmap, storytelling, README, learning-path, LOCAL_SETUP.

## Context

После 063 повторный `POST /auth/register` с тем же email пробивал уникальный индекс и уходил в необработанный `QueryFailedError` → **500**. Клиенту нужен тот же конверт ошибок, что для validation и platform probes.

## Concept

**Два слоя защиты:** проактивная проверка `findByEmail` даёт понятное сообщение без round-trip к БД; реактивный `catch 23505` закрывает race, когда два запроса одновременно не нашли пользователя. Нормализация email в **одном месте** (`UserService`) готовит login (065) к case-insensitive сравнению.

## Code Changes

- `User@Example.com` и `user@example.com` считаются одним адресом.
- Ответ при дубликате: `409`, `code: CONFLICT`, `detail: Email is already registered`.
- `AuthService` не меняется — исключение всплывает в `ApiExceptionFilter`.

## Why This Matters

Без маппинга фронт не отличит «занят email» от сбоя сервера; тесты регистрации нестабильны. Переиспользуемый `isPostgresUniqueViolation` пригодится для slug/tag в Track 3.

## Architecture Notes

- **Constraint уже в 060:** шаг 064 не добавляет миграцию, только поведение приложения.
- **E2e без Postgres:** как в 063 — мок `UserService`; доменная логика — в unit `UserService`.
- **Сообщение в константе:** одна строка для unit, e2e и production.

## Changed Files

| File                                                                | Action                  |
| ------------------------------------------------------------------- | ----------------------- |
| `apps/api/src/users/normalize-user-email.ts`                        | created                 |
| `apps/api/src/users/normalize-user-email.spec.ts`                   | created                 |
| `apps/api/src/users/user-email.constants.ts`                        | created                 |
| `apps/api/src/database/is-postgres-unique-violation.ts`             | created                 |
| `apps/api/src/database/is-postgres-unique-violation.spec.ts`        | created                 |
| `apps/api/src/users/user.service.ts`                                | changed                 |
| `apps/api/src/users/user.service.spec.ts`                           | changed                 |
| `apps/api/test/auth-register.e2e-spec.ts`                           | changed                 |
| `docs/lessons/lesson-064-unique-email-friendly-conflict.md`         | created                 |
| `docs/lessons/lesson-063-auth-register-dto.md`                      | changed — link to 064   |
| `docs/development-roadmap.md`                                       | changed — шаг 064 done  |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` | changed                 |
| `docs/LOCAL_SETUP.md`                                               | changed — next step 065 |

## Verification

- `npx nx run api:test` — unit-тесты зелёные.
- `npx nx run api:test:e2e` — register conflict scenario зелёный.
- `npx nx run api:lint` / `api:build` — без ошибок.
- Опционально с Docker: два `POST /api/v1/auth/register` с `User@X.com` и `user@x.com` → 201, затем 409.

## TDD Sequence

- **Red:** specs на normalize, PG helper, duplicate + race в `UserService`.
- **Green:** production `UserService` + helpers.
- **Refactor:** e2e остаётся на моке; константа сообщения для DRY.

## Definition of Done

- [x] Повторный email → 409 `CONFLICT` + problem+json, не 500.
- [x] Email нормализуется (`trim` + lowercase) в `findByEmail` / `create`.
- [x] Гонка на `save` мапится в тот же `ConflictException`.
- [x] Unit `*.spec.ts` в том же change set, что `apps/api/src`.
- [x] E2e проверяет HTTP-конверт conflict.
- [x] Документация синхронизирована.

## What To Remember

- Уникальность на уровне БД (060) + дружелюбный ответ (064) — разные слои.
- Нормализация в `UserService`, не в DTO — login использует тот же путь.
- `isPostgresUniqueViolation` — общий хелпер для будущих unique constraints.
- Следующий шаг 065 — `POST /auth/login`.

## Verify

```bash
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint
npx nx run api:build
```

## Homework

Почему проактивная проверка не заменяет `catch 23505`? Опишите сценарий двух одновременных register с одним email.
