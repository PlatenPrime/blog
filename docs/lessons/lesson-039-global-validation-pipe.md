# Lesson 039: Global ValidationPipe (whitelist, transform, forbidNonWhitelisted)

## Learning Goal

Подключить глобальный NestJS `ValidationPipe` в [`apps/api`](../../apps/api) с `whitelist`, `transform` и `forbidNonWhitelisted`, маппить ошибки валидации в `ApiErrorBody` с `VALIDATION_FAILED` и `details`, и проверить поведение e2e smoke на временном эндпоинте.

## Implementation Scope

В скоупе:

- Зависимости `class-validator`, `class-transformer` в [`apps/api/package.json`](../../apps/api/package.json).
- [`apps/api/src/config/create-api-validation-pipe.ts`](../../apps/api/src/config/create-api-validation-pipe.ts) — фабрика pipe + `exceptionFactory` с `details`.
- [`apps/api/src/errors/map-class-validator-errors.ts`](../../apps/api/src/errors/map-class-validator-errors.ts) — `ValidationError[]` → `ApiErrorDetails`.
- Расширение [`map-exception-to-api-error.ts`](../../apps/api/src/errors/map-exception-to-api-error.ts) — `VALIDATION_FAILED` при наличии `details`.
- Регистрация через `APP_PIPE` в [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts).
- Smoke: [`ValidationModule`](../../apps/api/src/validation/validation.module.ts), `POST /validation-smoke`.
- E2e в [`apps/api/test/app.e2e-spec.ts`](../../apps/api/test/app.e2e-spec.ts).
- Документация: этот урок, [`docs/development-roadmap.md`](../development-roadmap.md), [`docs/learning-path.md`](../learning-path.md), [`docs/README.md`](../README.md).

Намеренно **не** делаем:

- DTO-конвенции и полноценный sample resource — [шаг 040](../development-roadmap.md).
- `requestId` в envelope — шаги 043–046.
- `problem+json` — [шаг 041](../development-roadmap.md).
- Contract-тесты JSON shape — [шаг 054](../development-roadmap.md).

## Dependencies

- Шаг 037 — `API_ERROR_CODE_VALIDATION`, `ApiValidationFieldError`, `ApiErrorDetails` в `shared-contracts`.
- Шаг 038 — `ApiExceptionFilter` и маппинг `HttpException` → `ApiErrorBody`.

## Step-by-Step Changes

1. Добавить `class-validator` и `class-transformer`; реализовать `map-class-validator-errors.ts` + unit-тесты.
2. Реализовать `create-api-validation-pipe.ts` и зарегистрировать `APP_PIPE` в `AppModule`.
3. Расширить `map-exception-to-api-error.ts` для `VALIDATION_FAILED` + `details`; unit-тесты.
4. Добавить `ValidationModule` с `POST /validation-smoke` и DTO (`@Type`, `@IsInt`, `@Min`).
5. **Verify.** `npx nx run api:test:e2e` — validation smoke; `npx nx run api:test` — unit без регрессии.
6. **Docs.** Урок 039, baseline roadmap, learning-path, docs README.

## Code Example

```typescript
export function createApiValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new BadRequestException({
        message: 'Validation failed',
        details: mapClassValidatorErrors(errors),
      }),
  });
}
```

## Context

После 038 ошибки приложения отдают единый envelope, но тела запросов не валидировались глобально. `ValidationPipe` закрывает платформенный слой входной валидации; filter из 038 сериализует `BadRequestException` с `details` как `VALIDATION_FAILED`.

## Architecture Notes

- **`APP_PIPE` в `AppModule`:** как `APP_FILTER` — подхватывается в unit/e2e без дублирования в `main.ts`.
- **`whitelist` + `forbidNonWhitelisted`:** лишние поля → 400, а не тихий strip.
- **`transform`:** строковые числа в JSON приводятся к типам DTO (`@Type(() => Number)`).
- **`exceptionFactory`:** единый формат `{ message, details }` для mapper; обычные `BadRequestException` без `details` остаются `BAD_REQUEST`.
- **Smoke-эндпоинт:** временный до шага 040 (sample resource + конвенции).

## Changed Files

| Файл                                                                     | Действие |
| ------------------------------------------------------------------------ | -------- |
| `apps/api/package.json`                                                  | изменён  |
| `apps/api/src/config/create-api-validation-pipe.ts`                      | создан   |
| `apps/api/src/errors/map-class-validator-errors.ts`                      | создан   |
| `apps/api/src/errors/map-class-validator-errors.spec.ts`                 | создан   |
| `apps/api/src/errors/map-exception-to-api-error.ts`                      | изменён  |
| `apps/api/src/errors/map-exception-to-api-error.spec.ts`                 | изменён  |
| `apps/api/src/validation/validation-smoke.dto.ts`                        | создан   |
| `apps/api/src/validation/validation-smoke.controller.ts`                 | создан   |
| `apps/api/src/validation/validation.module.ts`                           | создан   |
| `apps/api/src/app.module.ts`                                             | изменён  |
| `apps/api/test/app.e2e-spec.ts`                                          | изменён  |
| `docs/lessons/lesson-039-global-validation-pipe.md`                      | создан   |
| `docs/development-roadmap.md`, `docs/learning-path.md`, `docs/README.md` | шаг 039  |

## Verification

```bash
npx nx run api:test:e2e
```

Ожидание:

- `POST /validation-smoke` с `{}` → 400, `code: VALIDATION_FAILED`, непустой `details`.
- `POST` с `{ "count": "3" }` → 200, `{ "count": 3 }`.
- `POST` с `{ "count": 1, "extra": "x" }` → 400 (forbidNonWhitelisted).
- `GET /`, `/health`, CORS — без регрессии.

```bash
npx nx run api:test
```

Unit-тесты mapper и `map-class-validator-errors` зелёные.

## Definition of Done

- [x] Глобальный `ValidationPipe`: `whitelist`, `transform`, `forbidNonWhitelisted`.
- [x] Ошибки валидации → 400 + `VALIDATION_FAILED` + `details[]`.
- [x] Unit-тесты mapper + `map-class-validator-errors`.
- [x] E2e smoke validation + регрессия health/CORS.
- [x] Урок 039 и индексы roadmap/learning-path/docs README обновлены.

## What To Remember

- Валидация входа — `APP_PIPE`; сериализация ошибок — `APP_FILTER` из 038.
- `details` — только для validation envelope; прочие 400 — `BAD_REQUEST`.
- Smoke `POST /validation-smoke` — до sample resource в шаге 040.

## Verify

```bash
npx nx run api:test:e2e
```
