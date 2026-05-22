# Lesson 079: Roles + permissions schema

## Learning Goal

Заложить **схему RBAC** в PostgreSQL: таблицы `roles`, `permissions`, связи `role_permissions` и M2M `user_roles`, TypeORM-сущности и `RbacModule` — без seed, guards и HTTP.

## Implementation Scope

В скоупе:

- [`apps/api/src/database/migrations/1748275200000-CreateRolesAndPermissionsSchema.ts`](../../apps/api/src/database/migrations/1748275200000-CreateRolesAndPermissionsSchema.ts) — DDL для четырёх таблиц.
- [`apps/api/src/rbac/`](../../apps/api/src/rbac/) — сущности `Role`, `Permission`, `RolePermission`, `UserRole`.
- [`apps/api/src/rbac/role-slug.ts`](../../apps/api/src/rbac/role-slug.ts) — `RoleSlug`, `DEFAULT_ROLE_SLUGS` (`admin`, `editor`, `viewer`).
- [`apps/api/src/rbac/permission-key.ts`](../../apps/api/src/rbac/permission-key.ts) — заготовка `PermissionKey` (`posts:read`, `posts:write`).
- [`apps/api/src/rbac/rbac.module.ts`](../../apps/api/src/rbac/rbac.module.ts) — `TypeOrmModule.forFeature`, export `TypeOrmModule`.
- [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts) — импорт `RbacModule`.
- [`apps/api/src/rbac/role-slug.spec.ts`](../../apps/api/src/rbac/role-slug.spec.ts), [`rbac.module.spec.ts`](../../apps/api/src/rbac/rbac.module.spec.ts) — unit (tests-first gate).

Намеренно **не** делаем:

- Seed ролей/прав — [шаг 080](../development-roadmap.md).
- `RolesGuard`, `PermissionsGuard`, `@Roles()` — [081–082](../development-roadmap.md).
- Назначение ролей при register, JWT claims — [081+](../development-roadmap.md), [084](../development-roadmap.md).
- Изменение `User` entity (связи — при необходимости на 081).

## Dependencies

- [Шаг 060](./lesson-060-user-entity-indexes.md) — таблица `users`, FK target для `user_roles`.
- [Шаг 059](./lesson-059-migration-workflow-baseline-schema.md) — `db:migrate*`.
- [Шаг 078](./lesson-078-password-reset-completion.md) — auth recovery закрыт; следующий слой — RBAC.

## Step-by-Step Changes

1. **Red:** `role-slug.spec.ts`, `rbac.module.spec.ts` (с `DatabaseModule` + stub `DataSource`).
2. Сущности RBAC + `RoleSlug` / `PermissionKey` constants.
3. Миграция `CreateRolesAndPermissionsSchema` (согласована с декораторами).
4. `RbacModule` + импорт в `AppModule`.
5. **Verify:** `api:test`, `api:lint`, `api:build`; с Docker — `db:migrate`.
6. Docs sync: roadmap, storytelling, README, learning-path, LOCAL_SETUP.

## Code Example

```typescript
// apps/api/src/rbac/role-slug.ts
export const RoleSlug = {
  Admin: 'admin',
  Editor: 'editor',
  Viewer: 'viewer',
} as const;
```

```bash
npm run db:up
npm run db:migrate
npm run db:migrate:show
```

## Context

После 078 полный recovery-flow готов, но любой CMS-эндпоинт пока доступен любому аутентифицированному пользователю. RBAC начинается со **схемы**: роли, права и M2M-связи должны существовать до seed и guards.

## Concept

**RBAC в два слоя:** _роли_ (`admin` / `editor` / `viewer`) для coarse guards (**081**), _permissions_ (`posts:read`) для fine-grained проверок (**082**). Slug/key — `varchar` + `UNIQUE` в БД (не PostgreSQL `ENUM`), TypeScript const — контракт в коде для seed и guards.

## Code Changes

- Четыре таблицы: справочники + две join-таблицы с composite PK.
- `user_roles` — M2M: пользователь может иметь несколько ролей.
- `ON DELETE CASCADE` на всех FK — при удалении user/role связи исчезают.
- `RbacModule` только регистрирует entities; сервисы — позже.

## Why This Matters

Guards и seed без таблиц — моки, которые расходятся с prod. Одна миграция фиксирует DDL для dev/staging/prod; сущности TypeORM дают типобезопасные репозитории на **080–082**.

## Architecture Notes

- **Без PG ENUM:** новые роли/права — INSERT, не `ALTER TYPE`.
- **Пустые таблицы до 080:** ожидаемо; guards тестируются после seed.
- **`PermissionKey` stub:** расширится на 082 вместе с `PermissionsGuard`.
- **JWT payload без roles до 084:** access token остаётся `{ sub }`.

## Changed Files

| File                                                                                        | Action                            |
| ------------------------------------------------------------------------------------------- | --------------------------------- |
| `apps/api/src/database/migrations/1748275200000-CreateRolesAndPermissionsSchema.ts`         | created                           |
| `apps/api/src/rbac/*.ts`                                                                    | created — entities, module, const |
| `apps/api/src/rbac/role-slug.spec.ts`                                                       | created                           |
| `apps/api/src/rbac/rbac.module.spec.ts`                                                     | created                           |
| `apps/api/src/app.module.ts`                                                                | changed — `RbacModule`            |
| `docs/lessons/lesson-079-roles-permissions-schema.md`                                       | created                           |
| `docs/development-roadmap.md`                                                               | changed — шаг 079 done            |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` / `docs/LOCAL_SETUP.md` | changed                           |
| `docs/lessons/lesson-078-password-reset-completion.md`                                      | changed — link to 079             |

## Verification

- `npx nx run api:test` — все unit-тесты зелёные.
- `npx nx run api:lint` — без предупреждений.
- `npx nx run api:build` — успешная сборка.
- С поднятым Postgres (`npm run db:up`): `npm run db:migrate` — применяется `CreateRolesAndPermissionsSchema1748275200000`; `\d roles`, `\d user_roles` показывают FK и unique constraints.

## TDD Sequence

- **Red:** specs для `RoleSlug` и компиляции `RbacModule`.
- **Green:** entities, migration, module wiring.
- **Refactor:** без изменения публичного API (сервисов пока нет).

## Definition of Done

- [x] Таблицы `roles`, `permissions`, `role_permissions`, `user_roles` + сущности согласованы с миграцией.
- [x] `RbacModule` в `AppModule`, unit specs.
- [x] `RoleSlug` / `PermissionKey` constants для следующих шагов.
- [x] Auth/JWT без изменений.
- [x] Документация синхронизирована.
- [x] `nx run api:test` green.

## What To Remember

1. **079 = схема only** — данные и guards на 080+.
2. **M2M `user_roles`** — несколько ролей на пользователя.
3. **Slug/key в varchar**, не PG enum — гибче для seed.
4. Coarse guard — [081](./lesson-081-roles-guard.md); следующий — [082](../development-roadmap.md): `PermissionsGuard`.

## Verify

```bash
npx nx run api:test
npx nx run api:lint
npx nx run api:build
npm run db:up
npm run db:migrate
npm run db:migrate:show
```

## Homework

На чистой БД: `db:migrate`, `\d roles`, `\d user_roles`, затем `db:migrate:revert` (последняя миграция) и снова `db:migrate` — проверить симметрию `down`/`up`.
