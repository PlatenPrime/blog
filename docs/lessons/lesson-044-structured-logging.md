# Lesson 044: Structured logging (nestjs-pino)

## Learning Goal

Подключить структурированное JSON-логирование в API через `nestjs-pino`: единый Nest `Logger`, стабильная схема полей (`level`, `time`, `msg`, `service`, `pid`), автоматическое поле `requestId` из `RequestContextStore` (ALS), настраиваемый `LOG_LEVEL` из env.

## Implementation Scope

В скоупе:

- [`apps/api/src/common/logging/`](../../apps/api/src/common/logging/) — `createPinoOptions`, глобальный `LoggingModule`, unit-тест формы JSON.
- [`apps/api/src/config/env.schema.ts`](../../apps/api/src/config/env.schema.ts) — `LOG_LEVEL`.
- [`.env.example`](../../.env.example) — `LOG_LEVEL=info`.
- [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts), [`main.ts`](../../apps/api/src/main.ts) — `LoggingModule`, `bufferLogs`, `app.useLogger`.
- [`apps/api/src/errors/api-exception.filter.ts`](../../apps/api/src/errors/api-exception.filter.ts) — `PinoLogger` для unknown errors (`err` object, не stack в HTTP body).

Намеренно **не** делаем:

- HTTP access-log / request logging interceptor — [шаг 045](../development-roadmap.md).
- `X-Correlation-Id` — [шаг 046](../development-roadmap.md).
- Redaction секретов в логах — [шаг 047](../development-roadmap.md).

## Dependencies

- [Шаг 043](./lesson-043-request-id-middleware.md) — `RequestContextStore` / ALS.
- [Шаг 042](./lesson-042-safe-unknown-errors.md) — политика 5xx без утечки stack в JSON ответа.

## Step-by-Step Changes

1. Установить `nestjs-pino` и `pino` в workspace `api`.
2. Добавить `LOG_LEVEL` в Zod `rootEnvSchema` и `.env.example`.
3. Реализовать `createPinoOptions` с `mixin()` → `requestId` из ALS.
4. `LoggingModule` — `LoggerModule.forRootAsync`, `pinoHttp.autoLogging: false` (access-log в 045).
5. Unit-тест `structured-log-json.spec.ts` — парсинг однострочного JSON.
6. Подключить в `AppModule` / `main.ts`; перевести `ApiExceptionFilter` на `PinoLogger`.
7. **Verify.** `npx nx run api:test`, `npx nx run api:test:e2e`, `npx nx run api:lint`.
8. **Docs.** Урок 044, roadmap, learning-path, docs README, storytelling.

## Code Example

```typescript
export function createPinoOptions({
  level,
  requestContextStore,
}: CreatePinoOptionsParams): LoggerOptions {
  return {
    level,
    base: { service: API_SERVICE_NAME, pid: process.pid },
    mixin() {
      const requestId = requestContextStore.getRequestId();
      return requestId ? { requestId } : {};
    },
  };
}
```

## Context

После 043 каждый запрос имеет `requestId`, но логи оставались текстовыми через встроенный Nest `Logger`. Шаг 044 даёт машиночитаемый JSON для агрегаторов и связывает логи с ID запроса через mixin — без HTTP access-log (это 045).

## Architecture Notes

- **Формат:** однострочный JSON в stdout; обязательные поля: `level`, `time`, `msg`, `service`, `pid`; `requestId` — когда ALS активен.
- **Уровень:** `LOG_LEVEL` из env (default `info`), валидируется Zod.
- **pino-http:** middleware подключён с `autoLogging: false` — только root logger и контекст; строки request/response — шаг 045.
- **Unknown errors:** `logger.error({ err }, 'Unhandled exception')` — stack в `err`, не в HTTP body (042).
- **Bootstrap:** `bufferLogs: true` + `app.useLogger(app.get(Logger))` из `nestjs-pino`.

## Changed Files

| Файл                                            | Действие                          |
| ----------------------------------------------- | --------------------------------- |
| `apps/api/package.json`                         | зависимости `nestjs-pino`, `pino` |
| `apps/api/src/common/logging/*`                 | создано                           |
| `apps/api/src/config/env.schema.ts`             | `LOG_LEVEL`                       |
| `.env.example`                                  | `LOG_LEVEL`                       |
| `apps/api/src/app.module.ts`                    | `LoggingModule`                   |
| `apps/api/src/main.ts`                          | pino Nest logger                  |
| `apps/api/src/errors/api-exception.filter.ts`   | `PinoLogger`                      |
| `docs/lessons/lesson-044-structured-logging.md` | создан                            |

## Verification

```bash
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint
```

Ожидание:

- `structured-log-json.spec.ts` — зелёный (форма JSON + `requestId` в ALS).
- Все существующие unit/e2e тесты — зелёные.

## Definition of Done

- [x] `nestjs-pino` подключён; JSON-логи с полями `service`, `pid`, опционально `requestId`.
- [x] `LOG_LEVEL` в env schema и `.env.example`.
- [x] Unit-тест формы JSON.
- [x] `ApiExceptionFilter` и bootstrap используют structured logger.
- [x] Урок 044 и индексы roadmap/learning-path/docs README обновлены.

## What To Remember

- Опции pino для приложения — внутри `pinoHttp` в `LoggerModule.forRootAsync` (не на верхнем уровне `Params`).
- `pinoHttp: false` в nestjs-pino не отключает middleware — используй `autoLogging: false`.
- Request/access logging — шаг 045; redaction — 047.

## Verify

```bash
npx nx run api:test
```
