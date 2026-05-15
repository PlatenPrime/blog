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

Подключение драйвера БД из Nest ещё не настроено (последующие шаги Track 1). Переменные `POSTGRES_*` уже валидируются при старте API вместе с остальными ключами [`.env.example`](../../.env.example), чтобы dev-окружение не расходилось с compose.

## Health (liveness)

Liveness-проба для оркестраторов и ручных проверок:

```bash
curl -sS http://127.0.0.1:4000/health
```

Ожидается HTTP **200** и JSON Terminus с `status: "ok"` и `details.api.status: "up"`. Если порт 4000 занят, смотрите фактический порт в логе bootstrap (`Application is running on port …`).

Реализация: [`src/health/`](src/health/) (`TerminusModule`, `HealthController`). Readiness с проверкой зависимостей — шаг 035 (см. roadmap Track 1); liveness — [`lesson-034`](../../docs/lessons/lesson-034-terminus-health-liveness.md).

## See also

- Root [README](../../README.md) — runbook монорепо.
- [`docs/development-roadmap.md`](../../docs/development-roadmap.md) — план шагов.
- [`docs/LOCAL_SETUP.md`](../../docs/LOCAL_SETUP.md) — детальный setup, env-таблицы.
- Релевантные уроки: [005](../../docs/lessons/lesson-005-nest-apps-api-migration.md), [013](../../docs/lessons/lesson-013-wire-shared-contracts-api.md), [015](../../docs/lessons/lesson-015-cors-and-dev-origins.md), [016](../../docs/lessons/lesson-016-postgres-compose-local-dev.md), [017](../../docs/lessons/lesson-017-env-example-files.md), [033](../../docs/lessons/lesson-033-nest-config-and-env-validation.md), [034](../../docs/lessons/lesson-034-terminus-health-liveness.md).
- Upstream-документация NestJS: [docs.nestjs.com](https://docs.nestjs.com).
