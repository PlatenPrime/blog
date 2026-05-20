# Lesson 067: `JwtStrategy` + `AuthGuard`

## Learning Goal

Подключить **Passport** для access JWT: `JwtStrategy` и `JwtAuthGuard` с единой верификацией через `JwtAccessTokenService`, вернуть **`accessToken` в login** и добавить защищённый **`GET /auth/me`** для e2e-проверки Bearer.

## Implementation Scope

В скоупе:

- [`apps/api/package.json`](../../apps/api/package.json) — `@nestjs/passport`, `passport`, `passport-custom`.
- [`libs/shared-contracts/src/auth/login.types.ts`](../../libs/shared-contracts/src/auth/login.types.ts) — `accessToken` в `LoginUserResponse`.
- [`libs/shared-contracts/src/auth/me.types.ts`](../../libs/shared-contracts/src/auth/me.types.ts) — `AuthMeResponse`.
- [`apps/api/src/auth/jwt.strategy.ts`](../../apps/api/src/auth/jwt.strategy.ts) — `passport-custom`, verify через `JwtAccessTokenService`.
- [`apps/api/src/auth/jwt-auth.guard.ts`](../../apps/api/src/auth/jwt-auth.guard.ts) — `AuthGuard('jwt')`.
- [`apps/api/src/auth/auth-request-user.types.ts`](../../apps/api/src/auth/auth-request-user.types.ts) — тип `req.user`.
- [`apps/api/src/auth/auth.module.ts`](../../apps/api/src/auth/auth.module.ts) — `PassportModule`, providers, export guard.
- [`apps/api/src/auth/auth.service.ts`](../../apps/api/src/auth/auth.service.ts) — `signForUser` после login.
- [`apps/api/src/auth/auth.controller.ts`](../../apps/api/src/auth/auth.controller.ts) — `GET me` с `@UseGuards(JwtAuthGuard)`.
- [`apps/api/src/auth/jwt.strategy.spec.ts`](../../apps/api/src/auth/jwt.strategy.spec.ts) — unit (tests-first gate).
- [`apps/api/src/auth/auth.service.spec.ts`](../../apps/api/src/auth/auth.service.spec.ts) — login + `accessToken`.
- [`apps/api/test/auth-jwt-guard.e2e-spec.ts`](../../apps/api/test/auth-jwt-guard.e2e-spec.ts) — e2e Bearer / 401.
- [`apps/api/test/auth-login.e2e-spec.ts`](../../apps/api/test/auth-login.e2e-spec.ts) — ожидание `accessToken`.

Намеренно **не** делаем:

- `@CurrentUser()` — [шаг 068](../development-roadmap.md).
- `UserService.findById` и полный профиль на `/me`.
- Refresh / logout — [шаги 069–071](../development-roadmap.md).
- RBAC — [шаг 081+](../development-roadmap.md).

## Dependencies

- [Шаг 066](./lesson-066-jwt-access-token-service.md) — `JwtAccessTokenService.signForUser` / `verify`.
- [Шаг 065](./lesson-065-auth-login.md) — `AuthService.login`, `LoginUserResponse`.
- `@nestjs/passport`, `passport`, `passport-custom`.

## Step-by-Step Changes

1. `npm install @nestjs/passport passport passport-custom -w api` (+ `@types/passport` dev).
2. Расширить `LoginUserResponse` (`accessToken`), добавить `AuthMeResponse`, `shared-contracts:build`.
3. **Red:** `jwt.strategy.spec.ts`, обновить `auth.service.spec.ts`; e2e `auth-jwt-guard.e2e-spec.ts`.
4. `JwtStrategy`: извлечь Bearer из `Authorization`, `accessTokens.verify(token)` → `req.user`.
5. `JwtAuthGuard`, `PassportModule` в `AuthModule`.
6. `AuthService.login` — `accessToken` после успешной проверки пароля.
7. `GET /api/v1/auth/me` — `{ id: req.user.sub }`.
8. **Verify:** `api:test`, `api:test:e2e`, `api:lint`, `api:build`.
9. Синхронизировать roadmap, storytelling, README, learning-path, LOCAL_SETUP.

## Context

После 066 API умеет подписывать и проверять JWT, но клиент не получает токен при login и не может ходить на защищённые маршруты. Шаг 067 замыкает цикл: login → Bearer → guard.

## Concept

