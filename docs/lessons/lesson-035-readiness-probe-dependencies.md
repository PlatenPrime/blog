# Lesson 035: Readiness probe + dependency indicators

## Learning Goal

Добавить **readiness**-эндпоинт `GET /health/ready` с проверкой PostgreSQL через custom Terminus indicator на `pg`: load balancer и оркестратор видят, готов ли API принимать трафик, отдельно от liveness.

## Implementation Scope

В скоупе:

- Зависимости `pg`, `@types/pg` в [`apps/api/package.json`](../../apps/api/package.json).
- `POSTGRES_HOST` в [`apps/api/src/config/env.schema.ts`](../../apps/api/src/config/env.schema.ts) и [`.env.example`](../../.env.example) (дефолт `127.0.0.1`).
- [`apps/api/src/health/indicators/postgres.health-indicator.ts`](../../apps/api/src/health/indicators/postgres.health-indicator.ts) — `SELECT 1` через shared `Pool`.
- [`apps/api/src/health/pg-pool.token.ts`](../../apps/api/src/health/pg-pool.token.ts), [`health.module.ts`](../../apps/api/src/health/health.module.ts) — factory `PG_POOL`, `onModuleDestroy` → `pool.end()`.
- [`apps/api/src/health/health.controller.ts`](../../apps/api/src/health/health.controller.ts) — `GET /health/ready`, indicator `database`.
- Unit-тесты индикатора и readiness в контроллере; e2e с override `PostgresHealthIndicator` (CI без Postgres).
- Документация: этот урок, roadmap, learning-path, [`apps/api/README.md`](../../apps/api/README.md).

Намеренно **не** делаем:

- DTO/types health-ответа в `shared-contracts` — [шаг 036](../development-roadmap.md).
- Переключение smoke script на `/health/ready` — опционально позже.
- TypeORM/Prisma, `DATABASE_URL`, Postgres service в CI — последующие шаги.

## Dependencies

- Шаги 033–034 — `ConfigModule`, liveness `/health`.
- Локальная Postgres: `npm run db:up` ([lesson-016](./lesson-016-postgres-compose-local-dev.md)).
- Пакеты: `pg` ^8, `@nestjs/terminus` ^11.

## Step-by-Step Changes

1. **Red.** E2e `GET /health/ready` (с mock индикатора) → 200, `details.database.status === 'up'`; unit-тесты `PostgresHealthIndicator` и `readiness()` в контроллере.
2. **Green.** `PostgresHealthIndicator`, `PG_POOL`, `POSTGRES_HOST`, маршрут readiness.
3. **Verify.** `nx run api:test`, `api:test:e2e`, `api:lint:ci`, `api:build`; ручной `curl /health/ready` при `db:up`.
4. **Docs.** Урок, roadmap baseline, learning-path, `apps/api/README.md`.

## Code Example

```typescript
@Get('ready')
@HealthCheck()
readiness(): Promise<HealthCheckResult> {
  return this.health.check([() => this.postgres.isHealthy('database')]);
}
```

## Context

После шага 034 liveness (`GET /health`) подтверждает только живой HTTP-стек. Для маршрутизации трафика нужен readiness: «доступна ли БД». Подключение ORM ещё не настроено — проверяем Postgres напрямую через `pg`, используя уже валидируемые `POSTGRES_*`.

## Concept

**Readiness vs liveness (продолжение).** Readiness снимает pod с балансировки при недоступной БД, не перезапуская процесс. Indicator `database` в Terminus envelope даёт операторам и probe’ам единый JSON-контракт (`status`, `info`, `error`, `details`).

## Code Changes

- `apps/api/src/health/indicators/*` — Postgres indicator + spec.
- `apps/api/src/health/health.controller.ts`, `health.module.ts` — readiness + pool lifecycle.
- `apps/api/src/config/env.schema.ts` — `POSTGRES_HOST`.
- `apps/api/test/app.e2e-spec.ts` — e2e readiness с override.

## Why This Matters

Без readiness оркестратор шлёт трафик на API, который не может работать с данными. Отдельный маршрут и реальная проверка зависимости — база для Compose/Kubernetes probe’ов и шага 291 (финализация probes).

## Architecture Notes

- **Почему `pg`, а не TypeOrmHealthIndicator:** ORM ещё нет; `pg` минимален и достаточен для `SELECT 1`.
- **Почему shared `Pool`:** не открывать соединение на каждый probe; `connectionTimeoutMillis: 3000` для быстрого fail.
- **Почему e2e mock:** CI не поднимает Postgres; реальная проверка — unit + ручной curl с `db:up`.
- **HTTP 503 при fail:** Terminus выставляет 503, если `database` не `up`.

## Changed Files

| Файл                                                               | Действие           |
| ------------------------------------------------------------------ | ------------------ |
| `apps/api/package.json`                                            | `pg`, `@types/pg`  |
| `apps/api/src/config/env.schema.ts`, `env.schema.spec.ts`          | `POSTGRES_HOST`    |
| `.env.example`                                                     | `POSTGRES_HOST`    |
| `apps/api/src/health/pg-pool.token.ts`                             | создан             |
| `apps/api/src/health/indicators/postgres.health-indicator.ts`      | создан             |
| `apps/api/src/health/indicators/postgres.health-indicator.spec.ts` | создан             |
| `apps/api/src/health/health.controller.ts`                         | readiness          |
| `apps/api/src/health/health.controller.spec.ts`                    | readiness tests    |
| `apps/api/src/health/health.module.ts`                             | PG_POOL, lifecycle |
| `apps/api/test/app.e2e-spec.ts`                                    | e2e readiness      |
| `docs/lessons/lesson-035-readiness-probe-dependencies.md`          | создан             |
| `docs/development-roadmap.md`, `docs/learning-path.md`             | шаг 035            |
| `apps/api/README.md`                                               | секция Readiness   |

## Verification

- `npx nx run api:test` — зелёные.
- `npx nx run api:test:e2e` — зелёные, в т.ч. `/health/ready`.
- `npx nx run api:lint:ci` — без предупреждений.
- `npx nx run api:build` — успешная сборка.
- Dev: `npm run db:up`, `npm run start:dev`, `curl -sS http://127.0.0.1:4000/health/ready`.

## TDD Sequence

- Red: e2e + unit для readiness и `PostgresHealthIndicator`.
- Green: indicator, pool, controller route.
- Refactor: без смены публичного контракта liveness.

## Definition of Done

- [x] `GET /health/ready` → 200, `details.database.status === 'up'` при доступной Postgres.
- [x] При недоступной БД readiness → 503, `database` в `error`/`details` как `down`.
- [x] `GET /health` и `GET /` без изменений.
- [x] Unit + e2e зелёные в CI без Postgres.
- [x] Урок 035 и индексы roadmap/learning-path обновлены.

## What To Remember

- Liveness не трогает БД; readiness — только зависимости (`database`).
- E2e мокает индикатор; полная проверка — с `db:up` и curl.
- Типы Terminus JSON в `shared-contracts` — шаг 036.

## Verify

```bash
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint:ci
npx nx run api:build
npm run db:up
curl -sS http://127.0.0.1:4000/health/ready
```
