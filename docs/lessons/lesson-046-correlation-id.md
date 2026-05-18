# Lesson 046: Correlation ID in response headers

## Learning Goal

Добавить `X-Correlation-Id` в ответ API: принять валидный заголовок от клиента или использовать тот же ID, что `X-Request-Id`; сохранить в `AsyncLocalStorage` и прокинуть в JSON-логи через pino mixin. `instance` в `problem+json` по-прежнему остаётся `requestId`.

## Implementation Scope

В скоупе:

- [`apps/api/src/common/request-context/incoming-trace-id.ts`](../../apps/api/src/common/request-context/incoming-trace-id.ts) — общая нормализация и валидация trace id.
- [`apps/api/src/common/request-context/correlation-id.constants.ts`](../../apps/api/src/common/request-context/correlation-id.constants.ts) — имена заголовков.
- [`apps/api/src/common/request-context/resolve-correlation-id.ts`](../../apps/api/src/common/request-context/resolve-correlation-id.ts) — resolver с fallback на `requestId`.
- [`apps/api/src/common/request-context/request-id.middleware.ts`](../../apps/api/src/common/request-context/request-id.middleware.ts) — второй заголовок ответа + ALS.
- [`apps/api/src/common/logging/create-pino-options.ts`](../../apps/api/src/common/logging/create-pino-options.ts) — `correlationId` в mixin.
- [`apps/api/test/correlation-id.e2e-spec.ts`](../../apps/api/test/correlation-id.e2e-spec.ts) — e2e сценарии.
- Unit-тесты resolver, middleware, structured log shape.

Намеренно **не** делаем:

- Redaction секретов в логах — [шаг 047](../development-roadmap.md).
- OpenTelemetry / trace propagation — [шаги 048–049](../development-roadmap.md).
- `exposedHeaders` в CORS — когда web начнёт читать заголовки cross-origin.
- Замену `instance` в Problem Details на correlation id.

## Dependencies

- [Шаг 043](./lesson-043-request-id-middleware.md) — `X-Request-Id`, ALS, middleware.
- [Шаг 044](./lesson-044-structured-logging.md) — pino mixin.
- [Шаг 045](./lesson-045-request-logging-interceptor.md) — access-log через `PinoLogger` (получает mixin автоматически).

## Step-by-Step Changes

1. Вынести `normalizeIncomingHeader` и `isValidTraceId` в `incoming-trace-id.ts`; упростить `resolve-request-id.ts`.
2. Добавить константы и `resolveCorrelationId(incoming, requestId)`.
3. Расширить `RequestContext`, store, middleware — оба заголовка в ответе.
4. Добавить `correlationId` в pino mixin.
5. E2e: fallback = request id, echo клиента, `instance` = request id на 400.
6. **Verify.** `npx nx run api:test`, `npx nx run api:test:e2e`, `npx nx run api:lint`.
7. **Docs.** Урок 046, roadmap, learning-path, docs README, storytelling.

## Code Example

```typescript
const requestId = resolveRequestId(req.headers[REQUEST_ID_HEADER]);
const correlationId = resolveCorrelationId(
  req.headers[CORRELATION_ID_HEADER],
  requestId,
);
res.setHeader(REQUEST_ID_RESPONSE_HEADER, requestId);
res.setHeader(CORRELATION_ID_RESPONSE_HEADER, correlationId);
this.requestContextStore.run({ requestId, correlationId }, () => next());
```

## Context

`requestId` идентифицирует один HTTP-запрос; `correlationId` — бизнес-операцию, которую клиент может пронести через несколько вызовов (подготовка к трейсам). В монолите без клиентского заголовка correlation id совпадает с request id — одна нить для поддержки.

## Architecture Notes

- **Incoming:** `x-correlation-id`, те же правила валидации, что у request id (1–128, `[A-Za-z0-9._-]`).
- **Response:** `X-Correlation-Id` на всех маршрутах.
- **Fallback:** невалидный или отсутствующий заголовок → значение `requestId` (не новый UUID).
- **ALS:** `{ requestId, correlationId }` в store; access-log и structured logs получают оба поля из mixin.
- **Errors:** `instance` в problem+json = `requestId` (без изменений).

## Changed Files

| Файл                                                              | Действие |
| ----------------------------------------------------------------- | -------- |
| `apps/api/src/common/request-context/incoming-trace-id.ts`        | создан   |
| `apps/api/src/common/request-context/correlation-id.constants.ts` | создан   |
| `apps/api/src/common/request-context/resolve-correlation-id.ts`   | создан   |
| `apps/api/src/common/request-context/resolve-request-id.ts`       | изменён  |
| `apps/api/src/common/request-context/request-id.middleware.ts`    | изменён  |
| `apps/api/src/common/request-context/request-context.*`           | изменён  |
| `apps/api/src/common/logging/create-pino-options.ts`              | изменён  |
| `apps/api/test/correlation-id.e2e-spec.ts`                        | создан   |
| `docs/lessons/lesson-046-correlation-id.md`                       | создан   |

## Verification

```bash
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint
```

Ожидание e2e:

- `GET /` без заголовков → `x-correlation-id` === `x-request-id`.
- `GET /` с `X-Correlation-Id` → echo в ответе.
- `POST /examples` `{}` с обоими заголовками → correlation в заголовке, `instance` = request id.

## Definition of Done

- [x] `X-Correlation-Id` в ответе на всех маршрутах.
- [x] Fallback correlation id = request id.
- [x] `correlationId` в ALS и JSON-логах.
- [x] Unit + e2e тесты зелёные.
- [x] Урок 046 и индексы roadmap/learning-path/docs README/storytelling обновлены.

## What To Remember

- Correlation id и request id — разные смыслы; в монолите без клиентского заголовка они совпадают.
- Не подменяй `instance` в problem+json на correlation id — support цитирует request id из ошибки.
- Общая валидация trace id в `incoming-trace-id.ts` — не дублируй regex.

## Verify

```bash
npx nx run api:test:e2e
```