**Один путь verify:** стратегия не дублирует `jsonwebtoken` через `passport-jwt` с отдельным `secretOrKey` — только `JwtAccessTokenService.verify`. **passport-custom** даёт полный контроль над извлечением Bearer и делегированием verify.

## Code Changes

- `JwtStrategy.validate(req)` → `{ sub }` или `UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE)`.
- `JwtAuthGuard` extends `AuthGuard('jwt')`.
- `POST /auth/login` → `LoginUserResponse` + `accessToken`.
- `GET /auth/me` → `AuthMeResponse` при валидном Bearer.

## Why This Matters

Стандартный Nest-паттерн для Track 2: следующий шаг 068 добавит `@CurrentUser()`, затем RBAC. Без guard JWT остаётся изолированным сервисом без HTTP-смысла.

## Architecture Notes

- **Bearer extraction** — локальная функция в `jwt.strategy.ts` (без зависимости `passport-jwt`).
- **`/me` без DB:** ответ `{ id: sub }` из JWT; полный профиль — позже.
- **Экспорт `JwtAuthGuard`** из `AuthModule` для будущих CMS-модулей.

## Changed Files

| File                                                                | Action                            |
| ------------------------------------------------------------------- | --------------------------------- |
| `apps/api/package.json`                                             | changed — passport deps           |
| `package-lock.json` (корень)                                        | changed                           |
| `libs/shared-contracts/src/auth/login.types.ts`                     | changed — `accessToken`           |
| `libs/shared-contracts/src/auth/me.types.ts`                        | created                           |
| `libs/shared-contracts/src/index.ts`                                | changed — export `AuthMeResponse` |
| `apps/api/src/auth/jwt.strategy.ts`                                 | created                           |
| `apps/api/src/auth/jwt.strategy.spec.ts`                            | created                           |
| `apps/api/src/auth/jwt-auth.guard.ts`                               | created                           |
| `apps/api/src/auth/auth-request-user.types.ts`                      | created                           |
| `apps/api/src/auth/auth.module.ts`                                  | changed — PassportModule          |
| `apps/api/src/auth/auth.service.ts`                                 | changed — `accessToken` on login  |
| `apps/api/src/auth/auth.service.spec.ts`                            | changed                           |
| `apps/api/src/auth/auth.controller.ts`                              | changed — `GET me`                |
| `apps/api/test/auth-jwt-guard.e2e-spec.ts`                          | created                           |
| `apps/api/test/auth-login.e2e-spec.ts`                              | changed                           |
| `docs/lessons/lesson-067-jwt-strategy-auth-guard.md`                | created                           |
| `docs/lessons/lesson-066-jwt-access-token-service.md`               | changed — link to 067             |
| `docs/development-roadmap.md`                                       | changed — шаг 067 done            |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` | changed                           |
| `docs/LOCAL_SETUP.md`                                               | changed — next step 068           |

## Verification

- `npx nx run shared-contracts:build`
- `npx nx run api:test` — `jwt.strategy.spec.ts`, `auth.service.spec.ts`
- `npx nx run api:test:e2e` — `auth-jwt-guard.e2e-spec.ts`, `auth-login.e2e-spec.ts`
- `npx nx run api:lint` — без предупреждений
- `npx nx run api:build` — успешная сборка

## TDD Sequence

- **Red:** unit strategy/service; e2e login+me без токена / с мусорным Bearer.
- **Green:** strategy, guard, module, login `accessToken`, `GET me`.
- **Refactor:** `AuthRequestUser` type; единое `INVALID_ACCESS_TOKEN_MESSAGE`.

## Definition of Done

- [x] `JwtStrategy` + `JwtAuthGuard`, verify только через `JwtAccessTokenService`.
- [x] `LoginUserResponse` содержит `accessToken`; login выдаёт токен.
- [x] `GET /api/v1/auth/me` защищён guard’ом; 401 без/с невалидным Bearer.
- [x] Unit + e2e в том же change set, что production-код auth.
- [x] Документация синхронизирована.

## What To Remember

- Не подключать `passport-jwt` для verify — дублирует сервис 066.
- `@CurrentUser()` — отдельный шаг 068; в 067 достаточно `req.user`.
- Следующий шаг — декоратор `@CurrentUser()` (068).

## Verify

```bash
npx nx run shared-contracts:build
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint
npx nx run api:build
```

## Homework

Залогиниться через `POST /api/v1/auth/login`, скопировать `accessToken`, вызвать `GET /api/v1/auth/me` с `Authorization: Bearer <token>` и без заголовка — сравнить 200 и 401 problem+json.
