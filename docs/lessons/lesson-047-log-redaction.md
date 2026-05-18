# Lesson 047: Redact sensitive fields in logs

## Learning Goal

Настроить pino `redact`, чтобы пароли, токены и HTTP-заголовки с секретами не попадали в JSON-логи — ни в ручных `logger.info({ ... })`, ни в bindings от `pino-http` (`req.headers.*`). Проверка — unit-тесты на сериализованную строку лога.

## Implementation Scope

В скоупе:

- [`apps/api/src/common/logging/pino-redact.paths.ts`](../../apps/api/src/common/logging/pino-redact.paths.ts) — список путей и placeholder `[Redacted]`.
- [`apps/api/src/common/logging/create-pino-options.ts`](../../apps/api/src/common/logging/create-pino-options.ts) — `redact` в опциях pino.
- [`apps/api/src/common/logging/log-redaction.spec.ts`](../../apps/api/src/common/logging/log-redaction.spec.ts) — unit-тесты redaction.

Намеренно **не** делаем:

- Логирование query string / body в access-log — по-прежнему не логируем (см. [шаг 045](./lesson-045-request-logging-interceptor.md)).
- OpenTelemetry wiring — [шаг 048](./lesson-048-opentelemetry-noop.md); trace propagation — [шаг 049](./lesson-049-trace-context-propagation.md).
- Кастомные serializers для `req`/`res` — redact достаточен для текущего объёма.

## Dependencies

- [Шаг 044](./lesson-044-structured-logging.md) — `createPinoOptions`, JSON shape.
- [Шаг 045](./lesson-045-request-logging-interceptor.md) — access-log без headers/body.
- [Шаг 046](./lesson-046-correlation-id.md) — mixin `requestId` / `correlationId` (не редактируются).

## Step-by-Step Changes

1. Вынести `LOG_REDACT_PATHS` и `LOG_REDACT_CENSOR` в отдельный модуль.
2. Подключить `redact: { paths, censor }` в `createPinoOptions` (применяется и к `pinoHttp` в `LoggingModule`).
3. Unit-тесты: top-level и nested `password`, `req.headers.authorization` / `cookie`, токены Track 2, контроль что `access` / `requestId` не трогаются.
4. **Verify.** `npx nx run api:test`, `npx nx run api:lint`.
5. **Docs.** Урок 047, roadmap, learning-path, docs README, storytelling.

## Code Example

```typescript
export const LOG_REDACT_CENSOR = '[Redacted]';

export const LOG_REDACT_PATHS = [
  'password',
  '*.password',
  'req.headers.authorization',
  'req.headers.cookie',
  // ...
] as const;

// createPinoOptions
redact: {
  paths: [...LOG_REDACT_PATHS],
  censor: LOG_REDACT_CENSOR,
},
```

## Context

Structured logging (044–046) уже даёт `requestId`, `correlationId` и access-log без query/body. `pino-http` middleware всё ещё может прикрепить `req` к логгеру; разработчики могут случайно залогировать объект с `password` или `authorization`. Redact на уровне pino — последняя линия обороны перед агрегаторами (Loki, ELK) и подготовкой к auth (Track 2).

## Architecture Notes

- **Единый список путей** — один модуль, используется только в `createPinoOptions`; при добавлении auth расширяем `LOG_REDACT_PATHS`.
- **Censor** — фиксированная строка `[Redacted]`, не пустая (пустое значение легко спутать с «поля не было»).
- **Access-log** — payload по-прежнему только `access.{method,url,statusCode,responseTime}`; redact не заменяет дисциплину «не логировать лишнее».
- **Ошибки** — политика 5xx без stack в JSON ответа ([042](./lesson-042-safe-unknown-errors.md)); stack в `err` в логах допустим для отладки.

## Changed Files

| Файл                                                 | Действие |
| ---------------------------------------------------- | -------- |
| `apps/api/src/common/logging/pino-redact.paths.ts`   | создан   |
| `apps/api/src/common/logging/create-pino-options.ts` | изменён  |
| `apps/api/src/common/logging/log-redaction.spec.ts`  | создан   |
| `docs/lessons/lesson-047-log-redaction.md`           | создан   |

## Verification

```bash
npx nx run api:test
npx nx run api:lint
```

Ожидание unit-тестов `log-redaction.spec.ts`:

- Секретные значения отсутствуют в сериализованной строке JSON.
- Redacted-поля равны `[Redacted]`.
- `requestId`, `access` остаются без изменений.

## Definition of Done

- [x] pino `redact` подключён через `createPinoOptions`.
- [x] Unit-тесты redaction зелёные.
- [x] `api:test` и `api:lint` зелёные.
- [x] Урок 047 и индексы roadmap/learning-path/docs README/storytelling обновлены.

## What To Remember

- Redact — страховка, не повод логировать body/headers в access-log.
- Новые секретные поля (например `idToken`) — добавляй в `LOG_REDACT_PATHS`, не размазывай по коду.
- Wildcard `*.password` нужен для вложенных объектов (`user.password`).

## Verify

```bash
npx nx run api:test
```
