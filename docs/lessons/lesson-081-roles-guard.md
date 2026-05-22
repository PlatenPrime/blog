# Lesson 081: `RolesGuard` + `@Roles()`

## Learning Goal

Добавить **coarse RBAC** на HTTP: декоратор `@Roles()` и `RolesGuard`, который сверяет slug ролей пользователя из БД (`user_roles` → `roles`) с требованиями маршрута; проверить **401 / 200 / 403** через e2e probe.

## Implementation Scope

В скоупе:

- [`apps/api/src/rbac/roles-metadata.constants.ts`](../../apps/api/src/rbac/roles-metadata.constants.ts) — `ROLES_KEY`.
- [`apps/api/src/rbac/roles.decorator.ts`](../../apps/api/src/rbac/roles.decorator.ts) — `@Roles(...RoleSlug[])`.
- [`apps/api/src/rbac/roles-guard.constants.ts`](../../apps/api/src/rbac/roles-guard.constants.ts) — сообщение 403.
- [`apps/api/src/rbac/user-roles.service.ts`](../../apps/api/src/rbac/user-roles.service.ts) — `findRoleSlugsByUserId`.
- [`apps/api/src/rbac/user-roles.service.spec.ts`](../../apps/api/src/rbac/user-roles.service.spec.ts) — unit.
- [`apps/api/src/rbac/roles.guard.ts`](../../apps/api/src/rbac/roles.guard.ts) — `CanActivate` + `Reflector`.
- [`apps/api/src/rbac/roles.guard.spec.ts`](../../apps/api/src/rbac/roles.guard.spec.ts) — unit.
- [`apps/api/src/rbac/rbac-probe.controller.ts`](../../apps/api/src/rbac/rbac-probe.controller.ts) — `GET rbac/_probe/admin`.
- [`apps/api/src/rbac/rbac.module.ts`](../../apps/api/src/rbac/rbac.module.ts) — `AuthModule`, providers, controller.
- [`apps/api/src/rbac/index.ts`](../../apps/api/src/rbac/index.ts) — exports.
- [`apps/api/test/auth-roles-guard.e2e-spec.ts`](../../apps/api/test/auth-roles-guard.e2e-spec.ts) — e2e.

Намеренно **не** делаем:

- `PermissionsGuard`, seed permissions — [шаг 082](../development-roadmap.md).
- CMS-маршруты — [шаг 083](../development-roadmap.md).
- Роли в JWT payload — [шаг 084](../development-roadmap.md).
- CLI seed `user_roles` / assign role при register.

## Dependencies

- [Шаг 079](./lesson-079-roles-permissions-schema.md) — `user_roles`, `RoleSlug`, `RbacModule`.
- [Шаг 080](./lesson-080-seed-default-roles.md) — seed slug'ов в `roles`.
- [Шаг 067](./lesson-067-jwt-strategy-auth-guard.md) — `JwtAuthGuard`, Bearer.

## Step-by-Step Changes

1. **Red:** `roles.guard.spec.ts`, `user-roles.service.spec.ts`, `auth-roles-guard.e2e-spec.ts`.
2. **Green:** `@Roles()`, `RolesGuard`, `UserRolesService`, probe controller, module wiring.
3. **Verify:** `api:test`, `api:lint`, `api:build`.
4. Docs sync: roadmap, storytelling, README, learning-path, LOCAL_SETUP.

## Code Example

```typescript
// apps/api/src/rbac/rbac-probe.controller.ts
@Get('_probe/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleSlug.Admin)
adminProbe(): RbacAdminProbeResponse {
  return { ok: true };
}
```

```bash
npx nx run api:test
```

## Context

После **080** slug'и ролей есть в БД, но JWT по-прежнему несёт только `sub`. Guard загружает роли пользователя из M2M `user_roles` и отклоняет запрос с **403 FORBIDDEN** (Problem Details), если ни одна из `@Roles()` не совпала (логика **OR**).

## Concept

**Coarse vs fine-grained:** роли (`admin` / `editor` / `viewer`) — первый фильтр на маршруте; permissions (`posts:write`) — на **082**. Guard без metadata на handler пропускает запрос — RBAC включается только там, где явно указан `@Roles()`.

