# Lesson 060: `User` entity + indexes

## Learning Goal

Ввести **первую доменную таблицу Track 2** — `users`: TypeORM-сущность `User`, уникальность `email`, колонка под хэш пароля, явная миграция и glob сущностей в CLI `DataSource`, чтобы следующие шаги (061–063) могли опираться на стабильную схему без `synchronize`.

## Implementation Scope

В скоупе:

- [`apps/api/src/users/user.entity.ts`](../../apps/api/src/users/user.entity.ts) — сущность `User` (`users`).
- [`apps/api/src/users/users.module.ts`](../../apps/api/src/users/users.module.ts) — `TypeOrmModule.forFeature([User])`, экспорт `TypeOrmModule` для будущих сервисов.
- [`apps/api/src/users/index.ts`](../../apps/api/src/users/index.ts) — публичный barrel.
- [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts) — импорт `UsersModule`.
- [`apps/api/src/database/create-typeorm-options.ts`](../../apps/api/src/database/create-typeorm-options.ts) — `entities` glob `**/*.entity.{ts,js}` для CLI.
- [`apps/api/src/database/create-typeorm-options.spec.ts`](../../apps/api/src/database/create-typeorm-options.spec.ts) — ожидания CLI.
- [`apps/api/src/database/migrations/1747843200000-CreateUsersTable.ts`](../../apps/api/src/database/migrations/1747843200000-CreateUsersTable.ts) — `CREATE TABLE` + `UNIQUE (email)`, `DEFAULT gen_random_uuid()` для `id`.
- [`apps/api/src/testing/create-test-data-source.stub.ts`](../../apps/api/src/testing/create-test-data-source.stub.ts) — расширение заглушки (`entityMetadatas`, `getRepository`, …) для контракт-тестов с `forFeature`.

Намеренно **не** делаем:

- Сервисы регистрации/логина, JWT, DTO — [шаги 061+](../development-roadmap.md).
- Case-insensitive email / дружелюбные ошибки уникальности — [шаг 064](../development-roadmap.md).

## Dependencies

- [Шаг 059](./lesson-059-migration-workflow-baseline-schema.md) — baseline-миграция, `db:migrate*`.
- [Шаг 058](./lesson-058-datasource-config-database-url.md) — `DATABASE_URL`.
- Postgres 16 (`gen_random_uuid()` без расширения `uuid-ossp`).

## Step-by-Step Changes

1. **Сущность и модуль:** `User` с snake_case имён колонок в БД через `@Column({ name })`, `UsersModule`, импорт в `AppModule`.
2. **CLI entities glob:** обновить `createCliDataSourceOptions` и unit-тест.
3. **Миграция:** ручной SQL, согласованный с декораторами сущности.
4. **Тестовая заглушка DataSource:** после `forFeature` Nest создаёт фабрики репозиториев; заглушка должна иметь `entityMetadatas` и `getRepository`.
5. **Verify:** `nx run api:test`, `nx run api:lint`, `nx run api:build`; с Docker — `db:up`, `db:migrate` (или `db:migrate:smoke`).
6. **Docs:** roadmap, storytelling глава X, README, learning-path, LOCAL_SETUP.

## Code Example

```typescript
// apps/api/src/users/user.entity.ts (фрагмент)
@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 320 })
  email!: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;
  // createdAt / updatedAt — см. файл
}
```

```bash
npm run db:up
npm run db:migrate
npm run db:migrate:show
```

## Context

После 059 цепочка `typeorm_migrations` существует, но доменных таблиц нет. Auth требует места хранения учётных данных; сущность и миграция задают контракт до появления HTTP-эндпоинтов.

## Concept

**Схема как код:** миграция — единственный источник правды для DDL в проде; сущность TypeORM отражает те же колонки для runtime-запросов. Уникальный индекс на `email` фиксирует инвариант на уровне БД (дубли отсечёт Postgres до бизнес-логики).

## Code Changes

