# Lesson 043: Request ID middleware + AsyncLocalStorage context

## Learning Goal

Дать каждому HTTP-запросу стабильный идентификатор: принять валидный `X-Request-Id` от клиента или сгенерировать UUID, сохранить в `AsyncLocalStorage` и вернуть в заголовке ответа; при ошибках прокинуть `requestId` в envelope (`instance` в `problem+json`).

## Implementation Scope

В скоупе:

- [`apps/api/src/common/request-context/`](../../apps/api/src/common/request-context/) — ALS store, `resolveRequestId`, `RequestIdMiddleware`, `RequestContextModule`.
- [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts) — `MiddlewareConsumer` для всех маршрутов.
- [`apps/api/src/errors/map-exception-to-api-error.ts`](../../apps/api/src/errors/map-exception-to-api-error.ts) — опциональный `requestId` в `ApiErrorBody`.
- [`apps/api/src/errors/api-exception.filter.ts`](../../apps/api/src/errors/api-exception.filter.ts) — чтение ID из `RequestContextStore`.
- Unit + e2e тесты; документация.

Намеренно **не** делаем:

- `X-Correlation-Id` — [шаг 046](../development-roadmap.md).
- Structured logging — [шаг 044](./lesson-044-structured-logging.md); request logging interceptor — [шаг 045](../development-roadmap.md).
- Redaction в логах — [шаг 047](../development-roadmap.md).
- `nestjs-cls` — нативный `AsyncLocalStorage` достаточен.

## Dependencies

- Шаги 037–041 — `ApiErrorBody.requestId`, Problem Details `instance`.
- Шаг 042 — безопасные 5xx (не меняем политику сообщений).

## Step-by-Step Changes

1. Добавить `RequestContextStore` (`AsyncLocalStorage`) и pure `resolveRequestId`.
2. Реализовать `RequestIdMiddleware`: заголовок ответа + `run()` ALS.
3. Зарегистрировать middleware в `AppModule.configure('*')`.
4. Прокинуть `requestId` в `mapExceptionToApiError` и `ApiExceptionFilter`.
5. **Verify.** `npx nx run api:test`, `npm run test:e2e` в `apps/api`.
6. **Docs.** Урок 043, roadmap, learning-path, docs README, storytelling.

## Code Example

```typescript
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = resolveRequestId(req.headers[REQUEST_ID_HEADER]);
    res.setHeader(REQUEST_ID_RESPONSE_HEADER, requestId);
    this.requestContextStore.run({ requestId }, () => next());
  }
}
```

## Context

После 041–042 клиент получает `problem+json`, но без сквозного ID нельзя связать ответ с логами. Контракт уже имел `requestId` → `instance`; шаг 043 подключает runtime: middleware + ALS + заголовок `X-Request-Id`.

## Architecture Notes

- **Incoming:** `x-request-id`, trim, 1–128 символов, `[A-Za-z0-9._-]`; иначе `randomUUID()`.
- **Response:** `X-Request-Id` на всех маршрутах (включая `/health`).
- **ALS:** `RequestContextStore.run()` оборачивает весь request pipeline; `getRequestId()` доступен фильтрам и сервисам.
- **Errors:** `requestId` в `ApiErrorBody` → `instance` в Problem Details (без изменения mapper problem details).

## Changed Files

| Файл                                                | Действие |
| --------------------------------------------------- | -------- |
| `apps/api/src/common/request-context/*`             | создано  |
| `apps/api/src/app.module.ts`                        | изменён  |
| `apps/api/src/errors/map-exception-to-api-error.ts` | изменён  |
| `apps/api/src/errors/api-exception.filter.ts`       | изменён  |
| `apps/api/test/request-id.e2e-spec.ts`              | создан   |
| `docs/lessons/lesson-043-request-id-middleware.md`  | создан   |

## Verification

```bash
npx nx run api:test
cd apps/api && npm run test:e2e
```

Ожидание:

- `GET /` → заголовок `x-request-id` (UUID или echo клиента).
- `POST /examples` `{}` с `X-Request-Id` → тот же ID в заголовке и `instance` в problem body.

## Definition of Done

- [x] Middleware + ALS на всех маршрутах.
- [x] `X-Request-Id` в ответе.
- [x] `requestId` в error envelope при наличии контекста.
- [x] Unit + e2e тесты зелёные.
- [x] Урок 043 и индексы roadmap/learning-path/docs README обновлены.

## What To Remember

- Middleware только через `AppModule` — e2e не использует `main.ts`.
- Correlation ID и structured logs — следующие шаги Track 1.
- Валидация incoming ID не отклоняет запрос — только подменяет на UUID.

## Verify

```bash
npx nx run api:test
```
