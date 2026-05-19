# apps/api — NestJS API

Backend для блога/CMS: NestJS 11 + Express 5. Workspace входит в Nx-граф под именем `api`.

Канонический entry point — npm-скрипты с корня репозитория. Quality-команды (`build`, `test`, `test:e2e`, `lint`) идут через Nx и дают кеширование, `dependsOn` (например, `api:build` → `shared-contracts:build`) и единый CI-интерфейс. Команды жизненного цикла приложения (`start`, `start:dev`, `start:prod`) пробрасываются через `npm -w api` напрямую, потому что Nest CLI сам обрабатывает watch-режим.

## Run (preferred — from repo root)

```bash
npm run start:dev    # npm -w api run start:dev  -> nest start --watch
npm run start        # npm -w api run start      -> nest start
npm run start:prod   # npm -w api run start:prod -> node dist/main
npm run test         # nx run api:test           -> vitest run
npm run test:e2e     # nx run api:test:e2e       -> vitest -c vitest.config.e2e.ts
npm run lint         # nx run api:lint
npm run build        # nx run api:build          (depends on shared-contracts:build)
```

Explicit-форма любой Nx-цели: `npx nx run api:<target>`. Список целей и зависимостей — `npm run nx:show` и `npm run nx:graph` (с корня).

## Run (workspace-local, отладка)

```bash
npm -w api run start:dev
npm -w api run test
npm -w api run test:e2e
npm -w api run start:debug    # nest start --debug --watch
npm -w api run test:cov       # vitest run --coverage
```

## Environment

API стартует через [`src/main.ts`](src/main.ts). Переменные окружения:

