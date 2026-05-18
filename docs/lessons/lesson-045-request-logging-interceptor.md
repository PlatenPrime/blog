# Lesson 045: Request logging interceptor

## Learning Goal

Добавить HTTP access-log через глобальный Nest interceptor: одна JSON-строка на запрос с методом, путём (без query), статусом и временем ответа; уровень лога по статусу; `requestId` по-прежнему из mixin ALS (шаг 044). `pino-http` autoLogging остаётся выключенным.

## Implementation Scope

В скоупе:

- [`apps/api/src/common/logging/build-request-log-payload.ts`](../../apps/api/src/common/logging/build-request-log-payload.ts) — pure-хелперы payload, уровня, длительности.
- [`apps/api/src/common/logging/request-logging.interceptor.ts`](../../apps/api/src/common/logging/request-logging.interceptor.ts) — `RequestLoggingInterceptor`.
- [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts) — `APP_INTERCEPTOR`.
- Unit-тесты interceptor и payload.

Намеренно **не** делаем:

- Redaction `Authorization`, query, body в логах — [шаг 047](../development-roadmap.md).
- `X-Correlation-Id` — [шаг 046](../development-roadmap.md).
- `pinoHttp.autoLogging: true` — access-log под нашим контролем в interceptor.

## Dependencies

- [Шаг 043](./lesson-043-request-id-middleware.md) — ALS + `requestId` в ответе.
- [Шаг 044](./lesson-044-structured-logging.md) — `nestjs-pino`, `autoLogging: false`.

## Step-by-Step Changes

1. Реализовать `buildRequestLogPayload`, `resolveRequestLogLevel`, `elapsedMilliseconds`.
2. Реализовать `RequestLoggingInterceptor` (`tap` / `catchError`, только HTTP).
3. Зарегистрировать `APP_INTERCEPTOR` в `AppModule`.
4. Unit-тесты полей `access` и маппинга статус → уровень.
5. **Verify.** `npx nx run api:test`, `npx nx run api:lint`, `cd apps/api && npm run test:e2e`; ручной `curl` к API — строка `request completed` в stdout.
6. **Docs.** Урок 045, roadmap, learning-path, docs README, storytelling.

## Code Example

```typescript
return next.handle().pipe(
  tap(() => {
    this.logRequest({
      method: request.method,
      path: request.path,
      statusCode: response.statusCode,
      startedAt,
    });
  }),
  catchError((error: unknown) => {
    const statusCode = error instanceof HttpException ? error.getStatus() : 500;
    this.logRequest({
      method: request.method,
      path: request.path,
      statusCode,
      startedAt,
    });
    return throwError(() => error);
  }),
);
```

## Context

Шаг 044 дал JSON-логи и `requestId` в mixin, но отложил access-log (`autoLogging: false`). Шаг 045 добавляет предсказуемую строку на каждый HTTP-запрос для Loki/ELK и поддержки.

## Architecture Notes

- **Поля access-log:** объект `access` с `method`, `url` (Express `path`, без query), `statusCode`, `responseTime` (ms). Ключ `access` вместо `req`/`res` — чтобы не пересекаться с сериализаторами `pino-http` (иначе `res.statusCode` в JSON может быть `null`).
- **Уровень:** `info` (&lt;400), `warn` (4xx), `error` (5xx).
- **Ошибки:** статус из `HttpException.getStatus()` или `500` до exception filter — достаточно для access-log.
- **pino-http:** по-прежнему может добавлять свой `req` в bindings логгера; redaction — шаг 047.

## Changed Files

| Файл                                                         | Действие          |
| ------------------------------------------------------------ | ----------------- |
| `apps/api/src/common/logging/build-request-log-payload.ts`   | создан            |
| `apps/api/src/common/logging/request-logging.interceptor.ts` | создан            |
| `apps/api/src/common/logging/*.spec.ts`                      | создан            |
| `apps/api/src/common/logging/index.ts`                       | экспорт           |
| `apps/api/src/app.module.ts`                                 | `APP_INTERCEPTOR` |
| `docs/lessons/lesson-045-request-logging-interceptor.md`     | создан            |

## Verification

```bash
npx nx run api:test
npx nx run api:lint
cd apps/api && npm run test:e2e
```

Ручная проверка (API запущен на порту из env):

```bash
curl -s http://localhost:4000/ -o /dev/null
```

Ожидание в stdout: JSON с `"msg":"request completed"`, `"access":{"method":"GET","url":"/","statusCode":200,"responseTime":...}`, `"requestId":"..."`.

## Definition of Done

- [x] Глобальный interceptor пишет access-log на HTTP-запросы через `PinoLogger`.
- [x] `autoLogging` остаётся `false`.
- [x] Unit-тесты и `api:test` / `api:lint` зелёные.
- [x] Урок 045 и индексы roadmap/learning-path/docs README/storytelling обновлены.

## What To Remember

- Логировать после обработки (`tap` / `catchError`), не в начале запроса.
- Не логировать headers/body до redaction (047).
- Избегать ключей `req`/`res` в payload при активном `pino-http` — используй нейтральный объект (`access`).

## Verify

```bash
npx nx run api:test
```
