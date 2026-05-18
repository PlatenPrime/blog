# Lesson 048: OpenTelemetry wiring + noop tracer provider

## Learning Goal

Заложить каркас distributed tracing в API: ранняя регистрация `BasicTracerProvider` без span processors (noop export), глобальный Nest `TracingModule` с injectable `API_TRACER` для будущих span'ов и шага 049 (W3C propagation).

## Implementation Scope

В скоупе:

- [`apps/api/src/common/tracing/`](../../apps/api/src/common/tracing/) — `registerNoopTracerProvider`, `TracingModule`, токен `API_TRACER`.
- [`apps/api/src/instrumentation.ts`](../../apps/api/src/instrumentation.ts) — side-effect до Nest bootstrap.
- [`apps/api/src/main.ts`](../../apps/api/src/main.ts) — `import './instrumentation'` первой строкой.
- [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts) — `TracingModule` в imports.
- Unit-тесты регистрации и DI.

Намеренно **не** делаем:

- W3C `traceparent` propagation — [шаг 049](./lesson-049-trace-context-propagation.md).
- OTLP exporter, auto-instrumentation HTTP, env `OTEL_*` — [шаги 049–050+](../development-roadmap.md).
- Связка span id ↔ pino logs — позже.

## Dependencies

- [Шаг 044](./lesson-044-structured-logging.md) — `OTEL_TRACER_NAME` совпадает с `API_SERVICE_NAME` (`api`).
- [Шаг 046](./lesson-046-correlation-id.md) — `incoming-trace-id.ts` будет использоваться в 049.

## Step-by-Step Changes

1. Установить `@opentelemetry/api` и `@opentelemetry/sdk-trace-base` в workspace `api`.
2. `registerNoopTracerProvider()` — `BasicTracerProvider` + `trace.setGlobalTracerProvider()` (OTel JS 2.x).
3. `instrumentation.ts` + импорт в `main.ts` до `NestFactory.create`.
4. `TracingModule` — `@Global()`, `API_TRACER` → `trace.getTracer('api')`.
5. Unit-тесты: span start/end, idempotent register, DI resolves tracer.
6. **Verify.** `npx nx run api:build`, `npx nx run api:test`, `npx nx run api:lint`.
7. **Docs.** Урок 048, roadmap, learning-path, docs README, storytelling.

## Code Example

```typescript
// register-noop-tracer-provider.ts
import { trace } from '@opentelemetry/api';
import { BasicTracerProvider } from '@opentelemetry/sdk-trace-base';

export function registerNoopTracerProvider(): void {
  const provider = new BasicTracerProvider();
  trace.setGlobalTracerProvider(provider);
}

// main.ts (first line)
import './instrumentation';
```

## Context

После 047 API готов к логам без утечки секретов. Шаг 048 добавляет **проводку tracing** без экспорта: локально и в CI нет collector'а, но код уже может инжектить `API_TRACER` и в 049 подключить context manager + propagator.

## Architecture Notes

- **Ранняя регистрация:** `instrumentation.ts` импортируется до Nest — по [OTel SDK registration](https://github.com/open-telemetry/opentelemetry-js/blob/main/doc/sdk-registration.md).
- **Noop export:** `BasicTracerProvider` без span processors — спаны создаются, никуда не уходят.
- **DI-контракт:** `API_TRACER` — единая точка для сервисов; смена provider в 049+ не ломает потребителей.
- **Имя tracer:** `OTEL_TRACER_NAME = 'api'` — как `service` в pino.

## Changed Files

| Файл                                            | Действие               |
| ----------------------------------------------- | ---------------------- |
| `apps/api/package.json`                         | зависимости OTel       |
| `apps/api/src/common/tracing/*`                 | создано                |
| `apps/api/src/instrumentation.ts`               | создан                 |
| `apps/api/src/main.ts`                          | import instrumentation |
| `apps/api/src/app.module.ts`                    | `TracingModule`        |
| `docs/lessons/lesson-048-opentelemetry-noop.md` | создан                 |

## Verification

```bash
npx nx run api:build
npx nx run api:test
npx nx run api:lint
```

## Definition of Done

- [x] OpenTelemetry API подключён; tracer provider зарегистрирован до Nest.
- [x] `TracingModule` экспортирует `API_TRACER`.
- [x] Unit-тесты регистрации и DI зелёные.
- [x] `api:build` зелёный.
- [x] Урок 048 и индексы roadmap/learning-path/docs README/storytelling обновлены.

## What To Remember

- В OTel JS 2.x у `BasicTracerProvider` нет `.register()` — используй `trace.setGlobalTracerProvider()`.
- Propagation и exporter — отдельные шаги; не смешивай с wiring.
- `import './instrumentation'` должен быть первым в `main.ts`.

## Verify

```bash
npx nx run api:build
```
