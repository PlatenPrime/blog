# Lesson 057: Database module — Postgres + TypeORM bootstrap

## Learning Goal

Подключить **TypeORM** к NestJS API через `DatabaseModule`: ORM-соединение с PostgreSQL на уже валидируемых `POSTGRES_*`, без сущностей и миграций — фундамент для Track 2 (auth, пользователи, RBAC).

## Implementation Scope

В скоупе:

- Зависимости `typeorm`, `@nestjs/typeorm` в [`apps/api/package.json`](../../apps/api/package.json).
- [`apps/api/src/database/`](../../apps/api/src/database/) — `createTypeOrmOptions`, `DatabaseModule`, re-export.
- Импорт `DatabaseModule` в [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts).
- Stub `DataSource` в test helpers и e2e, чтобы CI не требовал Postgres.
- Документация: урок, roadmap, storytelling, learning-path, LOCAL_SETUP, `apps/api/README.md`.

Намеренно **не** делаем:

- `DATABASE_URL` в env — [шаг 058](../development-roadmap.md).
- Миграции и baseline schema — [шаг 059](../development-roadmap.md).
- Сущности (`User` и др.) — [шаг 060+](../development-roadmap.md).
- Объединение health `pg` pool и ORM pool.

## Dependencies

- [Шаг 016](./lesson-016-postgres-compose-local-dev.md) — локальный Postgres (`npm run db:up`).
- [Шаг 033](./lesson-033-nest-config-and-env-validation.md) — `POSTGRES_*` в Zod.
- [Шаг 035](./lesson-035-readiness-probe-dependencies.md) — readiness через `pg` (отдельный pool).
- [Шаг 052](./lesson-052-graceful-shutdown-hooks.md) — `app.close()` закрывает TypeORM через Nest lifecycle.
- Пакеты: `typeorm` ^0.3, `@nestjs/typeorm` ^11, `pg` ^8 (уже в проекте).

## Step-by-Step Changes

1. Добавить `typeorm` и `@nestjs/typeorm` в `apps/api/package.json`, `npm install`.
2. Создать `create-typeorm-options.ts` — `synchronize: false`, `autoLoadEntities: true`, таймауты подключения.
3. Создать `database.module.ts` — `TypeOrmModule.forRootAsync` + `ConfigService`.
4. Импортировать `DatabaseModule` в `AppModule`.
5. Добавить `createTestDataSourceStub()` и `.overrideProvider(DataSource)` во всех harness'ах, поднимающих `AppModule`.
6. **Verify.** `npx nx run api:build`, `api:test`, `test:e2e`, `api:lint`.
7. **Docs.** Урок 057, roadmap, storytelling глава X, индексы.

## Code Example

```typescript
// apps/api/src/database/database.module.ts
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService<RootEnv, true>) =>
    createTypeOrmOptions({
      POSTGRES_HOST: config.getOrThrow('POSTGRES_HOST', { infer: true }),
      // ...остальные POSTGRES_*
    }),
});
```

```bash
npm run db:up
npm run start:dev
# TypeORM инициализируется при старте; readiness по-прежнему через pg pool
curl -sS http://127.0.0.1:4000/health/ready
```

## Context

Track 1 дал платформу: конфиг, health, ошибки, observability. Readiness уже проверяет Postgres через `pg`, но доменным коду нужен ORM. Шаг 057 — минимальный bootstrap: Nest знает про `DataSource`, сущности подключатся на следующих шагах через `autoLoadEntities`.

## Concept

**ORM bootstrap vs миграции.** Bootstrap — зарегистрировать драйвер и пул в DI; схема БД — отдельный workflow (059). `synchronize: true` в prod не используем: только явные миграции.

## Code Changes

- `apps/api/src/database/*` — модуль и factory опций TypeORM.
- `apps/api/src/app.module.ts` — импорт `DatabaseModule`.
- `apps/api/src/testing/create-test-data-source.stub.ts` — stub для тестов.
- Test helpers + `request-timeout.e2e-spec.ts`, `trace-context.e2e-spec.ts` — override `DataSource`.

## Why This Matters

Без ORM каждый auth-шаг пришлось бы писать на сыром SQL. Единый `DatabaseModule` и `createTypeOrmOptions` — одна точка настройки перед `DATABASE_URL` (058) и миграциями (059).

## Architecture Notes

- **TypeORM, не Drizzle/Prisma:** нативная интеграция с Nest (`@nestjs/typeorm`), уроки 033/035 уже ссылались на TypeORM; миграции TypeORM — естественное продолжение на 059.
- **Два pool'а:** readiness — `pg` в `HealthModule`; ORM — свой pool. Консолидация отложена, чтобы не смешивать probe и домен в одном шаге.
- **`synchronize: false`:** схема только через миграции.
- **E2E stub:** CI не поднимает Postgres; production и ручной dev — реальное подключение при `db:up`.

## Changed Files

| File                                                                | Action                                 |
| ------------------------------------------------------------------- | -------------------------------------- |
| `apps/api/package.json`                                             | changed — `typeorm`, `@nestjs/typeorm` |
| `apps/api/src/database/create-typeorm-options.ts`                   | created                                |
| `apps/api/src/database/database.module.ts`                          | created                                |
| `apps/api/src/database/index.ts`                                    | created                                |
| `apps/api/src/app.module.ts`                                        | changed — import `DatabaseModule`      |
| `apps/api/src/testing/create-test-data-source.stub.ts`              | created                                |
| `apps/api/src/testing/create-api-test-app.ts`                       | changed — override `DataSource`        |
| `apps/api/src/testing/create-api-contract-test-app.ts`              | changed — override `DataSource`        |
| `apps/api/test/request-timeout.e2e-spec.ts`                         | changed — override `DataSource`        |
| `apps/api/test/trace-context.e2e-spec.ts`                           | changed — override `DataSource`        |
| `docs/lessons/lesson-057-database-module-postgres-orm-bootstrap.md` | created                                |
| `docs/development-roadmap.md`                                       | changed                                |
| `docs/README.md`                                                    | changed                                |
| `docs/learning-path.md`                                             | changed                                |
| `docs/storytelling.md`                                              | changed                                |
| `docs/LOCAL_SETUP.md`                                               | changed                                |
| `apps/api/README.md`                                                | changed                                |

## Verification

```bash
npm install
npx nx run api:build
npx nx run api:test
cd apps/api && npm run test:e2e
npx nx run api:lint
```

Ожидаемый результат: все команды exit 0.

### Manual (с Postgres)

```bash
npm run db:up
npm run start:dev
curl -sS http://127.0.0.1:4000/health/ready
```

## TDD Sequence

Поведение bootstrap — инфраструктура; unit-тест на `createTypeOrmOptions` не обязателен на 057. Регрессия — зелёные существующие `api:test` и `test:e2e` после override `DataSource`.

## Definition of Done

- [x] `DatabaseModule` подключён в `AppModule`.
- [x] TypeORM использует `POSTGRES_*`, `synchronize: false`, `autoLoadEntities: true`.
- [x] E2e/contract tests не требуют живой Postgres.
- [x] `npx nx run api:build` зелёный.
- [x] Документация синхронизирована (урок, roadmap, storytelling, индексы).

## What To Remember

- Bootstrap ORM ≠ миграции и сущности — три отдельных шага roadmap.
- Readiness на `pg` и ORM pool могут сосуществовать до рефакторинга.
- Тесты с полным `AppModule` должны stub'ить `DataSource`, если CI без БД.

## Verify

```bash
npx nx run api:build
```
