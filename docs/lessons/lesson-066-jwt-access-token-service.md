# Lesson 066: JWT access token issuance + verify service

## Learning Goal

Добавить **изолированный сервис access JWT**: подпись HS256 с claim `sub` (id пользователя) и проверка токена с нейтральной ошибкой — без Passport, guards и без изменения ответа `POST /auth/login`.

## Implementation Scope

В скоупе:

- [`apps/api/package.json`](../../apps/api/package.json) — `@nestjs/jwt`.
- [`apps/api/src/config/env.schema.ts`](../../apps/api/src/config/env.schema.ts) — `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`.
- [`.env.example`](../../.env.example) — документированные ключи JWT.
- [`apps/api/src/auth/jwt-access-token.payload.ts`](../../apps/api/src/auth/jwt-access-token.payload.ts) — внутренний тип payload (`sub`).
- [`apps/api/src/auth/auth-jwt.constants.ts`](../../apps/api/src/auth/auth-jwt.constants.ts) — `INVALID_ACCESS_TOKEN_MESSAGE`.
- [`apps/api/src/auth/jwt-access-token.service.ts`](../../apps/api/src/auth/jwt-access-token.service.ts) — `signForUser` / `verify`.
- [`apps/api/src/auth/auth.module.ts`](../../apps/api/src/auth/auth.module.ts) — `JwtModule.registerAsync`, export `JwtAccessTokenService`.
- [`apps/api/src/auth/jwt-access-token.service.spec.ts`](../../apps/api/src/auth/jwt-access-token.service.spec.ts) — unit (tests-first gate).
- [`apps/api/src/config/env.schema.spec.ts`](../../apps/api/src/config/env.schema.spec.ts) — defaults и reject короткого secret.

Намеренно **не** делаем:

- `JwtStrategy`, `AuthGuard`, `accessToken` в login — [шаг 067](../development-roadmap.md).
- Refresh / logout — [шаги 069–071](../development-roadmap.md).
- Публичный тип payload в `shared-contracts` — [шаг 084](../development-roadmap.md).
- Полная narrative TTL-политики — [шаг 073](../development-roadmap.md).

## Dependencies

- [Шаг 065](./lesson-065-auth-login.md) — после login есть `user.id` для `sub`.
- [Шаг 058](./lesson-058-datasource-config-database-url.md) — Zod env в bootstrap.
- `@nestjs/jwt` (обёртка над `jsonwebtoken`).

## Step-by-Step Changes

1. `npm install @nestjs/jwt -w api`.
2. Расширить `rootEnvSchema` и `.env.example` (`JWT_SECRET` min 32, `JWT_ACCESS_EXPIRES_IN` default `15m`).
3. **Red:** `jwt-access-token.service.spec.ts` + тесты env для JWT.
4. `JwtAccessTokenService`: `signAsync({ sub })`, `verifyAsync` → `{ sub }` или `UnauthorizedException`.
5. `AuthModule`: `JwtModule.registerAsync` из `ConfigService`, export сервиса.
6. **Verify:** `api:test`, `api:lint`, `api:build`.
7. Синхронизировать roadmap, storytelling, README, learning-path, LOCAL_SETUP.

## Context

После 065 клиент знает «кто вошёл» только в теле ответа login, но не может слать Bearer на защищённые маршруты. Шаг 066 — криптографический слой; HTTP и guards подключатся на 067.

## Concept

**Минимальный payload:** только `sub` (UUID пользователя), без `email` в JWT — меньше PII в прокси и логах. **Одно сообщение на все сбои verify** — не раскрываем expired vs malformed наружу.

## Code Changes

- `JwtAccessTokenService.signForUser(userId)` → JWT string.
- `JwtAccessTokenService.verify(token)` → `{ sub }` или `401`-готовый `UnauthorizedException`.
- `AuthService.login` и контракт `LoginUserResponse` **без изменений**.

## Why This Matters

Guards и стратегии (067) должны опираться на один проверенный сервис, а не дублировать `jsonwebtoken` в контроллерах. Env secret с fail-fast на старте исключает «забыли JWT_SECRET в prod».

## Architecture Notes

- **HS256 + один secret:** достаточно для monolith baseline; RS256/rotation — вне скоупа Track 2.
- **Unit-тесты:** `@nestjs/testing` + `JwtModule.register` с фиксированным secret; expired — `signAsync` с `expiresIn: '-1s'`.
- **Экспорт из `AuthModule`:** `JwtStrategy` на 067 импортирует `AuthModule` и использует тот же `JwtAccessTokenService`.

## Changed Files

| File                                                                | Action                       |
| ------------------------------------------------------------------- | ---------------------------- |
| `apps/api/package.json`                                             | changed — `@nestjs/jwt`      |
| `package-lock.json` (корень)                                        | changed — lock после install |
| `.env.example`                                                      | changed — JWT\_\*            |
| `apps/api/src/config/env.schema.ts`                                 | changed — JWT keys           |
| `apps/api/src/config/env.schema.spec.ts`                            | changed — JWT tests          |
| `apps/api/src/auth/auth-jwt.constants.ts`                           | created                      |
| `apps/api/src/auth/jwt-access-token.payload.ts`                     | created                      |
| `apps/api/src/auth/jwt-access-token.service.ts`                     | created                      |
| `apps/api/src/auth/jwt-access-token.service.spec.ts`                | created                      |
| `apps/api/src/auth/auth.module.ts`                                  | changed — JwtModule + export |
| `docs/lessons/lesson-066-jwt-access-token-service.md`               | created                      |
| `docs/lessons/lesson-065-auth-login.md`                             | changed — link to 066        |
| `docs/development-roadmap.md`                                       | changed — шаг 066 done       |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` | changed                      |
| `docs/LOCAL_SETUP.md`                                               | changed — next step 067      |

## Verification

- `npx nx run api:test` — `jwt-access-token.service.spec.ts` и `env.schema.spec.ts` зелёные.
- `npx nx run api:lint` — без предупреждений.
- `npx nx run api:build` — успешная сборка.

## TDD Sequence

- **Red:** round-trip, expired, wrong secret, malformed, missing/empty `sub`; env defaults и reject short secret.
- **Green:** сервис, env, `AuthModule` wiring.
- **Refactor:** константа сообщения об ошибке; без изменения HTTP.

## Definition of Done

- [x] `JwtAccessTokenService` с `signForUser` / `verify`, HS256, claim `sub`.
- [x] `JWT_SECRET` и `JWT_ACCESS_EXPIRES_IN` в Zod + `.env.example`.
- [x] Сервис зарегистрирован и экспортирован из `AuthModule`.
- [x] Unit-тесты в том же change set, что production-код auth/config.
- [x] `POST /auth/login` контракт не изменён.
- [x] Документация синхронизирована.

## What To Remember

- Не класть `email` в access JWT до явного решения в 084.
- Один neutral message для всех ошибок verify.
- Следующий шаг 067 подключает Passport и возвращает токен клиенту.

## Verify

```bash
npx nx run api:test
npx nx run api:lint
npx nx run api:build
```

## Homework

Декодировать access token на [jwt.io](https://jwt.io) после ручного `signForUser` в REPL или временном e2e и убедиться, что в payload только `sub`, `iat`, `exp`.
