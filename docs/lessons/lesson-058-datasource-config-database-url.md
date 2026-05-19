# Lesson 058: Datasource config from validated env (`DATABASE_URL`)

## Learning Goal

Ввести канонический **`DATABASE_URL`** в Zod-схему env и подключить TypeORM datasource через `url` — 12-factor контракт перед миграциями (059) и сущностями auth.

## Implementation Scope

В скоупе:

- [`apps/api/src/config/build-database-url.ts`](../../apps/api/src/config/build-database-url.ts) — сборка URL из `POSTGRES_*`, проверка схемы.
- [`apps/api/src/config/env.schema.ts`](../../apps/api/src/config/env.schema.ts) — `DATABASE_URL` в `rootEnvSchema` / `ROOT_ENV_KEYS`; default из `POSTGRES_*` если не задан.
- [`apps/api/src/database/create-typeorm-options.ts`](../../apps/api/src/database/create-typeorm-options.ts) — `url: env.DATABASE_URL`.
- [`apps/api/src/database/database.module.ts`](../../apps/api/src/database/database.module.ts) — `ConfigService.getOrThrow('DATABASE_URL')`.
- Unit-тесты: `build-database-url.spec.ts`, `env.schema.spec.ts`, `create-typeorm-options.spec.ts`.
- [`.env.example`](../../.env.example), документация (roadmap, storytelling, LOCAL_SETUP).

Намеренно **не** делаем:

- Standalone TypeORM `DataSource` для CLI миграций — [шаг 059](../development-roadmap.md).
- Объединение health `pg` pool и ORM pool — по-прежнему `POSTGRES_*` для readiness.
- Сущности и миграции — [шаг 060+](../development-roadmap.md).

## Dependencies

- [Шаг 033](./lesson-033-nest-config-and-env-validation.md) — `rootEnvSchema`, `validateRootEnv`.
- [Шаг 057](./lesson-057-database-module-postgres-orm-bootstrap.md) — `DatabaseModule`, `createTypeOrmOptions`.
- [Шаг 016](./lesson-016-postgres-compose-local-dev.md) — `POSTGRES_*` в compose.

## Step-by-Step Changes

1. **Red:** тесты `buildDatabaseUrlFromPostgres`, кейсы `DATABASE_URL` в `env.schema.spec.ts`, ожидание `url` в `create-typeorm-options.spec.ts`.
2. **Green:** `build-database-url.ts`, расширить `env.schema.ts`, переключить factory и `DatabaseModule`.
3. Добавить `DATABASE_URL` в [`.env.example`](../../.env.example).
4. **Verify.** `npx nx run api:test`, `api:build`, `api:lint`.
5. **Docs.** Урок 058, roadmap, storytelling глава X, индексы.

## Code Example

```typescript
// apps/api/src/config/env.schema.ts (упрощённо)
.transform((value) => {
  const explicit = value.DATABASE_URL?.trim() ?? '';
  const DATABASE_URL =
    explicit.length > 0
      ? explicit
      : buildDatabaseUrlFromPostgres({
          POSTGRES_HOST: value.POSTGRES_HOST,
          POSTGRES_PORT: value.POSTGRES_PORT,
          POSTGRES_USER: value.POSTGRES_USER,
          POSTGRES_PASSWORD: value.POSTGRES_PASSWORD,
          POSTGRES_DB: value.POSTGRES_DB,
        });
  return { ...value, DATABASE_URL };
})
```

```typescript
// apps/api/src/database/create-typeorm-options.ts
export function createTypeOrmOptions(env: Pick<RootEnv, 'DATABASE_URL'>) {
  return {
    type: 'postgres',
    url: env.DATABASE_URL,
    synchronize: false,
    autoLoadEntities: true,
    // ...
  };
}
```

## Context

Шаг 057 подключил TypeORM через пять полей `POSTGRES_*`. PaaS, CI и TypeORM CLI ожидают один connection string. Шаг 058 выравнивает ORM с 12-factor, сохраняя `POSTGRES_*` для compose и readiness probe.

## Concept

