# Lesson 052: Graceful shutdown hooks

## Learning Goal

Включить корректное завершение NestJS API по **SIGTERM** / **SIGINT**: drain HTTP, lifecycle-хуки (`onModuleDestroy` для Postgres pool), структурированный лог shutdown и самодостаточный smoke-скрипт.

## Implementation Scope

В скоупе:

- [`apps/api/src/config/configure-api-shutdown.ts`](../../apps/api/src/config/configure-api-shutdown.ts) — `enableShutdownHooks()`.
- [`apps/api/src/common/shutdown/`](../../apps/api/src/common/shutdown/) — `ShutdownModule`, `ApiShutdownService` (`OnApplicationShutdown`).
- [`apps/api/src/main.ts`](../../apps/api/src/main.ts), [`create-api-test-app.ts`](../../apps/api/src/testing/create-api-test-app.ts) — вызов `configureApiShutdown`.
- [`scripts/shutdown-smoke.mjs`](../../scripts/shutdown-smoke.mjs) + `npm run shutdown:smoke`.

Намеренно **не** делаем:

- `SHUTDOWN_GRACE_PERIOD_MS`, force-kill — [шаг 053](../development-roadmap.md).
- OTel SDK shutdown (сейчас noop provider).
- Изменения Docker/K8s manifests.

## Dependencies

- [Шаг 035](./lesson-035-readiness-probe-dependencies.md) — `PostgresPoolLifecycle.onModuleDestroy` → `pool.end()`.
- [Шаг 044](./lesson-044-structured-logging.md) — pino logger для shutdown log.

## Step-by-Step Changes

1. `configureApiShutdown(app)` + unit spec.
2. `ShutdownModule` + `ApiShutdownService` с логом `application shutdown` и полем `signal`.
3. Вызов в `main.ts` и `createApiTestApp()` после `configureApiHttp`.
4. `scripts/shutdown-smoke.mjs`: spawn/fork `dist/main.js`, poll `/health`, `SIGTERM` (Unix) или IPC `graceful-shutdown` (Windows subprocess), log marker.
5. **Verify.** `npx nx run api:build`, `api:test`, `api:test:e2e`, `api:lint`, `npm run shutdown:smoke`.
6. **Docs.** Урок 052, roadmap, learning-path, README, storytelling.

## Code Example

```typescript
// configure-api-shutdown.ts
export function configureApiShutdown(app: INestApplication): void {
  app.enableShutdownHooks();
}

// api-shutdown.service.ts
onApplicationShutdown(signal?: string): void {
  this.logger.log({ signal: signal ?? null }, APPLICATION_SHUTDOWN_LOG_MESSAGE);
}
```

## Context

Оркестраторы (Kubernetes, Docker) шлют SIGTERM перед остановкой pod/контейнера. Без `enableShutdownHooks` Nest не вызывает `app.close()` — теряются in-flight запросы и не закрывается `pg` pool. Существующий [`PostgresPoolLifecycle`](../../apps/api/src/health/postgres-pool.lifecycle.ts) уже готов; нужен только сигнал shutdown на уровне приложения.

## Architecture Notes

- **Порядок:** `enableShutdownHooks` → SIGTERM → Nest `close()` → `onModuleDestroy` (pool) → `onApplicationShutdown` (log).
- **Паритет test/prod:** `createApiTestApp` вызывает тот же `configureApiShutdown`; e2e по-прежнему закрывают через `app.close()`.
- **Smoke:** сам поднимает built API на порту `4099` (не требует dev-сервера на `:4000`).

## Changed Files

| Файл                                                 | Действие               |
| ---------------------------------------------------- | ---------------------- |
| `apps/api/src/config/configure-api-shutdown.ts`      | создан                 |
| `apps/api/src/config/configure-api-shutdown.spec.ts` | создан                 |
| `apps/api/src/common/shutdown/*`                     | создан                 |
| `apps/api/src/app.module.ts`                         | `ShutdownModule`       |
| `apps/api/src/main.ts`                               | `configureApiShutdown` |
| `apps/api/src/testing/create-api-test-app.ts`        | `configureApiShutdown` |
| `scripts/shutdown-smoke.mjs`                         | создан                 |
| `package.json`                                       | `shutdown:smoke`       |

## Verification

```bash
npx nx run api:build
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint
npm run shutdown:smoke
```

### Manual

```bash
npx nx run api:build
npm run shutdown:smoke
```

## Definition of Done

- [x] `enableShutdownHooks()` в prod bootstrap.
- [x] Structured shutdown log с `signal`.
- [x] `PostgresPoolLifecycle` вызывается при SIGTERM (через Nest lifecycle).
- [x] `shutdown:smoke` exit `0` после shutdown signal (SIGTERM на Unix, SIGINT на Windows).
- [x] `api:build`, `api:test`, `api:test:e2e`, `api:lint` зелёные.

## What To Remember

- `bufferLogs: true` + shutdown hooks → Nest flush'ит логи при остановке.
- Smoke требует **build** (`apps/api/dist/main.js`).
- Dedicated smoke port (`4099`) не конфликтует с dev `:4000`.
- Smoke на Windows шлёт IPC `graceful-shutdown` (OS signals в pipe-subprocess ненадёжны); Unix smoke — `SIGTERM`. Prod/K8s — `SIGTERM` + `enableShutdownHooks`.

## Verify

SIGTERM smoke:

```bash
npm run shutdown:smoke
```
