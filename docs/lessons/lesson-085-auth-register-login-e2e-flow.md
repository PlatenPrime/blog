# Lesson 085: Auth e2e register → login happy path

## Learning Goal

Добавить **сквозной e2e** `register → login → GET /auth/me`: один экземпляр приложения, общее in-memory хранилище пользователя, **реальный** `PasswordHasherService` и JWT — в отличие от изолированных e2e 063/065/067 с фиксированным `fakeUser`.

## Implementation Scope

В скоупе:

- [`apps/api/test/helpers/auth-e2e-in-memory-user-store.ts`](../../apps/api/test/helpers/auth-e2e-in-memory-user-store.ts) — stateful `UserService` override для flow e2e.
- [`apps/api/test/auth-register-login-flow.e2e-spec.ts`](../../apps/api/test/auth-register-login-flow.e2e-spec.ts) — happy path: 201 → 200 + tokens → 200 `/me`.

Намеренно **не** делаем:

- Реальный Postgres в e2e (как в остальных auth e2e — `DataSource` stub).
- verify-email → login, refresh rotation, RBAC 403 — шаги **086–087**, **098**.
- Изменения `apps/api/src/` (только `test/`).

## Dependencies

- [Шаг 063](./lesson-063-auth-register-dto.md) — `POST /auth/register`.
- [Шаг 065](./lesson-065-auth-login.md) — `POST /auth/login`.
- [Шаг 067](./lesson-067-jwt-strategy-auth-guard.md) — `GET /auth/me` + Bearer.
- [Шаг 084](./lesson-084-jwt-payload-shared-contracts.md) — JWT `sub` = user id.

## Step-by-Step Changes

1. **Red:** `auth-register-login-flow.e2e-spec.ts` с ожиданием цепочки (без helper — падает или не компилируется).
2. Добавить `createInMemoryUserServiceOverride(hasher)` — `create` + `findByEmail`, Argon2 hash при register.
3. E2e bootstrap: как в `auth-login.e2e-spec.ts`, override `UserService` + token-сервисы, **не** мокать `PasswordHasherService` / `JwtAccessTokenService`.
4. **Green:** один `it` — register → login → `/me`.
5. Docs sync: roadmap, storytelling (глава XIV), README, learning-path, LOCAL_SETUP.

## Code Example

```typescript
// apps/api/test/auth-register-login-flow.e2e-spec.ts (фрагмент)
const passwordHasher = new PasswordHasherService();
const inMemoryUsers = createInMemoryUserServiceOverride(passwordHasher);

await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(UserService)
  .useValue(inMemoryUsers)
  // ... DataSource stub, token mocks
  .compile();

await request(app.getHttpServer())
  .post(registerBase)
  .send({ email, password })
  .expect(201);
const login = await request(app.getHttpServer())
  .post(loginBase)
  .send({ email, password })
  .expect(200);
await request(app.getHttpServer())
  .get(meBase)
  .set('Authorization', `Bearer ${login.body.accessToken}`)
  .expect(200);
```

```bash
npx nx run api:test:e2e -- auth-register-login-flow.e2e-spec.ts
```

## Context

Уроки **063** и **065** проверяют register и login **по отдельности** с подменой `UserService` и статическим пользователем. Это быстрый CI, но не ловит рассинхрон hash между register и login. Шаг **085** — первая «страховка» сквозной цепочки перед **086** (refresh) и **087** (RBAC forbidden).

## Concept

**Изолированный e2e vs flow e2e:** первый тестирует контракт одного маршрута; второй — что состояние, созданное register, доступно login и что выданный access JWT принимается guard'ом на `/me`.

## Code Changes

- In-memory store нормализует email как `UserService`.
- Register и login делят один `Map` в рамках одного `beforeEach`.
- Уникальный email на прогон (`flow-${Date.now()}@...`) — изоляция при последовательном vitest e2e.

## Why This Matters

Сквозной happy path — минимальная уверенность, что Track 2 auth «склеен» end-to-end без ручного curl. Дальше по тому же паттерну расширяют матрицу (**086–087**).

## Architecture Notes

- **Helper только в `test/`** — tests-first gate на `apps/api/src/` не срабатывает.
- **Реальный Argon2** в store и в `AuthService.login` — один и тот же `PasswordHasherService` из DI модуля.
- **Token-сервисы** по-прежнему моки — не тестируем persistence refresh/email в этом шаге.

## Changed Files

| File                                                                                        | Action  |
| ------------------------------------------------------------------------------------------- | ------- |
| `apps/api/test/helpers/auth-e2e-in-memory-user-store.ts`                                    | created |
| `apps/api/test/auth-register-login-flow.e2e-spec.ts`                                        | created |
| `docs/lessons/lesson-085-auth-register-login-e2e-flow.md`                                   | created |
| `docs/development-roadmap.md`                                                               | changed |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` / `docs/LOCAL_SETUP.md` | changed |

## Verification

- `npx nx run api:test:e2e -- auth-register-login-flow.e2e-spec.ts` — 1 passed.
- `npx nx run api:test:e2e` — все e2e зелёные.
- `npx nx run api:test` — unit-тесты без регрессий.

## TDD Sequence

- **Red:** flow spec без in-memory store (login 401 после register с разными моками).
- **Green:** helper + overrides.
- **Refactor:** вынести store в `test/helpers/`.

## Definition of Done

- [x] Сквозной register → login → `/me` зелёный.
- [x] Register и login используют одно хранилище + реальный hash.
- [x] Документация синхронизирована.
- [x] `nx run api:test:e2e` green.

## What To Remember

1. **Flow e2e** дополняет, не заменяет, изолированные e2e 063/065.
2. **Stateful store** — ключевое отличие от `fakeUser`.
3. **Не мокать hasher/JWT** в happy path — иначе тест бессмысленен.
4. Postgres в CI для auth e2e пока не нужен.
5. Следующий шаг — [086](../development-roadmap.md): auth e2e refresh rotation.

## Verify

```bash
npx nx run api:test:e2e -- auth-register-login-flow.e2e-spec.ts
npx nx run api:test:e2e
npx nx run api:test
```

## Homework

Сравните `auth-register.e2e-spec.ts` и `auth-register-login-flow.e2e-spec.ts`: какие override одинаковые, какие различаются и почему flow-тест не мокает `PasswordHasherService`?
