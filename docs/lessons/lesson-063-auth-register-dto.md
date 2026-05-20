# Lesson 063: `POST /auth/register` + DTO

## Learning Goal

Открыть **первый HTTP-эндпоинт Track 2** для регистрации: валидируемый DTO на границе, тонкий `AuthService` над `UserService`, публичный тип ответа в `shared-contracts` — без утечки `passwordHash` и без дублирования доменной логики.

## Implementation Scope

В скоупе:

- [`libs/shared-contracts/src/auth/register.types.ts`](../../libs/shared-contracts/src/auth/register.types.ts) — `RegisterUserResponse`.
- [`apps/api/src/auth/`](../../apps/api/src/auth/) — `AuthModule`, `AuthController`, `AuthService`, `CreateRegisterBodyDto`.
- [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts) — импорт `AuthModule`.
- [`apps/api/src/auth/auth.service.spec.ts`](../../apps/api/src/auth/auth.service.spec.ts) — unit-тесты (tests-first gate).
- [`apps/api/test/auth-register.e2e-spec.ts`](../../apps/api/test/auth-register.e2e-spec.ts) — e2e с моком `UserService`.

Намеренно **не** делаем:

- Дубликат email → `CONFLICT` — [шаг 064](../development-roadmap.md).
- `POST /auth/login`, JWT, guards — [шаги 065+](../development-roadmap.md).
- Нормализация регистра email — 064+.

## Dependencies

- [Шаг 062](./lesson-062-user-service-create-find-by-email.md) — `UserService.create` / `findByEmail`.
- [Шаг 040](./lesson-040-dto-validation-conventions.md) — глобальный `ValidationPipe`, Problem Details.
- [Шаг 051](./lesson-051-api-prefix-and-versioning.md) — маршрут `POST /api/v1/auth/register`.

## Step-by-Step Changes

1. Добавить `RegisterUserResponse` в `shared-contracts` и экспорт из `index.ts`.
2. Создать `CreateRegisterBodyDto` (`email`, `password` с class-validator).
3. Реализовать `AuthService.register` → `UserService.create` → map в `RegisterUserResponse`.
4. `AuthController`: `@Post('register')`, `@HttpCode(201)`.
5. `AuthModule` + импорт в `AppModule`.
6. E2e: override `UserService`, сценарии validation + 201 happy path.
7. **Verify:** `nx run api:test`, `api:test:e2e`, `api:build`, `shared-contracts:build`.
8. Синхронизировать roadmap, storytelling, README, learning-path, LOCAL_SETUP.

## Context

После 062 создание пользователя доступно только внутри Nest DI. Фронт и контрактные тесты нуждаются в стабильном URL и JSON-форме ответа — это и есть 063.

## Concept

**Transport vs domain:** DTO описывает HTTP-вход; `UserService` — use-case; `RegisterUserResponse` — публичный контракт. Контроллер остаётся тонким, как у `examples`.

## Code Changes

- `POST /api/v1/auth/register` принимает `{ email, password }`, возвращает `{ id, email, createdAt, updatedAt }`.
- Пароль в ответе никогда не фигурирует; `passwordHash` только внутри сущности.

## Why This Matters

Без отдельного auth-слоя регистрация размазалась бы по контроллеру с прямым вызовом репозитория. E2e с моком `UserService` сохраняет быстрый CI без Postgres, как в unit-тестах 062.

## Architecture Notes

- **E2e и DataSource stub:** реальный `save` в e2e не работает — override `UserService`, как в `request-timeout.e2e-spec.ts`.
- **Дубликат email:** уникальный индекс из 060; до 064 ошибка БД не мапится в `CONFLICT`.

## Changed Files

| File                                                                | Action                  |
| ------------------------------------------------------------------- | ----------------------- |
| `libs/shared-contracts/src/auth/register.types.ts`                  | created                 |
| `libs/shared-contracts/src/index.ts`                                | changed — export type   |
| `apps/api/src/auth/auth.module.ts`                                  | created                 |
| `apps/api/src/auth/auth.controller.ts`                              | created                 |
| `apps/api/src/auth/auth.service.ts`                                 | created                 |
| `apps/api/src/auth/auth.service.spec.ts`                            | created                 |
| `apps/api/src/auth/dto/create-register-body.dto.ts`                 | created                 |
| `apps/api/src/app.module.ts`                                        | changed — AuthModule    |
| `apps/api/test/auth-register.e2e-spec.ts`                           | created                 |
| `docs/lessons/lesson-063-auth-register-dto.md`                      | created                 |
| `docs/lessons/lesson-062-user-service-create-find-by-email.md`      | changed — link to 063   |
| `docs/development-roadmap.md`                                       | changed — шаг 063 done  |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` | changed                 |
| `docs/LOCAL_SETUP.md`                                               | changed — next step 064 |

## Verification

- `npx nx run shared-contracts:build` — экспорт `RegisterUserResponse`.
- `npx nx run api:test` — unit-тесты зелёные.
- `npx nx run api:test:e2e` — `auth-register.e2e-spec.ts` зелёный.
- `npx nx run api:lint` / `api:build` — без ошибок.

## Definition of Done

- [x] `POST /api/v1/auth/register` → `201` + `RegisterUserResponse`.
- [x] Невалидное тело → `VALIDATION_FAILED` (400, problem+json).
- [x] `passwordHash` не в HTTP-ответе.
- [x] E2e без Postgres (мок `UserService`).
- [x] Документация синхронизирована.

## What To Remember

- DTO поле `password` → `plainPassword` только в `AuthService` при вызове `UserService`.
- Ответные типы — в `shared-contracts`; валидаторы — только в API DTO.
- Следующий шаг 064 — дружелюбный `CONFLICT` при дубликате email.

## Verify

```bash
npx nx run shared-contracts:build
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint
npx nx run api:build
```

## Homework

Сравнить e2e регистрации с e2e `examples`: какие проверки Problem Details общие, что специфично для auth.
