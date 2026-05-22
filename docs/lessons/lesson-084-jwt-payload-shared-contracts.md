# Lesson 084: JWT payload shape documented in `shared-contracts`

## Learning Goal

Зафиксировать **форму access JWT payload** в `@blog/shared-contracts`, чтобы api и web ссылались на один тип `JwtAccessTokenPayload` (`sub` = id пользователя), без дублирования локального файла в `apps/api`.

## Implementation Scope

В скоупе:

- [`libs/shared-contracts/src/auth/jwt-access-token.types.ts`](../../libs/shared-contracts/src/auth/jwt-access-token.types.ts) — `JwtAccessTokenPayload` + JSDoc (роли/permissions не в токене).
- [`libs/shared-contracts/src/index.ts`](../../libs/shared-contracts/src/index.ts) — re-export типа.
- [`apps/api/src/auth/jwt-access-token.service.ts`](../../apps/api/src/auth/jwt-access-token.service.ts) — import из `@blog/shared-contracts`.
- [`apps/api/src/auth/auth-request-user.types.ts`](../../apps/api/src/auth/auth-request-user.types.ts) — `AuthRequestUser` = контрактный payload.

Намеренно **не** делаем:

- `roles` / `permissions` в JWT — права по-прежнему из БД ([083](./lesson-083-sample-cms-route-rbac.md)).
- Zod-схему payload или decode на web — позже, когда клиент парсит JWT.
- Изменения HTTP-ответов login/refresh/me.
- Новые e2e — поведение access token не меняется.

## Dependencies

- [Шаг 066](./lesson-066-jwt-access-token-service.md) — `signForUser` / `verify` с claim `sub`.
- [Шаг 083](./lesson-083-sample-cms-route-rbac.md) — RBAC читает `sub`, не claims в токене.
- [Шаг 013](./lesson-013-wire-shared-contracts-api.md) — api уже зависит от `shared-contracts:build`.

## Step-by-Step Changes

1. **Red:** убедиться, что `jwt-access-token.service.spec.ts` покрывает round-trip `sub` (уже есть с 066).
2. Добавить `JwtAccessTokenPayload` в `shared-contracts`, export из `index.ts`.
3. Переключить api auth types на `@blog/shared-contracts`, удалить `jwt-access-token.payload.ts`.
4. **Verify:** `shared-contracts:build`, `api:test`, `api:build`.
5. Docs sync: roadmap, storytelling, README, learning-path, LOCAL_SETUP.

## Code Example

```typescript
// libs/shared-contracts/src/auth/jwt-access-token.types.ts
export type JwtAccessTokenPayload = {
  readonly sub: string;
};

// apps/api/src/auth/jwt-access-token.service.ts
import type { JwtAccessTokenPayload } from '@blog/shared-contracts';

return this.jwt.signAsync({ sub: userId } satisfies JwtAccessTokenPayload);
```

```bash
npx nx run shared-contracts:build
npx nx run api:test
```

## Context

После **066** payload жил только в api. **081–083** закрепили: авторизация — из БД по `sub`, не из JWT. Шаг **084** публикует **договор** о том, что лежит в access-токене, не расширяя claims.

## Concept

**Контракт ≠ реализация:** тип в `shared-contracts` документирует wire-shape для monorepo; api по-прежнему подписывает HS256 через `JwtAccessTokenService`. Web сможет типизировать decode/guard без копипасты.

## Code Changes

- Единственный claim: `sub` (user id).
- `AuthRequestUser` алиасит контрактный payload после `JwtStrategy`.
- Локальный `jwt-access-token.payload.ts` удалён.

## Why This Matters

Track 2 закрывает «один язык» для auth DTO и для JWT. Следующие шаги (**085–087**) — e2e-матрица auth; Track 3 (**116+**) — контракты постов по тому же паттерну.

## Architecture Notes

- **Без roles в JWT** — смена роли в БД действует сразу, без перевыпуска access.
- **Без email в JWT** — меньше PII в прокси/логах (как в 066).
- **Build order:** `api:build` → `dependsOn` `shared-contracts:build` (lesson 013).

## Changed Files

| File                                                                                        | Action                          |
| ------------------------------------------------------------------------------------------- | ------------------------------- |
| `libs/shared-contracts/src/auth/jwt-access-token.types.ts`                                  | created                         |
| `libs/shared-contracts/src/index.ts`                                                        | changed — export                |
| `apps/api/src/auth/jwt-access-token.service.ts`                                             | changed — import from contracts |
| `apps/api/src/auth/auth-request-user.types.ts`                                              | changed — import from contracts |
| `apps/api/src/auth/jwt-access-token.payload.ts`                                             | deleted                         |
| `docs/lessons/lesson-084-jwt-payload-shared-contracts.md`                                   | created                         |
| `docs/development-roadmap.md`                                                               | changed — шаг 084 done          |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` / `docs/LOCAL_SETUP.md` | changed                         |
| `docs/lessons/lesson-066-jwt-access-token-service.md`                                       | changed — link to 084           |
| `docs/lessons/lesson-083-sample-cms-route-rbac.md`                                          | changed — 084 done              |

## Verification

- `npx nx run shared-contracts:build` — успешная сборка, тип в `dist/`.
- `npx nx run api:test` — `jwt-access-token.service.spec.ts` и остальные auth-тесты зелёные.
- `npx nx run api:build` — успешная сборка.

## TDD Sequence

- **Red:** не требуется нового поведения; существующие unit-тесты 066 страхуют `sub`.
- **Green:** контракт + переключение import.
- **Refactor:** удаление дублирующего локального типа.

## Definition of Done

- [x] `JwtAccessTokenPayload` экспортируется из `@blog/shared-contracts`.
- [x] Api использует контрактный тип, локальный payload-файл удалён.
- [x] Роли/permissions не добавлены в JWT.
- [x] Документация синхронизирована.
- [x] `nx run shared-contracts:build` и `nx run api:test` green.

## What To Remember

1. **084 = документирование shape**, не расширение authorization.
2. **`sub` = user id** — guards и RBAC lookup строятся на нём.
3. **Права из БД** — как в 082–083, до явного ADR не кладём claims в токен.
4. **Web** может импортировать тот же тип при decode JWT.
5. Следующий шаг — [085](../development-roadmap.md): auth e2e register → login happy path.

## Verify

```bash
npx nx run shared-contracts:build
npx nx run api:test
npx nx run api:build
```

## Homework

В IDE: открыть `@blog/shared-contracts` → `JwtAccessTokenPayload`, сравнить с decode access token после login (jwt.io или devtools) — только `sub`, без `roles`.
