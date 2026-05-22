# Lesson 080: Seed default roles

## Learning Goal

Заполнить справочник `roles` тремя ролями по умолчанию (`admin`, `editor`, `viewer`) **идемпотентным seed-скриптом**, чтобы guards и e2e RBAC (**081+**) опирались на реальные slug'и в БД.

## Implementation Scope

В скоупе:

- [`apps/api/src/rbac/default-role-records.ts`](../../apps/api/src/rbac/default-role-records.ts) — slug + display name для seed.
- [`apps/api/src/rbac/seed-default-roles.ts`](../../apps/api/src/rbac/seed-default-roles.ts) — `seedDefaultRoles(repo)` с `{ inserted, skipped }`.
- [`apps/api/src/rbac/seed-default-roles.spec.ts`](../../apps/api/src/rbac/seed-default-roles.spec.ts) — unit (tests-first gate).
- [`apps/api/src/database/seeds/run-seed-default-roles.ts`](../../apps/api/src/database/seeds/run-seed-default-roles.ts) — CLI runner через `typeorm-data-source`.
- [`apps/api/package.json`](../../apps/api/package.json) — `seed:roles`; корневой [`package.json`](../../package.json) — `db:seed:roles`.

Намеренно **не** делаем:

- Seed `permissions` / `role_permissions` — [шаг 082](../development-roadmap.md).
- `RolesGuard`, `@Roles()`, назначение ролей пользователям — [081+](../development-roadmap.md).
- Автозапуск seed в `db:migrate` — явный второй шаг после миграций.

## Dependencies

- [Шаг 079](./lesson-079-roles-permissions-schema.md) — таблица `roles`, `RoleSlug`, `RbacModule`.
- [Шаг 059](./lesson-059-migration-workflow-baseline-schema.md) — `db:migrate`, CLI `DataSource`.

## Step-by-Step Changes

1. **Red:** `seed-default-roles.spec.ts` — empty DB, full skip, partial insert.
2. **Green:** `default-role-records`, `seedDefaultRoles`, CLI runner.
3. **Scripts:** `npm run seed:roles` (api), `npm run db:seed:roles` (root).
4. **Verify:** `api:test`, `api:lint`, `api:build`; с Docker — `db:migrate` → `db:seed:roles` (×2).
5. Docs sync: roadmap, storytelling, README, learning-path, LOCAL_SETUP.

## Code Example

```typescript
// apps/api/src/rbac/seed-default-roles.ts
export async function seedDefaultRoles(
  roles: Repository<Role>,
): Promise<SeedDefaultRolesResult> {
  // findOne by slug → save only if missing
}
```

```bash
npm run db:up
npm run db:migrate
npm run db:seed:roles
npm run db:seed:roles   # inserted=0 skipped=3
```

## Context

После **079** таблица `roles` пуста. Coarse `RolesGuard` (**081**) сравнивает slug из JWT/БД с `@Roles('admin')` — без seed проверки живут только в моках. Отдельный скрипт (не data-migration) можно безопасно перезапускать на dev/staging.

## Concept

**Идемпотентный seed:** повторный запуск не дублирует строки благодаря `UNIQUE (slug)` и проверке `findOne` перед `save`. Счётчики `inserted` / `skipped` дают оператору явный feedback в CLI.

## Code Changes

- Три записи: `admin` → Administrator, `editor` → Editor, `viewer` → Viewer.
- Логика в `rbac/`, runner в `database/seeds/` — как миграции vs DDL.
- CLI использует тот же `DataSource`, что `db:migrate` (`DATABASE_URL` из `.env`).

## Why This Matters

Guards и assign-role flows должны видеть **те же slug'и**, что и константы `RoleSlug` в коде. Seed фиксирует контракт «что в БД» для всех окружений после `db:migrate`.

## Architecture Notes

- **Без Nest bootstrap** — быстрый one-shot CLI, без HTTP.
- **Permissions пусты до 082** — seed только `roles`.
- **Не в CI по умолчанию** — явный `db:seed:roles` после migrate в LOCAL_SETUP; prod — отдельный runbook.

## Changed Files

| File                                                                                        | Action                    |
| ------------------------------------------------------------------------------------------- | ------------------------- |
| `apps/api/src/rbac/default-role-records.ts`                                                 | created                   |
| `apps/api/src/rbac/seed-default-roles.ts`                                                   | created                   |
| `apps/api/src/rbac/seed-default-roles.spec.ts`                                              | created                   |
| `apps/api/src/rbac/index.ts`                                                                | changed — exports         |
| `apps/api/src/database/seeds/run-seed-default-roles.ts`                                     | created                   |
| `apps/api/package.json`                                                                     | changed — `seed:roles`    |
| `package.json`                                                                              | changed — `db:seed:roles` |
| `docs/lessons/lesson-080-seed-default-roles.md`                                             | created                   |
| `docs/development-roadmap.md`                                                               | changed — шаг 080 done    |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` / `docs/LOCAL_SETUP.md` | changed                   |
| `docs/lessons/lesson-079-roles-permissions-schema.md`                                       | changed — link to 081     |

## Verification

- `npx nx run api:test` — все unit-тесты зелёные.
- `npx nx run api:lint` — без предупреждений.
- `npx nx run api:build` — успешная сборка.
- С Postgres: `npm run db:seed:roles` → `inserted=3 skipped=0`; повтор → `inserted=0 skipped=3`; `SELECT slug, name FROM roles ORDER BY slug` — три строки.

## TDD Sequence

- **Red:** specs для idempotent insert/skip.
- **Green:** `seedDefaultRoles`, records, CLI.
- **Refactor:** без изменения публичного контракта.

## Definition of Done

- [x] `seedDefaultRoles` вставляет `admin`, `editor`, `viewer` и идемпотентен.
- [x] `db:seed:roles` / `seed:roles` в package.json.
- [x] Unit specs в том же change set, что production code.
- [x] Auth/JWT/guards без изменений.
- [x] Документация синхронизирована.
- [x] `nx run api:test` green.

## What To Remember

1. **080 = данные roles only** — permissions и guards на 081–082.
2. **Seed после migrate** — не смешивать с DDL-миграциями.
3. **Идемпотентность по slug** — безопасный повтор на dev.
4. Coarse guard — [081](./lesson-081-roles-guard.md); fine-grained — [082](./lesson-082-permissions-guard.md).

## Verify

```bash
npx nx run api:test
npx nx run api:lint
npx nx run api:build
npm run db:up
npm run db:migrate
npm run db:seed:roles
npm run db:seed:roles
```

## Homework

На чистой БД после `db:reset && db:up`: migrate → seed → `\d roles` → seed снова (только skipped) → удалить одну роль вручную → seed (inserted=1).
