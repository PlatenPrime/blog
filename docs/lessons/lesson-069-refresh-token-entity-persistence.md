# Lesson 069: Refresh token entity + persistence

## Learning Goal

Заложить **хранение opaque refresh-токенов**: таблица `refresh_tokens`, сущность TypeORM, SHA-256 хэш сырого токена и `RefreshTokenService` для persist/find/revoke — без HTTP и без выдачи refresh при login.

## Implementation Scope

В скоупе:

- [`apps/api/src/auth/refresh-token.entity.ts`](../../apps/api/src/auth/refresh-token.entity.ts) — сущность `RefreshToken` (`refresh_tokens`).
- [`apps/api/src/database/migrations/1747929600000-CreateRefreshTokensTable.ts`](../../apps/api/src/database/migrations/1747929600000-CreateRefreshTokensTable.ts) — DDL: FK на `users`, self-FK `replaced_by_token_id`, `UNIQUE (token_hash)`, индекс на `user_id`.
- [`apps/api/src/auth/refresh-token-hash.ts`](../../apps/api/src/auth/refresh-token-hash.ts) — `hashRefreshToken` (SHA-256 hex).
- [`apps/api/src/auth/refresh-token-hash.spec.ts`](../../apps/api/src/auth/refresh-token-hash.spec.ts) — unit.
- [`apps/api/src/auth/refresh-token.service.ts`](../../apps/api/src/auth/refresh-token.service.ts) — `persistForUser`, `findByRawToken`, `findActiveByRawToken`, `revoke`, `markReplaced`.
- [`apps/api/src/auth/refresh-token.service.spec.ts`](../../apps/api/src/auth/refresh-token.service.spec.ts) — unit с моком `Repository`.
- [`apps/api/src/auth/auth.module.ts`](../../apps/api/src/auth/auth.module.ts) — `TypeOrmModule.forFeature([RefreshToken])`, export `RefreshTokenService`.

Намеренно **не** делаем:

- `POST /auth/refresh`, выдача refresh при login — [шаг 070](../development-roadmap.md).
- Logout / массовый revoke — [шаг 071](../development-roadmap.md).
- Reuse detection policy — [шаг 072](../development-roadmap.md).
- `JWT_REFRESH_*` env и документация TTL — [шаг 073](../development-roadmap.md).
- Изменения `LoginUserResponse` / `shared-contracts`.

## Dependencies

- [Шаг 060](./lesson-060-user-entity-indexes.md) — таблица `users`, FK target.
- [Шаг 059](./lesson-059-migration-workflow-baseline-schema.md) — `db:migrate*`.
- [Шаг 068](./lesson-068-current-user-decorator.md) — access JWT flow готов; refresh — следующий слой сессии.

## Step-by-Step Changes

1. **Red:** `refresh-token-hash.spec.ts`, `refresh-token.service.spec.ts`.
2. Сущность `RefreshToken` с `user_id`, `token_hash`, `expires_at`, `revoked_at`, `replaced_by_token_id`.
3. Миграция `CreateRefreshTokensTable` (согласована с декораторами).
4. `RefreshTokenService` + `hashRefreshToken`.
5. `AuthModule`: `forFeature`, provider, export сервиса.
6. **Verify:** `api:test`, `api:lint`, `api:build`; с Docker — `db:migrate`.
7. Синхронизировать roadmap, storytelling, README, learning-path, LOCAL_SETUP.

## Context

После 068 клиент живёт только на коротком access JWT. Долгоживущая сессия требует отдельного opaque refresh в БД (хэш, не plaintext) и цепочки rotation — схема и persistence готовят **070** без переделки DDL.

## Concept

**Opaque refresh + hash-at-rest:** как пароль, сырой токен никогда не пишется в Postgres — только SHA-256. **`replaced_by_token_id`** и **`revoked_at`** задают цепочку для rotation и reuse detection на 070–072. Access остаётся stateless JWT; refresh — stateful строка в таблице.

## Code Changes

- `persistForUser({ userId, rawToken, expiresAt })` — hash → `save`.
- `findActiveByRawToken` — `revokedAt IS NULL` и `expiresAt > now()`.
- `markReplaced` — связывает старый токен с новым id и помечает revoked.

## Why This Matters

Без таблицы refresh нельзя честно реализовать rotation: каждый refresh должен инвалидировать предыдущий хэш. Отдельный сервис позволяет мокать persistence в e2e **070** без Postgres, как `UserService` на 063.

## Architecture Notes

- **`ON DELETE CASCADE` на `user_id`:** при удалении пользователя сессии исчезают.
- **Self-FK `ON DELETE SET NULL`:** удаление successor не ломает историю predecessor.
- **Уникальный `token_hash`:** один активный lookup по представленному токену.
- **Генерация `rawToken`:** вне скоупа (070 вызовет `crypto.randomBytes` или аналог).
- **Индекс `user_id`:** подготовка к revoke-all на logout (071).

## Changed Files

| File                                                                         | Action                          |
| ---------------------------------------------------------------------------- | ------------------------------- |
| `apps/api/src/auth/refresh-token.entity.ts`                                  | created                         |
| `apps/api/src/auth/refresh-token-hash.ts`                                    | created                         |
| `apps/api/src/auth/refresh-token-hash.spec.ts`                               | created                         |
| `apps/api/src/auth/refresh-token.service.ts`                                 | created                         |
| `apps/api/src/auth/refresh-token.service.spec.ts`                            | created                         |
| `apps/api/src/database/migrations/1747929600000-CreateRefreshTokensTable.ts` | created                         |
| `apps/api/src/auth/auth.module.ts`                                           | changed — `forFeature`, service |
| `docs/lessons/lesson-069-refresh-token-entity-persistence.md`                | created                         |
| `docs/lessons/lesson-068-current-user-decorator.md`                          | changed — link to 069           |
| `docs/development-roadmap.md`                                                | changed — шаг 069 done          |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md`          | changed                         |
| `docs/LOCAL_SETUP.md`                                                        | changed — next step 070         |

## Verification

- `npx nx run api:test` — все unit-тесты зелёные.
- `npx nx run api:lint` — без предупреждений.
- `npx nx run api:build` — успешная сборка.
- С поднятым Postgres (`npm run db:up`): `npm run db:migrate` — применяется `CreateRefreshTokensTable1747929600000`; `\d refresh_tokens` в `psql` показывает FK, `UNIQUE` на `token_hash`, индекс на `user_id`.

## TDD Sequence

- **Red:** specs для hash и service (мок репозитория).
- **Green:** entity, migration, service, module wiring.
- **Refactor:** без изменения публичного API сервиса.

## Definition of Done

- [x] Таблица `refresh_tokens` + сущность согласованы с миграцией.
- [x] `RefreshTokenService` + unit specs.
- [x] `AuthModule` регистрирует entity и экспортирует сервис.
- [x] Login / `LoginUserResponse` без изменений.
- [x] Документация синхронизирована.
- [x] `nx run api:test` green.

## What To Remember

- В БД только **хэш** refresh; сырой токен — секрет клиента.
- `markReplaced` + `revoked_at` — фундамент rotation (**070**) и reuse (**072**).
- Следующий шаг — [шаг 070](../development-roadmap.md): `POST /auth/refresh` + rotation.

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

На чистой БД: `db:migrate`, `\d refresh_tokens`, затем `db:migrate:revert` и снова `db:migrate` — убедиться, что `down`/`up` симметричны.
