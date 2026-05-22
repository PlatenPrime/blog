# Lesson 083: Sample CMS route protected by RBAC

## Learning Goal

Добавить **первый продуктовый CMS-маршрут** под префиксом `cms`: `GET /api/v1/cms/posts` с `JwtAuthGuard` + `PermissionsGuard` (`posts:read`), stub-ответ `{ items: [] }` и e2e **401 / 200 / 403** — по образцу probe из **082**, но на реальном пути для Track 3.

## Implementation Scope

В скоупе:

- [`apps/api/src/cms/cms-posts.service.ts`](../../apps/api/src/cms/cms-posts.service.ts) — stub `listPosts()`.
- [`apps/api/src/cms/cms-posts.service.spec.ts`](../../apps/api/src/cms/cms-posts.service.spec.ts) — unit.
- [`apps/api/src/cms/cms-posts.controller.ts`](../../apps/api/src/cms/cms-posts.controller.ts) — `GET cms/posts`, `@Permissions(PermissionKey.PostsRead)`.
- [`apps/api/src/cms/cms.module.ts`](../../apps/api/src/cms/cms.module.ts) — `AuthModule`, `RbacModule`.
- [`apps/api/src/cms/index.ts`](../../apps/api/src/cms/index.ts) — exports.
- [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts) — `CmsModule`.
- [`apps/api/test/cms-posts-rbac.e2e-spec.ts`](../../apps/api/test/cms-posts-rbac.e2e-spec.ts) — e2e.

Намеренно **не** делаем:

- `Post` entity, миграции, CRUD — [шаг 105](../development-roadmap.md)+.
- `@Roles()` на том же handler.
- Permissions/roles в JWT — [шаг 084](../development-roadmap.md).
- CLI назначения `user_roles` при register.
- Изменения `shared-contracts`.
- Удаление `rbac/_probe` (probe остаётся для изолированной проверки RBAC).

## Dependencies

- [Шаг 082](./lesson-082-permissions-guard.md) — `PermissionsGuard`, `@Permissions()`, `PermissionKey`, seed permissions.
- [Шаг 067](./lesson-067-jwt-strategy-auth-guard.md) — `JwtAuthGuard`, Bearer login.

## Step-by-Step Changes

1. **Red:** `cms-posts.service.spec.ts`, `cms-posts-rbac.e2e-spec.ts`.
2. **Green:** `CmsPostsService`, `CmsPostsController`, `CmsModule`, `AppModule` wiring.
3. **Verify:** `api:test`, `api:lint`, `api:build`.
4. Docs sync: roadmap, storytelling, README, learning-path, LOCAL_SETUP.

## Code Example

```typescript
// apps/api/src/cms/cms-posts.controller.ts
@Get()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions(PermissionKey.PostsRead)
listPosts(): CmsPostsListResponse {
  return this.cmsPosts.listPosts();
}
```

```bash
npx nx run api:test
```

## Context

После **082** fine-grained RBAC проверен на probe `GET /api/v1/rbac/_probe/posts-write`. Редакции нужен маршрут под **`cms`**, а не `_probe`, чтобы Track 3 (сущность `Post` на **105**) наследовал тот же паттерн guards.

## Concept

**Probe vs продуктовый маршрут:** probe — лабораторный контракт для e2e RBAC; `cms/posts` — образец для будущих CMS-контроллеров. Оба используют одинаковый стек `JwtAuthGuard` → `PermissionsGuard` → lookup keys из БД.

## Code Changes

- `CmsModule` импортирует `AuthModule` + `RbacModule` (как probe в `RbacModule`).
- `GET /api/v1/cms/posts` требует `posts:read`; viewer (read only) — **200**; пользователь только с `posts:write` — **403**.
- Stub `{ items: [] }` до появления `Post` entity.
- E2E мокает `UserPermissionsService` (без реального Postgres).

## Why This Matters

Track 3 начнёт с домена постов; **083** фиксирует, что CMS-маршруты с самого начала закрыты permissions, а не «добавим guards потом».

## Architecture Notes

- **Права из БД, не из JWT** — до **084** токен не дублирует claims.
- **Пустые `user_roles` в dev** — после login без ролей `cms/posts` вернёт **403**; e2e не зависит от seed.
- **Probe не удаляем** — существующие e2e **081–082** остаются стабильными.

## Changed Files

| File                                                                                        | Action                 |
| ------------------------------------------------------------------------------------------- | ---------------------- |
| `apps/api/src/cms/cms-posts.service.ts`                                                     | created                |
| `apps/api/src/cms/cms-posts.service.spec.ts`                                                | created                |
| `apps/api/src/cms/cms-posts.controller.ts`                                                  | created                |
| `apps/api/src/cms/cms.module.ts`                                                            | created                |
| `apps/api/src/cms/index.ts`                                                                 | created                |
| `apps/api/src/app.module.ts`                                                                | changed                |
| `apps/api/test/cms-posts-rbac.e2e-spec.ts`                                                  | created                |
| `docs/lessons/lesson-083-sample-cms-route-rbac.md`                                          | created                |
| `docs/development-roadmap.md`                                                               | changed — шаг 083 done |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` / `docs/LOCAL_SETUP.md` | changed                |
| `docs/lessons/lesson-082-permissions-guard.md`                                              | changed — link to 084  |

## Verification

- `npx nx run api:test` — unit + e2e зелёные.
- `npx nx run api:lint` — без предупреждений.
- `npx nx run api:build` — успешная сборка.

## TDD Sequence

- **Red:** `cms-posts.service.spec.ts` + `cms-posts-rbac.e2e-spec.ts`.
- **Green:** CMS module + controller + service + `AppModule`.
- **Refactor:** без изменения HTTP-контракта.

## Definition of Done

- [x] `GET /api/v1/cms/posts` требует JWT + `posts:read`.
- [x] E2e: 403 при `posts:write` без `posts:read`.
- [x] Unit spec для `CmsPostsService`.
- [x] `CmsModule` в `AppModule`.
- [x] Документация синхронизирована.
- [x] `nx run api:test` green.

## What To Remember

1. **083 = CMS-оболочка маршрута**, не домен постов (это **105+**).
2. **Guard после JWT** — тот же порядок, что на probe **082**.
3. **E2E мокает permission lookup** — не требует seed `user_roles`.
4. **Probe остаётся** — `cms/posts` дополняет, не заменяет `_probe`.
5. Следующий шаг — [084](../development-roadmap.md): JWT payload shape в `shared-contracts`.

## Verify

```bash
npx nx run api:test
npx nx run api:lint
npx nx run api:build
```

## Homework

На dev с Postgres: `db:seed:roles`, `db:seed:permissions`, вручную вставить `user_roles` для viewer → login → `curl -H "Authorization: Bearer …" http://127.0.0.1:4000/api/v1/cms/posts` → `{ "items": [] }`; пользователь только с `posts:write` (без read в `role_permissions`) → **403**.
