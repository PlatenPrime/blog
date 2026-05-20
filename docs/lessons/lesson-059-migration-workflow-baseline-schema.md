# Lesson 059: Migration workflow + baseline schema

## Learning Goal

Настроить **TypeORM migration workflow**: CLI `DataSource` на том же validated `DATABASE_URL`, npm-скрипты `up`/`down`/`show`, baseline-миграция без доменных таблиц — фундамент перед сущностью `User` (060).

## Implementation Scope

В скоупе:

- [`apps/api/src/database/create-typeorm-options.ts`](../../apps/api/src/database/create-typeorm-options.ts) — `createBasePostgresOptions`, `createCliDataSourceOptions`.
- [`apps/api/src/database/load-cli-env.ts`](../../apps/api/src/database/load-cli-env.ts) — `.env` + `parseRootEnv` для CLI.
- [`apps/api/src/database/typeorm-data-source.ts`](../../apps/api/src/database/typeorm-data-source.ts) — default export `DataSource` для TypeORM CLI.
- [`apps/api/src/database/migrations/1747756800000-InitialBaseline.ts`](../../apps/api/src/database/migrations/1747756800000-InitialBaseline.ts) — no-op baseline.
- Скрипты `migration:*` в [`apps/api/package.json`](../../apps/api/package.json); `db:migrate*` и [`scripts/migration-smoke.mjs`](../../scripts/migration-smoke.mjs) в корне.
- Unit-тесты `createCliDataSourceOptions` в `create-typeorm-options.spec.ts`.
- Документация (roadmap, storytelling, LOCAL_SETUP, README).

Намеренно **не** делаем:

- Сущность `User`, доменные таблицы — [шаг 060](../development-roadmap.md).
- `migrationsRun: true` при старте Nest — миграции только через CLI.
- Postgres в CI / `db:migrate` в `npm run ci` — [шаг 310](../development-roadmap.md).

## Dependencies

- [Шаг 058](./lesson-058-datasource-config-database-url.md) — `DATABASE_URL`, `createTypeOrmOptions`.
- [Шаг 057](./lesson-057-database-module-postgres-orm-bootstrap.md) — `synchronize: false`, TypeORM ^0.3.
- [Шаг 016](./lesson-016-postgres-compose-local-dev.md) — `npm run db:up`.
- Пакеты: `typeorm`, `ts-node`, `dotenv` в `apps/api`.

## Step-by-Step Changes

1. **Red:** тесты `createCliDataSourceOptions` (migrations glob, `entities: []`, без `autoLoadEntities`).
2. **Green:** рефакторинг `create-typeorm-options.ts`, `load-cli-env.ts`, `typeorm-data-source.ts`, baseline migration.
3. Добавить npm-скрипты и `migration-smoke.mjs`.
4. **Verify.** `nx run api:test`, `api:build`, `api:lint`; с Docker: `db:up`, `db:migrate:smoke`.
5. **Docs.** Урок 059, roadmap, storytelling глава X, индексы.

## Code Example

```typescript
// apps/api/src/database/typeorm-data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { createCliDataSourceOptions } from './create-typeorm-options';
import { loadCliEnv } from './load-cli-env';

export default new DataSource(createCliDataSourceOptions(loadCliEnv()));
```

```bash
npm run db:up
npm run db:migrate          # apply pending migrations
npm run db:migrate:show     # list status
npm run db:migrate:revert   # undo last migration
npm run db:migrate:smoke    # up → show → revert → up
```

## Context

Шаг 058 выровнял runtime ORM на `DATABASE_URL`, но схема БД не версионировалась. Auth и RBAC требуют воспроизводимых миграций в dev/staging/prod. Шаг 059 вводит CLI workflow и пустую baseline-цепочку; доменные таблицы — на 060.

## Concept

**Schema as code.** `synchronize: true` удобен для прототипов, но в команде и CI даёт дрейф. Миграции — явные, ревьюируемые изменения схемы; Nest подключается к уже применённой БД, не меняя её при каждом старте.

## Code Changes

- `create-typeorm-options.ts` — общая база Postgres + отдельные опции Nest и CLI.
- `load-cli-env.ts` / `typeorm-data-source.ts` — тот же Zod-контракт env, что и HTTP runtime.
- `migrations/*-InitialBaseline.ts` — no-op, фиксирует таблицу `typeorm_migrations`.
- Корневые `db:migrate*` — операторские команды рядом с `db:up`.