- `users/*` — доменный модуль пользователя без HTTP-слоя.
- `CreateUsersTable` — явное создание `users` и `UQ_users_email`.
- `create-typeorm-options` — glob сущностей для будущего `migration:generate`.
- `create-test-data-source.stub` — совместимость с `@nestjs/typeorm` repository providers.

## Why This Matters

Без таблицы `users` нельзя честно писать `UserService` и e2e регистрации: тесты либо мокают несуществующую реальность, либо требуют ручного SQL. Уникальный constraint на email снижает класс гонок при параллельных регистрациях.

## Architecture Notes

- **Имя таблицы `users`:** множественное число, кавычки в SQL для стабильного lower-case в Postgres.
- **`password_hash` NOT NULL:** таблица изначально пустая; первая вставка (062+) всегда с хэшем.
- **Регистр email:** пока уникальность по строке как есть; нормализация в 064+.
- **Тесты без Postgres:** контракт-тесты подменяют `DataSource`, но не отключают `UsersModule`; заглушка должна удовлетворять фабрикам репозиториев.

## Changed Files

| File                                                                 | Action                          |
| -------------------------------------------------------------------- | ------------------------------- |
| `apps/api/src/users/user.entity.ts`                                  | created                         |
| `apps/api/src/users/users.module.ts`                                 | created                         |
| `apps/api/src/users/index.ts`                                        | created                         |
| `apps/api/src/app.module.ts`                                         | changed — `UsersModule`         |
| `apps/api/src/database/create-typeorm-options.ts`                    | changed — entities glob         |
| `apps/api/src/database/create-typeorm-options.spec.ts`               | changed                         |
| `apps/api/src/database/migrations/1747843200000-CreateUsersTable.ts` | created                         |
| `apps/api/src/testing/create-test-data-source.stub.ts`               | changed — stub для `forFeature` |
| `docs/lessons/lesson-060-user-entity-indexes.md`                     | created                         |
| `docs/development-roadmap.md`                                        | changed — шаг 060 done          |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md`  | changed                         |
| `docs/LOCAL_SETUP.md`                                                | changed — next step 061         |

## Verification

- `npx nx run api:test` — все unit/contract-тесты зелёные.
- `npx nx run api:lint` — без предупреждений.
- `npx nx run api:build` — успешная сборка.
- С поднятым Postgres (`npm run db:up`): `npm run db:migrate` — применяется `CreateUsersTable1747843200000`; `\d users` в `psql` показывает колонки и `UNIQUE` на `email`.

## TDD Sequence

- **Red / Green:** спецификация CLI через существующий `create-typeorm-options.spec.ts` обновлена до появления glob; реализация в `create-typeorm-options.ts`.
- Поведение сущности покрывается косвенно интеграцией Nest + TypeORM в полном приложении; отдельный CRUD-тест в 062.

## Definition of Done

- [x] Таблица `users` создаётся миграцией, `email` уникален.
- [x] Сущность `User` согласована с DDL; `UsersModule` подключён к `AppModule`.
- [x] CLI `DataSource` видит `*.entity.{ts,js}`.
- [x] `nx run api:test` зелёный без обязательного Docker в CI.
- [x] Документация (roadmap, storytelling, README, learning-path, LOCAL_SETUP) синхронизирована.

## What To Remember

- Первый доменный шаг в Track 2 — таблица пользователя и уникальный email.
- `forFeature` нужен, чтобы `autoLoadEntities` подхватил сущность в Nest.
- Тестовая заглушка `DataSource` должна иметь минимум полей, которые читает `@nestjs/typeorm` при создании репозиториев.

## Verify

```bash
npx nx run api:test
npx nx run api:build
npm run db:up && npm run db:migrate && npm run db:migrate:show
```

## Homework

На чистой БД: применить миграции с нуля, затем `db:migrate:revert` один раз и снова `db:migrate` — убедиться, что `down`/`up` симметричны для `users`.
