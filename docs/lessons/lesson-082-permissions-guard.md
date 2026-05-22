# Lesson 082: Fine-grained `PermissionsGuard` + constants

## Learning Goal

Добавить **fine-grained RBAC** на HTTP: декоратор `@Permissions()`, `PermissionsGuard`, загрузку permission keys из БД (`user_roles` → `role_permissions` → `permissions`), idempotent seed permissions + `role_permissions`, probe и e2e **401 / 200 / 403**.

## Implementation Scope

В скоупе:

- [`apps/api/src/rbac/permissions-metadata.constants.ts`](../../apps/api/src/rbac/permissions-metadata.constants.ts) — `PERMISSIONS_KEY`.
- [`apps/api/src/rbac/permissions.decorator.ts`](../../apps/api/src/rbac/permissions.decorator.ts) — `@Permissions(...PermissionKey[])`.
- [`apps/api/src/rbac/permissions-guard.constants.ts`](../../apps/api/src/rbac/permissions-guard.constants.ts) — сообщение 403.
- [`apps/api/src/rbac/permission-key.ts`](../../apps/api/src/rbac/permission-key.ts) — `DEFAULT_PERMISSION_KEYS`.
- [`apps/api/src/rbac/user-permissions.service.ts`](../../apps/api/src/rbac/user-permissions.service.ts) — `findPermissionKeysByUserId`.
- [`apps/api/src/rbac/user-permissions.service.spec.ts`](../../apps/api/src/rbac/user-permissions.service.spec.ts) — unit.
- [`apps/api/src/rbac/permissions.guard.ts`](../../apps/api/src/rbac/permissions.guard.ts) — `CanActivate` + `Reflector`.
- [`apps/api/src/rbac/permissions.guard.spec.ts`](../../apps/api/src/rbac/permissions.guard.spec.ts) — unit.
- [`apps/api/src/rbac/default-permission-records.ts`](../../apps/api/src/rbac/default-permission-records.ts) — seed records.
- [`apps/api/src/rbac/default-role-permission-records.ts`](../../apps/api/src/rbac/default-role-permission-records.ts) — матрица role → permissions.
- [`apps/api/src/rbac/seed-default-permissions.ts`](../../apps/api/src/rbac/seed-default-permissions.ts) — idempotent permissions.
- [`apps/api/src/rbac/seed-default-role-permissions.ts`](../../apps/api/src/rbac/seed-default-role-permissions.ts) — idempotent `role_permissions`.
- [`apps/api/src/rbac/seed-default-permissions.spec.ts`](../../apps/api/src/rbac/seed-default-permissions.spec.ts) — unit.
- [`apps/api/src/database/seeds/run-seed-default-permissions.ts`](../../apps/api/src/database/seeds/run-seed-default-permissions.ts) — CLI runner.
- [`apps/api/src/rbac/rbac-probe.controller.ts`](../../apps/api/src/rbac/rbac-probe.controller.ts) — `GET rbac/_probe/posts-write`.
- [`apps/api/src/rbac/rbac.module.ts`](../../apps/api/src/rbac/rbac.module.ts) — providers, exports.
- [`apps/api/src/rbac/index.ts`](../../apps/api/src/rbac/index.ts) — exports.
- [`apps/api/test/auth-permissions-guard.e2e-spec.ts`](../../apps/api/test/auth-permissions-guard.e2e-spec.ts) — e2e.
- `apps/api/package.json`, root `package.json` — `seed:permissions`, `db:seed:permissions`.

Намеренно **не** делаем:

- CMS-маршруты — [шаг 083](./lesson-083-sample-cms-route-rbac.md) (выполнен).
- Permissions/roles в JWT payload — [шаг 084](../development-roadmap.md).
- CLI seed `user_roles` / assign role при register.
- Комбинация `@Roles()` + `@Permissions()` на одном handler — не обязательна для 082.

## Dependencies

- [Шаг 079](./lesson-079-roles-permissions-schema.md) — `permissions`, `role_permissions`, `PermissionKey`.
- [Шаг 080](./lesson-080-seed-default-roles.md) — `db:seed:roles` перед `db:seed:permissions`.
- [Шаг 081](./lesson-081-roles-guard.md) — `JwtAuthGuard`, probe pattern, e2e mocks.

## Step-by-Step Changes

1. **Red:** `permissions.guard.spec.ts`, `user-permissions.service.spec.ts`, `permission-key.spec.ts`, `seed-default-permissions.spec.ts`, `auth-permissions-guard.e2e-spec.ts`.
2. **Green:** `@Permissions()`, `PermissionsGuard`, `UserPermissionsService`, seed, probe, module wiring.
3. **Scripts:** `npm run seed:permissions` (api), `npm run db:seed:permissions` (root).
4. **Verify:** `api:test`, `api:lint`, `api:build`.
5. Docs sync: roadmap, storytelling, README, learning-path, LOCAL_SETUP.

## Code Example

```typescript
// apps/api/src/rbac/rbac-probe.controller.ts
@Get('_probe/posts-write')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions(PermissionKey.PostsWrite)
postsWriteProbe(): RbacPostsWriteProbeResponse {
  return { ok: true };
}
```

```bash
npm run db:migrate
npm run db:seed:roles
npm run db:seed:permissions
npx nx run api:test
```

## Context

После **081** маршрут можно закрыть ролью, но внутри роли `editor` и `viewer` нужны разные права на посты. Guard загружает **permission keys** через роли пользователя и отклоняет запрос с **403 FORBIDDEN**, если ни один из `@Permissions()` не совпал (логика **OR**).

