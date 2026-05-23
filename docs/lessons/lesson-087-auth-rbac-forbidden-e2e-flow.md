# Lesson 087: Auth e2e RBAC forbidden

## Learning Goal

Добавить **сквозной e2e** `register → login → GET /cms/posts` с **403** (и контрастный **200** при `posts:read`): один экземпляр приложения, общие in-memory `UserService` и `UserPermissionsService`, **реальный** Argon2 и JWT — в отличие от [`cms-posts-rbac.e2e-spec.ts`](../../apps/api/test/cms-posts-rbac.e2e-spec.ts), где пользователь статический и `sub` не связан с register.

## Implementation Scope

В скоупе:

- [`apps/api/test/helpers/auth-e2e-in-memory-permissions-store.ts`](../../apps/api/test/helpers/auth-e2e-in-memory-permissions-store.ts) — stateful `UserPermissionsService` override (`Map` userId → keys, `setPermissionKeysForUser` для тестов).
- [`apps/api/test/auth-register-login-cms-rbac-flow.e2e-spec.ts`](../../apps/api/test/auth-register-login-cms-rbac-flow.e2e-spec.ts) — три сценария: нет прав → 403; только `posts:write` → 403; `posts:read` → 200.

Намеренно **не** делаем:

- Реальный Postgres / seed `user_roles` в CI (как в 085/086 — `DataSource` stub).
- `RolesGuard`, probe routes, 401 без Bearer — уже в `cms-posts-rbac.e2e-spec.ts` и **082**.
- Logout, verify-email flow — шаг **098**.
- Изменения `apps/api/src/` (только `test/`).

## Dependencies

- [Шаг 085](./lesson-085-auth-register-login-e2e-flow.md) — in-memory user store, register → login.
- [Шаг 083](./lesson-083-sample-cms-route-rbac.md) — `GET /cms/posts`, `@Permissions(posts:read)`.
- [Шаг 082](./lesson-082-permissions-guard.md) — `PermissionsGuard`, Problem Details 403.
- [Шаг 084](./lesson-084-jwt-payload-shared-contracts.md) — JWT `sub` = user id для lookup прав.

## Step-by-Step Changes

1. **Red:** `auth-register-login-cms-rbac-flow.e2e-spec.ts` без in-memory permissions store.
2. `createInMemoryUserPermissionsServiceOverride()` — `findPermissionKeysByUserId` + `setPermissionKeysForUser`.
3. Bootstrap: как 085, override `UserPermissionsService` stateful, `UserService` in-memory, token-сервисы — mock.
4. **Green:** `it` 403 без прав (assert lookup по `registerBody.id`).
5. **Green:** `it` 403 при только `posts:write`.
6. **Green:** `it` 200 при `posts:read`.
7. Docs sync: roadmap, storytelling (глава XIV), README, learning-path, LOCAL_SETUP.

## Code Example

```typescript
// apps/api/test/auth-register-login-cms-rbac-flow.e2e-spec.ts (фрагмент)
const inMemoryPermissions = createInMemoryUserPermissionsServiceOverride();

await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(UserService)
  .useValue(inMemoryUsers)
  .overrideProvider(UserPermissionsService)
  .useValue(inMemoryPermissions)
  .compile();

const { registerBody, loginBody } = await registerAndLogin(email, password);
await request(app)
  .get(cmsPostsBase)
  .set('Authorization', `Bearer ${loginBody.accessToken}`)
  .expect(403);

inMemoryPermissions.setPermissionKeysForUser(registerBody.id, [
  PermissionKey.PostsRead,
]);
await request(app)
  .get(cmsPostsBase)
  .set('Authorization', `Bearer ${loginBody.accessToken}`)
  .expect(200);
```

```bash
npx nx run api:test:e2e -- auth-register-login-cms-rbac-flow.e2e-spec.ts
```

## Context

Урок **083** проверяет CMS RBAC **изолированно** с `fakeUser` и ручным `mockResolvedValue` на permissions. Это быстрый CI, но не ловит рассинхрон: id после register ≠ `sub` в JWT ≠ `findPermissionKeysByUserId(userId)`. Шаг **087** — третья «страховка» flow e2e в главе XIV после **085** (hash/login) и **086** (refresh).

## Concept

**Изолированный e2e vs flow e2e (RBAC):** первый проверяет контракт guard'а и Problem Details на фиксированном user id; второй — что access JWT из login несёт `sub` зарегистрированного пользователя и guard запрашивает права именно для него.

## Code Changes

- По умолчанию permissions пусты (как нет `user_roles` после register).
- `posts:write` без `posts:read` — **403** (маршрут требует read).
- После `setPermissionKeysForUser` с `posts:read` — **200** `{ items: [] }` без повторного login (права не в JWT).

## Why This Matters

Без flow e2e можно «зеленить» RBAC на статическом пользователе, пока register и JWT sub используют разные id. Сквозной тест — минимальная уверенность, что auth и авторизация **склеены** перед Track 3 (посты на том же CMS-пути).

## Architecture Notes

- **Helper только в `test/`** — tests-first gate на `apps/api/src/` не срабатывает.
- **Реальный JWT** из DI; lookup прав — через override `UserPermissionsService`, не Postgres.
- **Изолированный cms-posts-rbac** остаётся для 401 и быстрых негативов.

## Changed Files

| File                                                                                        | Action  |
| ------------------------------------------------------------------------------------------- | ------- |
| `apps/api/test/helpers/auth-e2e-in-memory-permissions-store.ts`                             | created |
| `apps/api/test/auth-register-login-cms-rbac-flow.e2e-spec.ts`                               | created |
| `docs/lessons/lesson-087-auth-rbac-forbidden-e2e-flow.md`                                   | created |
| `docs/development-roadmap.md`                                                               | changed |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` / `docs/LOCAL_SETUP.md` | changed |

## Verification

- `npx nx run api:test:e2e -- auth-register-login-cms-rbac-flow.e2e-spec.ts` — 3 passed.
- `npx nx run api:test:e2e` — все e2e зелёные.

## TDD Sequence

- **Red:** flow spec без in-memory permissions (403 не сходится с реальным sub).
- **Green:** helper + overrides + три `it`.
- **Refactor:** `registerAndLogin` helper в spec.

## Definition of Done

- [x] Сквозной register → login → cms 403 (нет прав, write-only) зелёный.
- [x] Контрастный 200 при `posts:read` на том же access token.
- [x] Lookup permissions по id из register.
- [x] Документация синхронизирована.
- [x] `nx run api:test:e2e` green.

## What To Remember

1. **Flow e2e RBAC** дополняет `cms-posts-rbac.e2e-spec.ts`, не заменяет.
2. **Права не в JWT** — guard всегда ходит в `UserPermissionsService` по `sub`.
3. **Пустые permissions** после register — ожидаемый prod-like сценарий до назначения ролей.
4. Глава XIV (085–087) закрыта; audit events — [089](./lesson-089-audit-events-auth-mutations.md) (схема — [088](./lesson-088-security-audit-log-table.md)).

## Verify

```bash
npx nx run api:test:e2e -- auth-register-login-cms-rbac-flow.e2e-spec.ts
npx nx run api:test:e2e
```

## Homework

Сравните `cms-posts-rbac.e2e-spec.ts` и `auth-register-login-cms-rbac-flow.e2e-spec.ts`: почему во flow-тесте нельзя использовать `fakeUser`, и что сломается, если `JwtStrategy` положит в `sub` email вместо user id?