## Why This Matters

Deploy и onboarding: один `DATABASE_URL`, одна команда `db:migrate` перед `start:prod`. Baseline без таблиц отделяет «инфраструктуру миграций» от «домена пользователя» — проще ревью и откат.

## Architecture Notes

- **Два потребителя одного URL:** Nest `DatabaseModule` и CLI `DataSource` — разные фабрики, общий `createBasePostgresOptions`.
- **CLI `entities` glob:** на 059 сущностей не было; на [060](./lesson-060-user-entity-indexes.md) в `createCliDataSourceOptions` добавлен glob `*.entity.{ts,js}` для `migration:generate`.
- **Prod deploy:** позже запускать `migration:run` на скомпилированном `dist` с `*.js` migrations (glob `*.{ts,js}` уже учтён).
- **Smoke вне CI:** как e2e с stub `DataSource` — CI без Docker Postgres.

## Changed Files

| File                                                                | Action                       |
| ------------------------------------------------------------------- | ---------------------------- |
| `apps/api/src/database/create-typeorm-options.ts`                   | changed — base + CLI options |
| `apps/api/src/database/create-typeorm-options.spec.ts`              | changed — CLI tests          |
| `apps/api/src/database/load-cli-env.ts`                             | created                      |
| `apps/api/src/database/typeorm-data-source.ts`                      | created                      |
| `apps/api/src/database/migrations/1747756800000-InitialBaseline.ts` | created                      |
| `apps/api/package.json`                                             | changed — scripts, `dotenv`  |
| `package.json`                                                      | changed — `db:migrate*`      |
| `scripts/migration-smoke.mjs`                                       | created                      |
| `package-lock.json`                                                 | changed — lockfile           |
| `docs/lessons/lesson-059-migration-workflow-baseline-schema.md`     | created                      |
| `docs/development-roadmap.md`                                       | changed                      |
| `docs/README.md`                                                    | changed                      |
| `docs/learning-path.md`                                             | changed                      |
| `docs/storytelling.md`                                              | changed                      |
| `docs/LOCAL_SETUP.md`                                               | changed                      |
| `README.md`                                                         | changed                      |
| `apps/api/README.md`                                                | changed                      |

## Verification

```bash
npx nx run api:test
npx nx run api:build
npx nx run api:lint
```

С Docker Postgres:

```bash
npm run db:up
npm run db:migrate:smoke
```

Ожидаемый результат: unit-тесты зелёные; smoke проходит up → show (InitialBaseline) → revert → up. Без Docker CLI всё равно загружает `typeorm-data-source` (ошибка только на `ECONNREFUSED` к БД).

## TDD Sequence

- Red: тесты `createCliDataSourceOptions`.
- Green: фабрики, DataSource, baseline migration, скрипты.
- Refactor: вынести `createBasePostgresOptions` без изменения поведения Nest runtime.

Шаг по контракту roadmap не требует unit-теста на SQL миграции — проверка smoke + CLI load.

## Definition of Done

- [x] CLI `DataSource` на `DATABASE_URL` через `loadCliEnv` + `parseRootEnv`.
- [x] `createCliDataSourceOptions` с migrations glob и `typeorm_migrations`.
- [x] Baseline migration `InitialBaseline` (no-op).
- [x] `db:migrate`, `db:migrate:revert`, `db:migrate:show`, `db:migrate:smoke`.
- [x] `nx run api:test`, `api:build`, `api:lint` проходят.
- [x] Docs/storytelling/roadmap синхронизированы.
- [x] CI без Postgres не ломается.

## What To Remember

- Миграции — через CLI, не при `nest start`.
- Тот же `DATABASE_URL`, что и runtime ORM.
- Baseline пустой по домену — `User` на 060.
- Перед smoke на «грязной» БД: `db:reset` + `db:up`.
- `migration:generate` появится с сущностями на 060+.

## Verify

```bash
npx nx run api:test
npm run db:up
npm run db:migrate:smoke
```

## Homework

Локально: `db:migrate:show` до и после `db:migrate`; в `psql` проверить `\dt` и `SELECT * FROM typeorm_migrations;`.