## Concept

**Coarse vs fine-grained:** `RolesGuard` — первый фильтр (`admin` / `editor` / `viewer`); `PermissionsGuard` — второй (`posts:read`, `posts:write`). Guard без metadata пропускает запрос — RBAC включается только там, где явно указан `@Permissions()`.

## Code Changes

- `UserPermissionsService` — QueryBuilder join `user_roles` → `role_permissions` → `permissions`, фильтр неизвестных keys.
- `PermissionsGuard` — после `JwtAuthGuard`; отдельное сообщение 403 от role guard.
- Probe `GET /api/v1/rbac/_probe/posts-write` — временный контракт для e2e до CMS (**083**).
- Seed: `posts:read` / `posts:write`; admin+editor — read+write, viewer — read only.
- E2E мокает `UserPermissionsService` (без реального Postgres).

## Why This Matters

CMS-эндпоинты (Track 3) будут требовать `posts:write`, а публичное чтение — `posts:read`. Fine-grained guard переиспользуется на любых контроллерах через `@UseGuards(JwtAuthGuard, PermissionsGuard)` + `@Permissions()`.

## Architecture Notes

- **Права из БД, не из JWT** — до **084** токен не дублирует claims.
- **`db:seed:permissions` после `db:seed:roles`** — `seedDefaultRolePermissions` резолвит `role_id` по slug.
- **Пустые `user_roles` в dev** — probe вернёт 403 после login без назначения ролей; e2e не зависит от seed.

## Changed Files

| File                                                                                        | Action                 |
| ------------------------------------------------------------------------------------------- | ---------------------- |
| `apps/api/src/rbac/permissions-metadata.constants.ts`                                       | created                |
| `apps/api/src/rbac/permissions-guard.constants.ts`                                          | created                |
| `apps/api/src/rbac/permissions.decorator.ts`                                                | created                |
| `apps/api/src/rbac/permission-key.ts`                                                       | changed                |
| `apps/api/src/rbac/permission-key.spec.ts`                                                  | created                |
| `apps/api/src/rbac/user-permissions.service.ts`                                             | created                |
| `apps/api/src/rbac/user-permissions.service.spec.ts`                                        | created                |
| `apps/api/src/rbac/permissions.guard.ts`                                                    | created                |
| `apps/api/src/rbac/permissions.guard.spec.ts`                                               | created                |
| `apps/api/src/rbac/default-permission-records.ts`                                           | created                |
| `apps/api/src/rbac/default-role-permission-records.ts`                                      | created                |
| `apps/api/src/rbac/seed-default-permissions.ts`                                             | created                |
| `apps/api/src/rbac/seed-default-role-permissions.ts`                                        | created                |
| `apps/api/src/rbac/seed-default-permissions.spec.ts`                                        | created                |
| `apps/api/src/database/seeds/run-seed-default-permissions.ts`                               | created                |
| `apps/api/src/rbac/rbac-probe.controller.ts`                                                | changed                |
| `apps/api/src/rbac/rbac.module.ts`                                                          | changed                |
| `apps/api/src/rbac/index.ts`                                                                | changed                |
| `apps/api/test/auth-permissions-guard.e2e-spec.ts`                                          | created                |
| `apps/api/package.json` / `package.json`                                                    | changed — seed scripts |
| `docs/lessons/lesson-082-permissions-guard.md`                                              | created                |
| `docs/development-roadmap.md`                                                               | changed — шаг 082 done |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` / `docs/LOCAL_SETUP.md` | changed                |
| `docs/lessons/lesson-081-roles-guard.md`                                                    | changed — link to 083  |

## Verification

- `npx nx run api:test` — unit + e2e зелёные.
- `npx nx run api:lint` — без предупреждений.
- `npx nx run api:build` — успешная сборка.

## TDD Sequence

- **Red:** specs guard/service/seed + e2e probe.
- **Green:** implementation + module wiring + seed CLI.
- **Refactor:** без изменения HTTP-контракта probe.

## Definition of Done

- [x] `@Permissions()` + `PermissionsGuard` с OR-логикой и загрузкой keys из БД.
- [x] `UserPermissionsService.findPermissionKeysByUserId` + unit specs.
- [x] Probe `GET /api/v1/rbac/_probe/posts-write` + e2e 401/200/403.
- [x] Idempotent seed permissions + `role_permissions` + `db:seed:permissions`.
- [x] `PermissionsGuard` / `UserPermissionsService` экспортируются из `RbacModule`.
- [x] Документация синхронизирована.
- [x] `nx run api:test` green.

## What To Remember

1. **082 = fine-grained permissions** — roles остаются на `RolesGuard` (081).
2. **Guard после JWT** — `req.user.sub` для lookup через `user_roles` → roles → permissions.
3. **E2E мокает permission lookup** — не требует seed `user_roles`.
4. **Seed order:** `db:seed:roles` → `db:seed:permissions`.
5. Следующий шаг — [084](../development-roadmap.md): JWT payload shape в `shared-contracts` ([083](./lesson-083-sample-cms-route-rbac.md) — sample CMS route).

## Verify

```bash
npx nx run api:test
npx nx run api:lint
npx nx run api:build
```

## Homework

На dev с Postgres: `db:seed:roles`, `db:seed:permissions`, вручную вставить `user_roles` для editor → login → `curl -H "Authorization: Bearer …" http://127.0.0.1:4000/api/v1/rbac/_probe/posts-write` → `{ "ok": true }`; viewer (только `posts:read`) → **403**.