**12-factor config:** приложение получает внешние ресурсы через env; `DATABASE_URL` — единая строка подключения. Discrete `POSTGRES_*` остаются удобными для Docker Compose и health checks; при отсутствии URL схема собирает его автоматически — обратная совместимость без правки существующих `.env`.

## Code Changes

- `apps/api/src/config/build-database-url.ts` — builder + `isPostgresDatabaseUrl`.
- `apps/api/src/config/env.schema.ts` — `DATABASE_URL` с default и валидацией схемы.
- `apps/api/src/database/*` — ORM на `url`.
- `.env.example` — документированный `DATABASE_URL`.

## Why This Matters

Миграции (059) и деплой смогут использовать тот же URL, что и runtime Nest. Один validated ключ снижает рассинхрон host/port между ORM и production secrets.

## Architecture Notes

- **Два источника для dev:** явный `DATABASE_URL` в `.env` или auto-build из `POSTGRES_*` — PaaS обычно задаёт только URL.
- **`encodeURIComponent` в builder:** пароли со спецсимволами не ломают URL.
- **Health без изменений:** probe остаётся на discrete fields — меньше scope, проще отладка readiness отдельно от ORM.
- **Reuse builder в 059:** `buildDatabaseUrlFromPostgres` готов для CLI `DataSource`.

## Changed Files

| File                                                        | Action                        |
| ----------------------------------------------------------- | ----------------------------- |
| `apps/api/src/config/build-database-url.ts`                 | created                       |
| `apps/api/src/config/build-database-url.spec.ts`            | created                       |
| `apps/api/src/config/env.schema.ts`                         | changed — `DATABASE_URL`      |
| `apps/api/src/config/env.schema.spec.ts`                    | changed — URL cases           |
| `apps/api/src/database/create-typeorm-options.ts`           | changed — `url` option        |
| `apps/api/src/database/create-typeorm-options.spec.ts`      | changed                       |
| `apps/api/src/database/database.module.ts`                  | changed — read `DATABASE_URL` |
| `.env.example`                                              | changed — `DATABASE_URL`      |
| `apps/api/README.md`                                        | changed                       |
| `docs/lessons/lesson-058-datasource-config-database-url.md` | created                       |
| `docs/development-roadmap.md`                               | changed                       |
| `docs/README.md`                                            | changed                       |
| `docs/learning-path.md`                                     | changed                       |
| `docs/storytelling.md`                                      | changed                       |
| `docs/LOCAL_SETUP.md`                                       | changed                       |

## Verification

```bash
npx nx run api:test
npx nx run api:build
npx nx run api:lint
```

Ожидаемый результат: все unit/e2e тесты зелёные; `parseRootEnv({})` даёт `DATABASE_URL=postgresql://blog:blog@127.0.0.1:5432/blog_dev`.

## TDD Sequence

- Red: тесты builder, schema default/override/invalid scheme, factory `url`.
- Green: реализация helper, transform в schema, factory/module.
- Refactor: вынести `isPostgresDatabaseUrl` в отдельный модуль (без изменения поведения).

## Definition of Done

- [x] `DATABASE_URL` в `rootEnvSchema`, `ROOT_ENV_KEYS`, `RootEnv`.
- [x] `createTypeOrmOptions` использует `url`.
- [x] `DatabaseModule` читает `DATABASE_URL` из `ConfigService`.
- [x] `nx run api:test` проходит.
- [x] `.env.example` и docs/storytelling/roadmap синхронизированы.
- [x] Health pool на `POSTGRES_*` без изменений.

## What To Remember

- ORM — `DATABASE_URL`; readiness/compose — `POSTGRES_*` (пока не объединяем pools).
- Пустой `DATABASE_URL` → собирается из discrete fields — старые `.env` работают.
- TypeORM принимает `url` нативно; отдельный парсер для runtime не нужен.
- Builder с percent-encoding пригодится для migration CLI на шаге 059.
- Fail-fast: неверная схема URL (`mysql://`) падает на старте Nest.

## Verify

```bash
npx nx run api:test
```

## Homework

Локально: задать кастомный `DATABASE_URL` в `.env`, `npm run db:up`, `npm run start:dev` — убедиться, что TypeORM подключается к той же БД, что readiness.
