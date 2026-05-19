# Lesson 053: Request timeout / abort + shutdown grace

## Learning Goal

Ограничить длительность обработки HTTP-запроса, отменять handler при обрыве клиента и дождаться in-flight запросов перед `app.close()` по SIGTERM — с предсказуемым **408** и grace-period force-exit.

## Implementation Scope

В скоупе:

- [`apps/api/src/common/request-lifecycle/`](../../apps/api/src/common/request-lifecycle/) — `RequestTimeoutInterceptor`, `clientAbort$`, токен `REQUEST_TIMEOUT_MS`.
- [`apps/api/src/common/shutdown/in-flight-requests.service.ts`](../../apps/api/src/common/shutdown/in-flight-requests.service.ts) — счётчик активных HTTP-запросов.
- [`apps/api/src/common/shutdown/api-shutdown-coordinator.service.ts`](../../apps/api/src/common/shutdown/api-shutdown-coordinator.service.ts) — grace wait + `process.exit(1)` при превышении.
- [`apps/api/src/config/configure-api-shutdown.ts`](../../apps/api/src/config/configure-api-shutdown.ts) — `enableShutdownHooks([])` + `bindApplication` (без дублирующих Nest signal handlers).
- Env: `REQUEST_TIMEOUT_MS`, `SHUTDOWN_GRACE_PERIOD_MS` в [`env.schema.ts`](../../apps/api/src/config/env.schema.ts).
- `API_ERROR_CODE_REQUEST_TIMEOUT` в shared-contracts.
- E2E: [`apps/api/test/request-timeout.e2e-spec.ts`](../../apps/api/test/request-timeout.e2e-spec.ts).

Намеренно **не** делаем:

- Per-route timeout, `@Timeout()` decorator.
- OTel attributes для timeout/abort — реализовано в [шаг 056](./lesson-056-platform-observability-follow-ups.md).
- Изменения Docker/K8s `terminationGracePeriodSeconds`.

## Dependencies

- [Шаг 045](./lesson-045-request-logging-interceptor.md) — access-log фиксирует 408/503.
- [Шаг 052](./lesson-052-graceful-shutdown-hooks.md) — lifecycle shutdown; grace period реализован здесь.

## Step-by-Step Changes

1. Env `REQUEST_TIMEOUT_MS` / `SHUTDOWN_GRACE_PERIOD_MS` + `.env.example`.
2. `InFlightRequestsService` + `RequestTimeoutInterceptor` (RxJS `timeout({ first })`, `takeUntil(clientAbort$)`).
3. `ApiShutdownCoordinator` — SIGTERM/SIGINT/IPC, drain, `app.close()` или exit `1`.
4. Регистрация interceptor **перед** `RequestLoggingInterceptor` в `AppModule`.
5. Unit + e2e тесты; `shutdown-smoke` `EXIT_TIMEOUT_MS` → `25000`.
6. **Docs.** Урок 053, roadmap, learning-path, README, storytelling.

## Code Example

```typescript
return defer(() => {
  this.inFlight.increment();
  return next.handle();
}).pipe(
  timeout({ first: this.requestTimeoutMs }),
  takeUntil(clientAbort$(request, response)),
  catchError((error) =>
    error instanceof TimeoutError
      ? throwError(() => new RequestTimeoutException())
      : throwError(() => error),
  ),
  finalize(() => this.inFlight.decrement()),
);
```

## Context

Без per-request timeout медленный handler блокирует worker; без client abort — лишняя работа после disconnect. Без grace period SIGTERM сразу рвёт in-flight ответы, хотя pool lifecycle уже готов с шага 052.

## Architecture Notes

- **Interceptors:** `RequestTimeoutInterceptor` (внешний) → `RequestLoggingInterceptor` (внутренний).
- **Shutdown:** Nest `enableShutdownHooks([])` — lifecycle без встроенных SIGTERM listeners; сигналы обрабатывает coordinator.
- **408:** `RequestTimeoutException` → `API_ERROR_CODE_REQUEST_TIMEOUT` → `application/problem+json`.
- **503 при shutdown:** новые запросы отклоняются до drain.

## Changed Files

| Файл                                                               | Действие          |
| ------------------------------------------------------------------ | ----------------- |
| `apps/api/src/common/request-lifecycle/*`                          | создан            |
| `apps/api/src/common/shutdown/in-flight-requests.service.ts`       | создан            |
| `apps/api/src/common/shutdown/api-shutdown-coordinator.service.ts` | создан            |
| `apps/api/src/config/configure-api-shutdown.ts`                    | рефактор          |
| `apps/api/src/config/env.schema.ts`                                | timeout env       |
| `libs/shared-contracts/src/errors/*`                               | `REQUEST_TIMEOUT` |
| `apps/api/test/request-timeout.e2e-spec.ts`                        | создан            |
| `.env.example`                                                     | timeout env       |

## Verification

```bash
npx nx run shared-contracts:build
npx nx run api:build
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint
npm run shutdown:smoke
```

## Definition of Done

- [x] Глобальный timeout → HTTP 408 + problem+json с `REQUEST_TIMEOUT`.
- [x] Client `close` отменяет subscription без 500.
- [x] SIGTERM: `isShuttingDown`, drain до `SHUTDOWN_GRACE_PERIOD_MS`, затем close или exit `1`.
- [x] Unit + e2e зелёные; `shutdown:smoke` зелёный.

## What To Remember

- `timeout({ first })` для handler'ов с одной эмиссией (Promise → Observable).
- E2E override `REQUEST_TIMEOUT_MS` token, не только `process.env`.
- Coordinator и Nest hooks: пустой массив сигналов в `enableShutdownHooks([])` избегает гонки с grace drain.

## Verify

```bash
npx nx run api:test:e2e
```

E2E timeout:

```bash
cd apps/api && npx vitest run -c vitest.config.e2e.ts test/request-timeout.e2e-spec.ts
```
