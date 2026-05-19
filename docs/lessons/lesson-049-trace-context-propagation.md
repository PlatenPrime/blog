# Lesson 049: Trace context propagation for incoming HTTP

## Learning Goal

Продолжить distributed tracing в API: извлекать W3C `traceparent` из входящих HTTP-запросов, держать active span на время обработки (AsyncLocalStorage + propagator) и создавать server span как дочерний к upstream trace — без OTLP export (noop provider из шага 048).

## Implementation Scope

В скоупе:

- [`apps/api/src/common/tracing/register-noop-tracer-provider.ts`](../../apps/api/src/common/tracing/register-noop-tracer-provider.ts) — `AsyncLocalStorageContextManager`, `W3CTraceContextPropagator`, `registerTracerProviderForTests`, `setDelegate` для повторной регистрации provider в тестах.
- [`apps/api/src/common/tracing/trace-context.middleware.ts`](../../apps/api/src/common/tracing/trace-context.middleware.ts) — extract → server span → `context.with` → `span.end()` на `res.finish`.
- [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts) — `TraceContextMiddleware` **перед** `RequestIdMiddleware`.
- [`apps/api/test/trace-context.e2e-spec.ts`](../../apps/api/test/trace-context.e2e-spec.ts) — e2e с `InMemorySpanExporter`.
- [`apps/api/test/vitest-setup.ts`](../../apps/api/test/vitest-setup.ts) — `import '../src/instrumentation'` (как в `main.ts`).
- Unit-тесты middleware и регистрации; урок 049 и индексы docs.

Намеренно **не** делаем:

- Prometheus `/metrics` — [шаг 050](./lesson-050-metrics-endpoint-stub.md).
- OTLP / Jaeger export, env `OTEL_*` — реализовано в [шаг 056](./lesson-056-platform-observability-follow-ups.md).
- `traceparent` в response headers.
- Связка OTel trace id ↔ `X-Correlation-Id` / pino — позже.
- Outgoing HTTP propagation, auto-instrumentation.

## Dependencies

- [Шаг 048](./lesson-048-opentelemetry-noop.md) — noop provider, `TracingModule`, `API_TRACER`.
- [Шаг 043](./lesson-043-request-id-middleware.md) — порядок middleware: trace context раньше request id.

## Step-by-Step Changes

1. Добавить `@opentelemetry/core` и `@opentelemetry/context-async-hooks` в `apps/api`.
2. Расширить раннюю регистрацию: ALS context manager + W3C propagator (идемпотентно).
3. `TraceContextMiddleware` — `propagation.extract`, `tracer.startSpan(SERVER)`, `res.once('finish')`.
4. `AppModule` — chain `TraceContextMiddleware`, `RequestIdMiddleware` для `*`.
5. Vitest setup — импорт `instrumentation`; e2e suite с `InMemorySpanExporter`.
6. **Verify.** `npx nx run api:build`, `npx nx run api:test`, `cd apps/api && npm run test:e2e`, `npx nx run api:lint`.
7. **Docs.** Урок 049, roadmap, learning-path, docs README, storytelling.

## Code Example

```typescript
// trace-context.middleware.ts
const extractedContext = propagation.extract(context.active(), req.headers);
const span = this.tracer.startSpan(
  `HTTP ${req.method}`,
  {
    kind: SpanKind.SERVER,
    attributes: { 'http.method': req.method, 'http.route': req.path },
  },
  extractedContext,
);
const activeContext = trace.setSpan(extractedContext, span);
res.once('finish', () => {
  span.setAttribute('http.status_code', res.statusCode);
  span.end();
});
context.with(activeContext, () => next());
```

## Context

После 048 tracer provider и DI готовы, но каждый запрос жил без W3C context. Шаг 049 подключает стандартный `traceparent`: gateway или другой сервис может передать trace id, API продолжит тот же trace в памяти (пока без collector).

## Architecture Notes

- **Порядок middleware:** trace → request id — downstream видит active span в ALS.
- **Noop export:** `BasicTracerProvider` без processors в prod; спаны создаются локально.
- **`setDelegate`:** `trace.setGlobalTracerProvider` срабатывает один раз; в тестах подменяем provider через delegate на `ProxyTracerProvider`.
- **Carrier:** Express `req.headers` (ключ `traceparent` в lowercase).

## Changed Files

| Файл                                                   | Действие                                    |
| ------------------------------------------------------ | ------------------------------------------- |
| `apps/api/package.json`                                | зависимости OTel core + context-async-hooks |
| `apps/api/src/common/tracing/*`                        | propagation + middleware                    |
| `apps/api/src/app.module.ts`                           | middleware chain                            |
| `apps/api/test/vitest-setup.ts`                        | import instrumentation                      |
| `apps/api/test/trace-context.e2e-spec.ts`              | создан                                      |
| `docs/lessons/lesson-049-trace-context-propagation.md` | создан                                      |

## Verification

```bash
npx nx run api:build
npx nx run api:test
cd apps/api && npm run test:e2e
npx nx run api:lint
```

### Manual trace check

1. Запустить API с корня репозитория: `npm run start:dev` (Nest watch; порт по умолчанию **4000**, см. `PORT` в `.env`).
2. Отправить запрос с W3C trace context:

```bash
curl -s -D - -H "traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01" http://localhost:4000/health
```

3. Убедиться: HTTP **200**, ответ health без 5xx (middleware не ломает маршрут).
4. Автоматическая проверка parent trace id: `cd apps/api && npm run test:e2e` (suite `trace-context`).

## Definition of Done

- [x] W3C propagator и ALS context manager зарегистрированы до Nest.
- [x] `TraceContextMiddleware` на всех маршрутах, до `RequestIdMiddleware`.
- [x] Unit + e2e подтверждают продолжение trace из `traceparent`.
- [x] `api:build`, `api:test`, `api:lint`, `test:e2e` зелёные.
- [x] Урок 049 и индексы roadmap/learning-path/docs README/storytelling обновлены.

## What To Remember

- `trace.setGlobalTracerProvider` в OTel API — один раз; повтор — через `ProxyTracerProvider.setDelegate`.
- Server span завершать на `res.finish`, не в `next()` — иначе span оборвётся до ответа.
- Без collector manual check = curl smoke + e2e с `InMemorySpanExporter`.

## Verify

```bash
npx nx run api:build
cd apps/api && npm run test:e2e
```
