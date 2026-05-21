# Lesson 072: Refresh token reuse detection policy

## Learning Goal

Закрыть **угрозу кражи refresh**: если клиент снова шлёт уже ротированный токен (`revoked_at` + `replaced_by_token_id`), сервер считает это reuse и отзывает **всё семейство** токенов в цепочке rotation, затем отвечает тем же нейтральным `401`, что и для прочих невалидных refresh.

## Implementation Scope

В скоупе:

- [`apps/api/src/auth/refresh-token-reuse.ts`](../../apps/api/src/auth/refresh-token-reuse.ts) — `isRotatedReuse(row)`.
- [`apps/api/src/auth/refresh-token-reuse.spec.ts`](../../apps/api/src/auth/refresh-token-reuse.spec.ts) — unit.
- [`apps/api/src/auth/refresh-token.service.ts`](../../apps/api/src/auth/refresh-token.service.ts) — `collectFamilyTokenIds`, `revokeTokenFamily`.
- [`apps/api/src/auth/refresh-token.service.spec.ts`](../../apps/api/src/auth/refresh-token.service.spec.ts) — unit family walk + bulk revoke.
- [`apps/api/src/auth/auth.service.ts`](../../apps/api/src/auth/auth.service.ts) — ветка reuse в `refresh()`.
- [`apps/api/src/auth/auth.service.spec.ts`](../../apps/api/src/auth/auth.service.spec.ts) — unit (tests-first gate).
- [`apps/api/test/auth-refresh.e2e-spec.ts`](../../apps/api/test/auth-refresh.e2e-spec.ts) — e2e reuse + 401.

Намеренно **не** делаем:

- Revoke **всех** refresh пользователя (только цепочка одного login).
- Отдельный код/сообщение для reuse (enumeration).
- Audit log события reuse — [шаг 088](../development-roadmap.md).
- `JWT_REFRESH_EXPIRES_IN` env — [шаг 073](../development-roadmap.md).
- Полная Postgres e2e register→refresh→reuse — [шаг 086](../development-roadmap.md).

## Dependencies

- [Шаг 070](./lesson-070-auth-refresh-rotation.md) — rotation, `markReplaced`, `replaced_by_token_id`.
- [Шаг 071](./lesson-071-auth-logout-revoke-refresh.md) — logout revoke без `replaced_by` (не reuse).
- [Шаг 069](./lesson-069-refresh-token-entity-persistence.md) — `findByRawToken`, цепочка в БД.

## Step-by-Step Changes

1. **Red:** unit `isRotatedReuse`, `collectFamilyTokenIds`, `revokeTokenFamily`; `AuthService.refresh` reuse / logout-revoked; e2e reuse.
2. `isRotatedReuse`: `revokedAt !== null && replacedByTokenId !== null`.
3. `RefreshTokenService`: обход цепочки вперёд/назад; bulk `update` с `In(ids)` + `revokedAt IS NULL`.
4. `AuthService.refresh`: после `findActive === null` → `findByRawToken` → при reuse `revokeTokenFamily` → `401`.
5. **Verify:** `api:test`, `api:test:e2e`, `api:lint`, `api:build`.
6. Синхронизировать roadmap, storytelling, README, learning-path, LOCAL_SETUP.

## Context

После 070 повторный refresh со старым токеном давал тот же `401`, но **не отзывал** successor в цепочке — легитимная сессия могла жить, пока злоумышленник «пробовал» украденный токен. 072 вводит политику OAuth-style: reuse = компрометация семейства.

## Concept

**Token family:** один `login` → линейная цепочка T1→T2→T3 через `replaced_by_token_id`. Reuse любого ротированного узла → `revokeTokenFamily` для всех активных в цепочке. Logout-revoked (`replaced_by` null) — только `401`, без family revoke.

## Code Changes

- Happy path refresh без изменений (`findActiveByRawToken` → rotation).
- Reuse path: `findByRawToken` + `isRotatedReuse` → `revokeTokenFamily(anchorId)` → `UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE)`.

## Why This Matters

Rotation alone не останавливает атаку «два владельца одного refresh»: reuse detection принудительно обрывает всю цепочку и заставляет перелогиниться.

## Architecture Notes

- **Семейство ≠ все токены user:** два login — две независимые цепочки.
- **Expired + rotated:** всё равно reuse (сигнал важнее TTL).
- **Клиент:** одно сообщение `Invalid or expired refresh token` для всех отказов refresh.
- **E2e:** мок `RefreshTokenService`, как 070 — без Postgres.

## Changed Files

| File                                                                | Action                              |
| ------------------------------------------------------------------- | ----------------------------------- |
| `apps/api/src/auth/refresh-token-reuse.ts`                          | created                             |
| `apps/api/src/auth/refresh-token-reuse.spec.ts`                     | created                             |
| `apps/api/src/auth/refresh-token.service.ts`                        | changed — family collect + revoke   |
| `apps/api/src/auth/refresh-token.service.spec.ts`                   | changed                             |
| `apps/api/src/auth/auth.service.ts`                                 | changed — reuse branch in `refresh` |
| `apps/api/src/auth/auth.service.spec.ts`                            | changed                             |
| `apps/api/test/auth-refresh.e2e-spec.ts`                            | changed                             |
| `docs/lessons/lesson-072-auth-refresh-reuse-detection.md`           | created                             |
| `docs/lessons/lesson-070-auth-refresh-rotation.md`                  | changed — link to 072               |
| `docs/lessons/lesson-071-auth-logout-revoke-refresh.md`             | changed — link to 072               |
| `docs/development-roadmap.md`                                       | changed — шаг 072 done              |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` | changed                             |
| `docs/LOCAL_SETUP.md`                                               | changed — next step 073             |

## Verification

- `npx nx run api:test` — `refresh-token-reuse.spec.ts`, `refresh-token.service.spec.ts`, `auth.service.spec.ts`
- `npx nx run api:test:e2e` — `auth-refresh.e2e-spec.ts`
- `npx nx run api:lint` — без предупреждений
- `npx nx run api:build` — успешная сборка

## TDD Sequence

- **Red:** unit reuse / family / logout-revoked no family; e2e reuse 401.
- **Green:** `refresh-token-reuse`, service methods, `AuthService.refresh`.
- **Refactor:** нет (логика локальна).

## Definition of Done

- [x] Повторный refresh ротированного токена отзывает цепочку и возвращает `401`.
- [x] Logout-revoked и unknown не вызывают `revokeTokenFamily`.
- [x] Unit + e2e в том же change set, что production-код auth.
- [x] Документация синхронизирована.
- [x] `nx run api:test` green.

## What To Remember

- Reuse = `revoked_at` **и** `replaced_by_token_id` (rotation), не logout.
- Family revoke — только цепочка одного login, не все refresh пользователя.
- Клиенту не раскрываем «reuse» отдельным сообщением.

## Verify

```bash
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint
npx nx run api:build
```

## Homework

Вручную (с Postgres): login → refresh (сохранить старый refresh) → refresh с новым → повторить запрос со **старым** refresh → убедиться, что новый refresh тоже перестал работать (401); перелогиниться.
