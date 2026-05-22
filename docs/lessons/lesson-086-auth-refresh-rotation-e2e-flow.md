# Lesson 086: Auth e2e refresh rotation

## Learning Goal

Добавить **сквозной e2e** `register → login → refresh` (и reuse после ротации): один экземпляр приложения, общие in-memory `UserService` и `RefreshTokenService`, **реальный** Argon2 и JWT — в отличие от [`auth-refresh.e2e-spec.ts`](../../apps/api/test/auth-refresh.e2e-spec.ts), где persistence refresh полностью замокан.

## Implementation Scope

В скоупе:

- [`apps/api/test/helpers/auth-e2e-in-memory-refresh-token-store.ts`](../../apps/api/test/helpers/auth-e2e-in-memory-refresh-token-store.ts) — stateful `RefreshTokenService` override (hash-at-rest, `markReplaced`, `revokeTokenFamily`).
- [`apps/api/test/auth-register-login-refresh-flow.e2e-spec.ts`](../../apps/api/test/auth-register-login-refresh-flow.e2e-spec.ts) — два сценария: rotation happy path + reuse → 401 + family revoke.

Намеренно **не** делаем:

- Реальный Postgres в e2e (как в 085 — `DataSource` stub).
- Validation / whitelist на refresh — уже в `auth-refresh.e2e-spec.ts`.
- RBAC 403, logout flow — шаги **087**, **098**.
- Изменения `apps/api/src/` (только `test/`).

## Dependencies

- [Шаг 085](./lesson-085-auth-register-login-e2e-flow.md) — in-memory user store, register → login.
- [Шаг 070](./lesson-070-auth-refresh-rotation.md) — `POST /auth/refresh`, rotation semantics.
- [Шаг 072](./lesson-072-auth-refresh-reuse-detection.md) — reuse → `revokeTokenFamily`.

## Step-by-Step Changes

1. **Red:** `auth-register-login-refresh-flow.e2e-spec.ts` без in-memory refresh store.
2. `createInMemoryRefreshTokenServiceOverride()` — зеркалит `RefreshTokenService` (Map по `tokenHash`).
3. Bootstrap: как 085, override `RefreshTokenService` stateful, `EmailVerificationTokenService` — mock.
4. **Green:** `it` rotation (два последовательных refresh, новый opaque refresh каждый раз).
5. **Green:** `it` reuse (старый login refresh после ротации → 401; successor тоже 401).
6. Docs sync: roadmap, storytelling (глава XIV), README, learning-path, LOCAL_SETUP.

## Code Example

```typescript
// apps/api/test/auth-register-login-refresh-flow.e2e-spec.ts (фрагмент)
const inMemoryRefreshTokens = createInMemoryRefreshTokenServiceOverride();

await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(UserService)
  .useValue(inMemoryUsers)
  .overrideProvider(RefreshTokenService)
  .useValue(inMemoryRefreshTokens)
  .compile();

const login = await request(app).post(loginBase).send({ email, password });
await request(app)
  .post(refreshBase)
  .send({ refreshToken: login.body.refreshToken })
  .expect(200);
```

```bash
npx nx run api:test:e2e -- auth-register-login-refresh-flow.e2e-spec.ts
```

## Context

Уроки **070** и **072** проверяют refresh и reuse **изолированно** с `vi.fn()` на `RefreshTokenService`. Это быстрый CI, но не ловит ошибки в связке «login выдал сырой refresh → `findActiveByRawToken` → `markReplaced`». Шаг **086** — вторая «страховка» flow e2e после **085**.

## Concept

**Изолированный e2e vs flow e2e (refresh):** первый проверяет контракт маршрута и вызовы `markReplaced` / `revokeTokenFamily` на моках; второй — что hash-at-rest и цепочка `replaced_by_token_id` работают на общем store в одном приложении.

## Почему в flow e2e включён reuse (рекомендация)

