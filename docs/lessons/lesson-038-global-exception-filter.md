# Lesson 038: Global exception filter + HTTP error mapping

## Learning Goal

Подключить глобальный NestJS exception filter в [`apps/api`](../../apps/api), который преобразует `HttpException` и неизвестные ошибки в JSON-контракт `ApiErrorBody` из [`@blog/shared-contracts`](../../libs/shared-contracts), сохраняя нативный Terminus JSON для health probes.

## Implementation Scope

В скоупе:

- [`apps/api/src/errors/map-exception-to-api-error.ts`](../../apps/api/src/errors/map-exception-to-api-error.ts) — маппинг `HttpException` / unknown → `{ status, body: ApiErrorBody }`.
- [`apps/api/src/errors/api-exception.filter.ts`](../../apps/api/src/errors/api-exception.filter.ts) — `@Catch()` filter, `HttpAdapterHost`, логирование неизвестных ошибок.
- Регистрация через `APP_FILTER` в [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts).
- Unit-тесты mapper и filter.
- Документация: этот урок, [`docs/development-roadmap.md`](../development-roadmap.md), [`docs/learning-path.md`](../learning-path.md), [`docs/README.md`](../README.md).

Намеренно **не** делаем:

- `ValidationPipe` и `details` для полей — [шаг 039](../development-roadmap.md).
- `requestId` в envelope — шаги 043–046.
- Расширенная политика unknown errors без stack leak — [шаг 042 / lesson-042](./lesson-042-safe-unknown-errors.md).
- Contract-тесты JSON shape — [шаг 054](../development-roadmap.md).
- `problem+json` — [шаг 041](../development-roadmap.md).

## Dependencies

- Шаг 037 — `ApiErrorBody`, `API_ERROR_CODE_*` в `shared-contracts`.
- Шаги 034–035 — Terminus `/health`, `/health/ready` (filter пропускает `HealthCheckError`).

## Step-by-Step Changes

1. Добавить unit-тесты и реализацию `map-exception-to-api-error.ts`.
2. Добавить unit-тесты и реализацию `api-exception.filter.ts` (rethrow `HealthCheckError`).
3. Зарегистрировать `ApiExceptionFilter` через `APP_FILTER` в `AppModule`.
4. **Verify.** `npx nx run api:test` → mapper + filter specs зелёные; e2e health без регрессии.
5. **Docs.** Урок 038, baseline roadmap, learning-path, docs README.

## Code Example

```typescript
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    if (exception instanceof HealthCheckError) {
      throw exception;
    }
    const { status, body } = mapExceptionToApiError(exception);
    httpAdapter.reply(response, body, status);
  }
}
```

## Context

После 037 типы ошибок живут в `shared-contracts`, но API отдавал стандартный Nest JSON (`statusCode`, `message`, `error`). Filter закрывает разрыв: единый envelope для ошибок приложения, HTTP status в status line.

## Architecture Notes

- **`APP_FILTER` в `AppModule`:** подхватывается в unit/e2e без дублирования в `main.ts` (в отличие от CORS через `enableApiCors`).
- **HTTP status не в body:** как в контракте 037; filter выставляет status через `httpAdapter.reply`.
- **`HealthCheckError`:** rethrow, чтобы Terminus сохранил JSON probes (`/health`, `/health/ready`).
- **Unknown errors:** 500 + `INTERNAL_ERROR` + generic message; stack только в server log, не в JSON.
- **`details` / `requestId`:** отложены на 039–040 и 043–046.

## Changed Files

| Файл                                                                     | Действие |
| ------------------------------------------------------------------------ | -------- |
| `apps/api/src/errors/map-exception-to-api-error.ts`                      | создан   |
| `apps/api/src/errors/map-exception-to-api-error.spec.ts`                 | создан   |
| `apps/api/src/errors/api-exception.filter.ts`                            | создан   |
| `apps/api/src/errors/api-exception.filter.spec.ts`                       | создан   |
| `apps/api/src/app.module.ts`                                             | изменён  |
| `docs/lessons/lesson-038-global-exception-filter.md`                     | создан   |
| `docs/development-roadmap.md`, `docs/learning-path.md`, `docs/README.md` | шаг 038  |

## Verification

```bash
npx nx run api:test
```

Ожидание:

- 38+ unit-тестов проходят (включая mapper и filter specs).
- Mapper: `NotFoundException` → 404 `NOT_FOUND`; unknown `Error` → 500 `INTERNAL_ERROR`.
- Filter: `HealthCheckError` rethrow; envelope без `stack` в body.

Опционально:

```bash
npx nx run api:test:e2e
```

Health e2e (`/health`, `/health/ready`) остаются зелёными.

## Definition of Done

- [x] `ApiExceptionFilter` зарегистрирован через `APP_FILTER`.
- [x] Ошибки приложения отдают `ApiErrorBody`; HTTP status в заголовке.
- [x] `HealthCheckError` не заменяется на envelope.
- [x] Unit-тесты mapper + filter.
- [x] `npx nx run api:test` успешен.
- [x] Урок 038 и индексы roadmap/learning-path/docs README обновлены.

## What To Remember

- Envelope: `code` + `message`; status line — источник HTTP status.
- Health probes — исключение из envelope (Terminus JSON).
- Validation `details` — шаг 039; `requestId` — шаги 043–046.

## Verify

```bash
npx nx run api:test
```