- Корневой [`.env`](../../.env) (если есть) загружает [`@nestjs/config`](https://docs.nestjs.com/techniques/configuration): список кандидатных путей — [`src/config/env-file-paths.ts`](src/config/env-file-paths.ts). Валидация ключей из [`.env.example`](../../.env.example) — Zod в [`src/config/env.schema.ts`](src/config/env.schema.ts).
- Шаблон — [`.env.example`](../../.env.example) в корне репо. Полная таблица переменных, дефолтов и потребителей — в [`docs/LOCAL_SETUP.md`](../../docs/LOCAL_SETUP.md), обоснование контракта — в [`lesson-017`](../../docs/lessons/lesson-017-env-example-files.md), шаг внедрения схемы — [`lesson-033`](../../docs/lessons/lesson-033-nest-config-and-env-validation.md).

Ключевые точки потребления:

| Переменная     | Дефолт                  | Читается в                                                                                                    |
| -------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `PORT`         | `4000` (auto-increment) | [`src/main.ts`](src/main.ts) → `ConfigService` после `rootEnvSchema`                                          |
| `CORS_ORIGINS` | `http://localhost:3000` | [`src/config/cors.config.ts`](src/config/cors.config.ts) → `buildCorsOptions()` (значение из `ConfigService`) |

## Database (local)

PostgreSQL поднимается через корневой [`docker-compose.yml`](../../docker-compose.yml) (service `db`, образ `postgres:16-alpine`, healthcheck, named volume `blog_pgdata`, bind на `127.0.0.1:5432`).

```bash
npm run db:up        # docker compose up -d db
npm run db:psql      # psql -U blog -d blog_dev внутри контейнера
npm run db:down      # остановить (volume сохраняется)
npm run db:reset     # полный сброс (volume удаляется)
```

**TypeORM** подключается через [`DatabaseModule`](src/database/database.module.ts): опции из `POSTGRES_*` ([`create-typeorm-options.ts`](src/database/create-typeorm-options.ts)), `synchronize: false`, `autoLoadEntities: true`. Для старта API с реальным ORM нужен живой Postgres (`npm run db:up`). Readiness по-прежнему проверяет БД отдельным `pg` pool ([`health.module.ts`](src/health/health.module.ts)). `DATABASE_URL` и миграции — шаги 058–059 ([`lesson-057`](../../docs/lessons/lesson-057-database-module-postgres-orm-bootstrap.md)).

## Routing

Публичный API: **`/api/v1`** (глобальный префикс `api` + URI versioning `v1`). Ops без префикса.

| Путь                               | Назначение               |
| ---------------------------------- | ------------------------ |
| `GET /api/v1`                      | Hello / smoke            |
| `/api/v1/examples`                 | Sample CRUD (lesson 040) |
| `GET /health`, `GET /health/ready` | Probes (см. ниже)        |
| `GET /metrics`                     | Prometheus exposition    |

```bash
curl -sS http://127.0.0.1:4000/api/v1
curl -sS http://127.0.0.1:4000/api/v1/examples
```

Конфигурация: [`src/config/configure-api-http.ts`](src/config/configure-api-http.ts). Полная таблица и правила v2 — [`docs/api/routing-and-versioning.md`](../../docs/api/routing-and-versioning.md). Урок: [`lesson-051`](../../docs/lessons/lesson-051-api-prefix-and-versioning.md).

## Health

### Liveness

Liveness-проба: процесс и HTTP-стек живы (без проверки БД).

```bash
curl -sS http://127.0.0.1:4000/health
```

Ожидается HTTP **200** и JSON Terminus с `status: "ok"` и `details.api.status: "up"`.

### Readiness

Readiness-проба: API готов принимать трафик; проверяется PostgreSQL (`SELECT 1` через `pg`).

```bash
npm run db:up   # из корня репо, если БД ещё не запущена
curl -sS http://127.0.0.1:4000/health/ready
```

Ожидается HTTP **200** и `details.database.status: "up"`. Если Postgres недоступен — **503** и `database` в `error`/`details` как `down`.

Переменная `POSTGRES_HOST` (дефолт `127.0.0.1`) в [`.env.example`](../../.env.example); остальные `POSTGRES_*` — как для compose.

Реализация: [`src/health/`](src/health/) (`TerminusModule`, `HealthController`, `PostgresHealthIndicator`). Уроки: liveness — [`lesson-034`](../../docs/lessons/lesson-034-terminus-health-liveness.md), readiness — [`lesson-035`](../../docs/lessons/lesson-035-readiness-probe-dependencies.md).

Если порт 4000 занят, смотрите фактический порт в логе bootstrap (`Application is running on port …`).

## Graceful shutdown

Bootstrap вызывает [`configureApiShutdown`](src/config/configure-api-shutdown.ts) (`enableShutdownHooks`). При SIGTERM/SIGINT Nest закрывает HTTP-сервер, вызывает `PostgresPoolLifecycle.onModuleDestroy` и логирует shutdown через [`ApiShutdownService`](src/common/shutdown/api-shutdown.service.ts).

```bash
npx nx run api:build          # из корня репо
npm run shutdown:smoke        # spawn dist → /health → SIGTERM → exit 0
```

Урок: [`lesson-052`](../../docs/lessons/lesson-052-graceful-shutdown-hooks.md).

## See also

- Root [README](../../README.md) — runbook монорепо.
- [`docs/development-roadmap.md`](../../docs/development-roadmap.md) — план шагов.
- [`docs/LOCAL_SETUP.md`](../../docs/LOCAL_SETUP.md) — детальный setup, env-таблицы.
- Релевантные уроки: [005](../../docs/lessons/lesson-005-nest-apps-api-migration.md), [013](../../docs/lessons/lesson-013-wire-shared-contracts-api.md), [015](../../docs/lessons/lesson-015-cors-and-dev-origins.md), [016](../../docs/lessons/lesson-016-postgres-compose-local-dev.md), [017](../../docs/lessons/lesson-017-env-example-files.md), [033](../../docs/lessons/lesson-033-nest-config-and-env-validation.md), [034](../../docs/lessons/lesson-034-terminus-health-liveness.md), [035](../../docs/lessons/lesson-035-readiness-probe-dependencies.md), [051](../../docs/lessons/lesson-051-api-prefix-and-versioning.md), [052](../../docs/lessons/lesson-052-graceful-shutdown-hooks.md).
- Upstream-документация NestJS: [docs.nestjs.com](https://docs.nestjs.com).