| Причина                | Пояснение                                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Склейка 072            | Моковый e2e 072 не гарантирует, что `findByRawToken` + `isRotatedReuse` + `revokeTokenFamily` согласованы с реальным store |
| Одна цепочка состояния | Reuse после rotation — типичная атака; тест повторяет prod-порядок: login → refresh → повтор старого токена                |
| Не дублируем негативы  | Validation 400 остаётся в `auth-refresh.e2e-spec.ts`                                                                       |
| Без Postgres           | In-memory store, как в 085; «Postgres e2e» в уроке 072 означает **полный** flow, не обязательно Docker в CI                |

Второй `it`: старый refresh → `401` + `INVALID_REFRESH_TOKEN_MESSAGE`; refresh с successor после reuse → тоже `401` (семейство отозвано).

## Code Changes

- In-memory refresh: `persistForUser` пишет SHA-256 hash; `findActive` — `revokedAt === null` && `expiresAt > now`.
- Happy path: `refreshToken` после refresh ≠ login `refreshToken`; второй refresh с новым токеном → 200.
- Reuse: login refresh после первой ротации → 401; successor refresh → 401.

## Why This Matters

Без flow e2e можно «зеленить» rotation на моках, пока login и refresh используют разные store. Сквозной тест — минимальная уверенность, что долгая сессия **склеена** так же, как register/login в 085.

## Architecture Notes

- **Helper только в `test/`** — tests-first gate на `apps/api/src/` не срабатывает.
- **Реальный JWT** из DI; access JWT может совпадать при refresh в ту же секунду — assert только на opaque refresh rotation.
- **Email verification** — mock, как в 085.

## Changed Files

| File                                                                                        | Action  |
| ------------------------------------------------------------------------------------------- | ------- |
| `apps/api/test/helpers/auth-e2e-in-memory-refresh-token-store.ts`                           | created |
| `apps/api/test/auth-register-login-refresh-flow.e2e-spec.ts`                                | created |
| `docs/lessons/lesson-086-auth-refresh-rotation-e2e-flow.md`                                 | created |
| `docs/lessons/lesson-085-auth-register-login-e2e-flow.md`                                   | changed |
| `docs/lessons/lesson-070-auth-refresh-rotation.md`                                          | changed |
| `docs/lessons/lesson-072-auth-refresh-reuse-detection.md`                                   | changed |
| `docs/development-roadmap.md`                                                               | changed |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` / `docs/LOCAL_SETUP.md` | changed |

## Verification

- `npx nx run api:test:e2e -- auth-register-login-refresh-flow.e2e-spec.ts` — 2 passed.
- `npx nx run api:test:e2e` — все e2e зелёные.
- `npx nx run api:test` — unit-тесты без регрессий.

## TDD Sequence

- **Red:** flow spec без in-memory refresh (refresh 401 после login).
- **Green:** helper + overrides.
- **Refactor:** `registerAndLogin` helper в reuse `it`.

## Definition of Done

- [x] Сквозной register → login → refresh зелёный (двойная ротация).
- [x] Reuse после ротации → 401; successor неактивен.
- [x] In-memory refresh store с hash и family revoke.
- [x] Документация синхронизирована.
- [x] `nx run api:test:e2e` green.

## What To Remember

1. **Flow e2e refresh** дополняет `auth-refresh.e2e-spec.ts`, не заменяет.
2. **Reuse в flow** — осознанный scope: склейка 072, не Postgres.
3. **Opaque refresh** — главный assert rotation; access JWT может не меняться в fast e2e.
4. Следующий шаг — [087](../development-roadmap.md): auth e2e RBAC forbidden.

## Verify

```bash
npx nx run api:test:e2e -- auth-register-login-refresh-flow.e2e-spec.ts
npx nx run api:test:e2e
npx nx run api:test
```

## Homework

Сравните `auth-refresh.e2e-spec.ts` и `auth-register-login-refresh-flow.e2e-spec.ts`: какие методы `RefreshTokenService` реально вызываются в happy path rotation, и почему reuse-тест нельзя заменить только `expect(revokeTokenFamily).toHaveBeenCalled()` на моке?