## Code Changes

- `UserRolesService` — join `user_roles` + `role`, фильтр неизвестных slug.
- `RolesGuard` — после `JwtAuthGuard`; `ForbiddenException` → `API_ERROR_CODE_FORBIDDEN`.
- Probe `GET /api/v1/rbac/_probe/admin` — временный контракт для e2e до CMS (**083**).
- E2E мокает `UserRolesService` (stub `DataSource` без реального Postgres).

## Why This Matters

Без guard любой аутентифицированный пользователь равноправен. Coarse `RolesGuard` — минимальный слой перед CMS и `PermissionsGuard`, переиспользуемый на любых контроллерах через `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles()`.

## Architecture Notes

- **Роли из БД, не из JWT** — до **084** токен не дублирует claims; один источник правды в `user_roles`.
- **`RbacModule` импортирует `AuthModule`** — для `JwtAuthGuard` на probe; обратного импорта нет (нет circular).
- **Пустые `user_roles` в dev** — probe вернёт 403 после login; назначение ролей — отдельный шаг.

## Changed Files

| File                                                                                        | Action                  |
| ------------------------------------------------------------------------------------------- | ----------------------- |
| `apps/api/src/rbac/roles-metadata.constants.ts`                                             | created                 |
| `apps/api/src/rbac/roles-guard.constants.ts`                                                | created                 |
| `apps/api/src/rbac/roles.decorator.ts`                                                      | created                 |
| `apps/api/src/rbac/user-roles.service.ts`                                                   | created                 |
| `apps/api/src/rbac/user-roles.service.spec.ts`                                              | created                 |
| `apps/api/src/rbac/roles.guard.ts`                                                          | created                 |
| `apps/api/src/rbac/roles.guard.spec.ts`                                                     | created                 |
| `apps/api/src/rbac/rbac-probe.controller.ts`                                                | created                 |
| `apps/api/src/rbac/rbac.module.ts`                                                          | changed                 |
| `apps/api/src/rbac/rbac.module.spec.ts`                                                     | changed — global Config |
| `apps/api/src/rbac/index.ts`                                                                | changed — exports       |
| `apps/api/test/auth-roles-guard.e2e-spec.ts`                                                | created                 |
| `docs/lessons/lesson-081-roles-guard.md`                                                    | created                 |
| `docs/development-roadmap.md`                                                               | changed — шаг 081 done  |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` / `docs/LOCAL_SETUP.md` | changed                 |
| `docs/lessons/lesson-080-seed-default-roles.md`                                             | changed — link to 082   |

## Verification

- `npx nx run api:test` — unit + e2e зелёные.
- `npx nx run api:lint` — без предупреждений.
- `npx nx run api:build` — успешная сборка.

## TDD Sequence

- **Red:** specs guard/service + e2e probe.
- **Green:** implementation + module wiring.
- **Refactor:** без изменения HTTP-контракта probe.

## Definition of Done

- [x] `@Roles()` + `RolesGuard` с OR-логикой и загрузкой slug из БД.
- [x] `UserRolesService.findRoleSlugsByUserId` + unit specs.
- [x] Probe `GET /api/v1/rbac/_probe/admin` + e2e 401/200/403.
- [x] `RolesGuard` / `UserRolesService` экспортируются из `RbacModule`.
- [x] Документация синхронизирована.
- [x] `nx run api:test` green.

## What To Remember

1. **081 = coarse roles only** — permissions на 082.
2. **Guard после JWT** — `req.user.sub` для lookup в `user_roles`.
3. **E2E мокает role lookup** — не требует seed `user_roles`.
4. Следующий шаг — [083](../development-roadmap.md): sample CMS route protected by RBAC ([082](./lesson-082-permissions-guard.md) — `PermissionsGuard`).

## Verify

```bash
npx nx run api:test
npx nx run api:lint
npx nx run api:build
```

## Homework

На dev с Postgres: `db:seed:roles`, вручную вставить строку в `user_roles` для своего `user_id` с `role_id` admin → login → `curl -H "Authorization: Bearer …" http://127.0.0.1:4000/api/v1/rbac/_probe/admin` → `{ "ok": true }`.
