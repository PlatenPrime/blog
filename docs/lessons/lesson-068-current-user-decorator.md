# Lesson 068: `@CurrentUser()` decorator

## Learning Goal

Добавить **параметрический декоратор** `@CurrentUser()` для чтения `req.user` (`AuthRequestUser`) после `JwtAuthGuard` — без `@Req()` и ручной типизации Express `Request`.

## Implementation Scope

В скоупе:

- [`apps/api/src/auth/current-user.decorator.ts`](../../apps/api/src/auth/current-user.decorator.ts) — `getAuthRequestUser`, `CurrentUser` через `createParamDecorator`.
- [`apps/api/src/auth/current-user.decorator.spec.ts`](../../apps/api/src/auth/current-user.decorator.spec.ts) — unit (tests-first gate).
- [`apps/api/src/auth/auth.controller.ts`](../../apps/api/src/auth/auth.controller.ts) — `GET /auth/me` на `@CurrentUser() user`.

Намеренно **не** делаем:

- Refresh / logout — [шаги 069–071](../development-roadmap.md).
- `UserService.findById`, полный профиль на `/me`.
- RBAC, `@Roles()` — [шаг 081+](../development-roadmap.md).
- Новый e2e (регрессия — существующий `auth-jwt-guard.e2e-spec.ts`).
- Изменения `shared-contracts`.

## Dependencies

- [Шаг 067](./lesson-067-jwt-strategy-auth-guard.md) — `JwtStrategy` кладёт payload в `req.user`, `GET /auth/me` с `JwtAuthGuard`.
- `@nestjs/common` — `createParamDecorator`, `ExecutionContext`.

## Step-by-Step Changes

1. **Red:** `current-user.decorator.spec.ts` — `getAuthRequestUser` с моком `ExecutionContext`.
2. `getAuthRequestUser(ctx)` — `ctx.switchToHttp().getRequest().user`.
3. `CurrentUser = createParamDecorator(...)` — делегирует в helper (тестируем helper напрямую).
4. Рефактор `AuthController.me`: `@CurrentUser() user: AuthRequestUser` → `{ id: user.sub }`.
5. **Verify:** `api:test`, `api:lint`, `api:build`.
6. Синхронизировать roadmap, storytelling, README, learning-path, LOCAL_SETUP.

## Context

После 067 `/me` работает через `@Req() req` и `req.user.sub`. Для будущих CMS-контроллеров (RBAC) нужен переиспользуемый декоратор — стандартный Nest-паттерн рядом с экспортируемым `JwtAuthGuard`.

## Concept

**`createParamDecorator`** читает `ExecutionContext` на этапе вызова handler’а. **`getAuthRequestUser`** вынесен отдельно, чтобы unit-тесты не поднимали `TestingModule`. Декоратор **не** дублирует verify JWT — только читает то, что уже положила `JwtStrategy` под guard’ом.

## Code Changes

- `getAuthRequestUser(ctx)` → `AuthRequestUser | undefined`.
- `CurrentUser` — alias для параметра handler’а.
- `me(@CurrentUser() user)` вместо `me(@Req() req)`.

## Why This Matters

Меньше шума в сигнатурах контроллеров; одна точка доступа к `req.user` для Track 2 и CMS. Следующий шаг — refresh persistence (069).

## Architecture Notes

- **Только на guarded routes:** без `JwtAuthGuard` `user` может быть `undefined` — декоратор не бросает исключение (поведение 1:1 с `req.user`).
- **Импорт:** другие модули импортируют `CurrentUser` из файла декоратора (не provider в `AuthModule`).
- **Тип `AuthRequestUser`:** по-прежнему `{ sub }` до шага 084.

## Changed Files

| File                                                                | Action                              |
| ------------------------------------------------------------------- | ----------------------------------- |
| `apps/api/src/auth/current-user.decorator.ts`                       | created                             |
| `apps/api/src/auth/current-user.decorator.spec.ts`                  | created                             |
| `apps/api/src/auth/auth.controller.ts`                              | changed — `@CurrentUser()` on `/me` |
| `docs/lessons/lesson-068-current-user-decorator.md`                 | created                             |
| `docs/lessons/lesson-067-jwt-strategy-auth-guard.md`                | changed — link to 068               |
| `docs/development-roadmap.md`                                       | changed — шаг 068 done              |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` | changed                             |
| `docs/LOCAL_SETUP.md`                                               | changed — next step 069             |

## Verification

- `npx nx run api:test` — `current-user.decorator.spec.ts` зелёный.
- `npx nx run api:lint` — без предупреждений.
- `npx nx run api:build` — успешная сборка.

## TDD Sequence

- **Red:** spec для `getAuthRequestUser` (user present / missing).
- **Green:** decorator + рефактор controller.
- **Refactor:** убрать неиспользуемые импорты `Req`, `Request`.

## Definition of Done

- [x] `CurrentUser` + `getAuthRequestUser` с unit-тестами.
- [x] `GET /api/v1/auth/me` использует `@CurrentUser()`.
- [x] `nx run api:test` green.
- [x] Документация синхронизирована.

## What To Remember

- Декоратор не заменяет guard — всегда `@UseGuards(JwtAuthGuard)` на защищённых маршрутах.
- Тестируйте `getAuthRequestUser`, не весь Nest pipeline.
- Следующий шаг — [lesson-070](./lesson-070-auth-refresh-rotation.md): `POST /auth/refresh` + rotation (persistence — [lesson-069](./lesson-069-refresh-token-entity-persistence.md)).

## Verify

```bash
npx nx run api:test
npx nx run api:lint
npx nx run api:build
```

## Homework

Открыть `auth.controller.ts` и сравнить сигнатуру `me` до/после 068; убедиться, что e2e `/me` с Bearer по-прежнему возвращает `{ id }`.
