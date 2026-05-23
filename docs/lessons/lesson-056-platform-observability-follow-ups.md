# Lesson 056: Platform observability follow-ups (reserve)

## Learning Goal

Закрыть **отложенные доработки observability** Track 1: opt-in OTLP export, корреляция trace ↔ pino, HTTP Prometheus histogram, тихие ops-маршруты в access-log, OTel attributes на timeout/abort — и зафиксировать решение в [ADR-002](../adr/002-platform-observability.md).

## Implementation Scope

В скоупе:

- [`apps/api/src/config/otel-env.ts`](../../apps/api/src/config/otel-env.ts) — парсинг `OTEL_*` до Nest bootstrap.
- [`apps/api/src/common/tracing/register-tracer-provider.ts`](../../apps/api/src/common/tracing/register-tracer-provider.ts) — `none` / `otlp`, shutdown flush.
- [`apps/api/src/config/ops-routes.ts`](../../apps/api/src/config/ops-routes.ts) — общий список ops paths.
- [`apps/api/src/common/logging/create-pino-options.ts`](../../apps/api/src/common/logging/create-pino-options.ts) — `traceId` / `spanId` в mixin.
- [`apps/api/src/common/logging/request-logging.interceptor.ts`](../../apps/api/src/common/logging/request-logging.interceptor.ts) — skip ops routes + histogram observe.
- [`apps/api/src/metrics/http-request-metrics.service.ts`](../../apps/api/src/metrics/http-request-metrics.service.ts) — `http_request_duration_seconds`.
- [`apps/api/src/common/tracing/record-request-lifecycle-span.ts`](../../apps/api/src/common/tracing/record-request-lifecycle-span.ts) — timeout/abort attributes.
- [`docs/adr/002-platform-observability.md`](../adr/002-platform-observability.md).

Намеренно **не** делаем:

- Docker Compose observability stack — roadmap **312**.
- Business/CMS metrics, OTel Metrics SDK — доменные треки.
- Scraper auth для `/metrics`.
- `@opentelemetry/instrumentation-http` (дублирует `TraceContextMiddleware`).

## Dependencies

- [Шаг 048](./lesson-048-opentelemetry-noop.md) — noop wiring, `instrumentation.ts`.
- [Шаг 049](./lesson-049-trace-context-propagation.md) — W3C propagation.
- [Шаг 050](./lesson-050-metrics-endpoint-stub.md) — Prometheus registry.
- [Шаг 053](./lesson-053-request-timeout-abort.md) — timeout/abort interceptor.

## Step-by-Step Changes

1. Добавить `OTEL_*` в `.env.example` и `env.schema.ts`; `parseOtelEnv` для bootstrap.
2. Рефакторинг `register-tracer-provider`: OTLP `BatchSpanProcessor` при `OTEL_TRACES_EXPORTER=otlp`.
3. `shutdownTracerProvider()` в `ApiShutdownCoordinator` перед `app.close()`.
4. Pino mixin: `traceId`, `spanId` из active span.
5. `ops-routes.ts` + skip access-log для `/health`, `/health/ready`, `/metrics`.
6. `recordRequestLifecycleSpanEvent` для timeout/abort.
7. `HttpRequestMetricsService` + observe в access-log interceptor.
8. ADR-002, урок 056, roadmap / storytelling / чеклисты.

## Code Example

```typescript
// instrumentation.ts (first import chain in main.ts)
import { registerTracerProvider } from './common/tracing/register-tracer-provider';
import { parseOtelEnv } from './config/otel-env';

registerTracerProvider(parseOtelEnv(process.env));
```

```bash
# Optional local OTLP (Jaeger all-in-one)
OTEL_TRACES_EXPORTER=otlp
OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318/v1/traces
```

## Context

Уроки 048–053 намеренно оставили export, histograms и «шумные» ops-логи на потом, чтобы CI не требовал collector. Шаг 056 собирает **платформенный** observability baseline: по умолчанию noop, по env — OTLP; логи стыкуются со span'ами; Prometheus видит HTTP latency.

## Architecture Notes

- **Два момента чтения env:** `parseOtelEnv(process.env)` в `instrumentation.ts` (до Nest) и те же ключи в `rootEnvSchema` (fail-fast при старте приложения).
- **OTLP версии:** `@opentelemetry/exporter-trace-otlp-http@0.218+` согласован с `@opentelemetry/sdk-trace-base@2.x`.
- **Ops routes:** один источник правды для `setGlobalPrefix` exclude и access-log skip.
- **Deferred map:** compose stack (327), cost dashboard (334), auth token metrics (105) — в ADR-002 ([renumber ADR-003](../adr/003-roadmap-renumber-090-plus.md)).

## Changed Files

| File                                                           | Action                                |
| -------------------------------------------------------------- | ------------------------------------- |
| `apps/api/src/config/otel-env.ts`                              | created                               |
| `apps/api/src/config/ops-routes.ts`                            | created                               |
| `apps/api/src/common/tracing/register-tracer-provider.ts`      | created (replaces noop-only register) |
| `apps/api/src/common/tracing/record-request-lifecycle-span.ts` | created                               |
| `apps/api/src/metrics/http-request-metrics.service.ts`         | created                               |
| `apps/api/src/instrumentation.ts`                              | changed                               |
| `apps/api/src/config/env.schema.ts`                            | changed                               |
| `.env.example`                                                 | changed                               |
| `docs/adr/002-platform-observability.md`                       | created                               |
| `docs/lessons/lesson-056-platform-observability-follow-ups.md` | created                               |

## Verification

```bash
npx nx run api:build
npx nx run api:test
npx nx run api:lint
cd apps/api && npm run test:e2e
npm run format:check
```

### Manual (optional OTLP)

1. Запустить Jaeger: `docker run --rm -p 16686:16686 -p 4318:4318 jaegertracing/all-in-one:latest`
2. В `.env`: `OTEL_TRACES_EXPORTER=otlp`, `OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318/v1/traces`
3. `npm run start:dev` → несколько запросов к `/api/v1` → UI http://localhost:16686
4. Логи содержат `traceId`/`spanId`; `curl /metrics` без access-log; histogram в scrape.

## Definition of Done

- [x] OTLP opt-in по env; default `none` для CI.
- [x] `traceId`/`spanId` в structured logs при active span.
- [x] Ops routes без access-log; `http_request_duration_seconds` на versioned API.
- [x] Span attributes на timeout/abort.
- [x] ADR-002, урок 056, roadmap/storytelling/индексы синхронизированы.
- [x] `api:build`, `api:test`, `api:lint`, `test:e2e` зелёные.

## What To Remember

- Tracer provider регистрируется **до** `NestFactory.create` — не переносить в модуль Nest.
- OTLP без running collector не включать в CI — оставьте `OTEL_TRACES_EXPORTER=none`.
- Ops `/health` и `/metrics` — не для access-log noise; бизнес-метрики — в доменных шагах.

## Verify

```bash
npx nx run api:build
npx nx run api:test
```
