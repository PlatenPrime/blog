# Lesson 073: Token TTL configuration + documentation

## Learning Goal

Вынести **lifetime refresh-токена** из хардкода в валидируемый root env и задокументировать **единую TTL-политику** access + refresh: оператор меняет сроки без правки кода; access JWT уже на env с [шага 066](./lesson-066-jwt-access-token-service.md).

## Implementation Scope

В скоупе:

- [`apps/api/src/config/env.schema.ts`](../../apps/api/src/config/env.schema.ts) — `JWT_REFRESH_EXPIRES_MS` через `envMilliseconds` (default = `DEFAULT_REFRESH_TOKEN_TTL_MS`).
- [`apps/api/src/config/env.schema.spec.ts`](../../apps/api/src/config/env.schema.spec.ts) — defaults, override, bounds.
- [`.env.example`](../../.env.example) — `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_MS` с комментариями.
- [`apps/api/src/auth/refresh-token.constants.ts`](../../apps/api/src/auth/refresh-token.constants.ts) — единый default 30 дней для Zod и кода.
- [`apps/api/src/auth/refresh-expires-at.ts`](../../apps/api/src/auth/refresh-expires-at.ts) + spec — pure `refreshExpiresAt(now, ttlMs)`.
- [`apps/api/src/auth/auth.service.ts`](../../apps/api/src/auth/auth.service.ts) — `ConfigService`, `JWT_REFRESH_EXPIRES_MS` в login/refresh.
- [`apps/api/src/auth/auth.service.spec.ts`](../../apps/api/src/auth/auth.service.spec.ts) — mock config + assert `expiresAt` delta.

Намеренно **не** делаем:

- Zod-валидацию формата `JWT_ACCESS_EXPIRES_IN` (jsonwebtoken валидирует при старте).
- `expiresIn` в ответах API / `shared-contracts` — [шаг 084](../development-roadmap.md).
- Brute-force / lockout — [шаг 074](./lesson-074-login-brute-force-lockout.md) (done).
- Auth module README — [шаг 101](../development-roadmap.md).

## Dependencies

- [Шаг 066](./lesson-066-jwt-access-token-service.md) — `JWT_ACCESS_EXPIRES_IN`, `JwtModule`.
- [Шаг 070](./lesson-070-auth-refresh-rotation.md) — `refreshExpiresAt` при login/refresh.
- [Шаг 058](./lesson-058-datasource-config-database-url.md) — Zod root env.

## Step-by-Step Changes

1. **Red:** `env.schema.spec.ts` для `JWT_REFRESH_EXPIRES_MS`; `refresh-expires-at.spec.ts`; `auth.service.spec.ts` — TTL delta на login/refresh.
2. `JWT_REFRESH_EXPIRES_MS` в `rootEnvSchema` (min 1 ч, max 90 сут), `ROOT_ENV_KEYS`, `.env.example`.
3. `refreshExpiresAt` helper; `AuthService` + `ConfigService`.
4. **Verify:** `api:test`, `api:lint`, `api:build`.
5. Синхронизировать roadmap, storytelling, README, learning-path, LOCAL_SETUP; back-links в 066–072.

## Context

После 072 auth-поток полный, но refresh TTL был константой `DEFAULT_REFRESH_TOKEN_TTL_MS`. Access уже читался из env на 066; 073 закрывает отложенный долг 069–072 и даёт оператору один блок JWT в `.env.example`.

## Concept

| Токен          | Хранение                    | Env                                    | Default (baseline)     |
| -------------- | --------------------------- | -------------------------------------- | ---------------------- |
| Access JWT     | Stateless, HS256            | `JWT_ACCESS_EXPIRES_IN` (jsonwebtoken) | `15m`                  |
| Refresh opaque | `refresh_tokens.expires_at` | `JWT_REFRESH_EXPIRES_MS` (integer ms)  | 30 дней (`2592000000`) |

**Поведение:** короткий access, длинный refresh; клиент продлевает сессию через `POST /auth/refresh`. Rotation (070), reuse (072) и logout (071) **не продлевают** старый refresh — TTL задаёт только **новые** выдачи при login/refresh. Укорочение env в prod не меняет уже записанные `expires_at`.

## Code Changes

- `AuthService.refreshExpiresAt()` → `refreshExpiresAt(Date.now(), config.getOrThrow('JWT_REFRESH_EXPIRES_MS'))`.
- `JwtModule` без изменений — по-прежнему `JWT_ACCESS_EXPIRES_IN`.

## Why This Matters

Сроки жизни токенов — политика безопасности и UX; их должны менять через конфиг и документацию, а не через PR с магическими числами в сервисе.

## Architecture Notes

- Имя **`JWT_REFRESH_EXPIRES_MS`** (не `JWT_REFRESH_EXPIRES_IN`): refresh считается как `Date + ms`, как `REQUEST_TIMEOUT_MS`.
- Default импортируется из `refresh-token.constants.ts` в Zod — одно число в репозитории.
- **Prod:** смена `JWT_SECRET` инвалидирует access JWT; укорочение `JWT_REFRESH_EXPIRES_MS` влияет только на новые persist при login/refresh.

## Changed Files

| File                                                                                        | Action                             |
| ------------------------------------------------------------------------------------------- | ---------------------------------- |
| `apps/api/src/config/env.schema.ts`                                                         | changed — `JWT_REFRESH_EXPIRES_MS` |
| `apps/api/src/config/env.schema.spec.ts`                                                    | changed                            |
| `.env.example`                                                                              | changed — refresh TTL              |
| `apps/api/src/auth/refresh-token.constants.ts`                                              | changed — comment                  |
| `apps/api/src/auth/refresh-expires-at.ts`                                                   | created                            |
| `apps/api/src/auth/refresh-expires-at.spec.ts`                                              | created                            |
| `apps/api/src/auth/auth.service.ts`                                                         | changed — ConfigService + env TTL  |
| `apps/api/src/auth/auth.service.spec.ts`                                                    | changed                            |
| `docs/lessons/lesson-073-token-ttl-configuration.md`                                        | created                            |
| `docs/lessons/lesson-066-*.md` … `lesson-072-*.md`                                          | changed — back-links               |
| `docs/development-roadmap.md`                                                               | changed — шаг 073 done             |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` / `docs/LOCAL_SETUP.md` | changed                            |

## Verification

- `npx nx run api:test` — `env.schema.spec.ts`, `refresh-expires-at.spec.ts`, `auth.service.spec.ts`
- `npx nx run api:lint` — без предупреждений
- `npx nx run api:build` — успешная сборка
- Docs check: `.env.example` ↔ `env.schema` ↔ lesson-073 ↔ storytelling

## TDD Sequence

- **Red:** env + helper + auth.service TTL assertions.
- **Green:** schema, service, `.env.example`.
- **Refactor:** нет.

## Definition of Done

- [x] `JWT_REFRESH_EXPIRES_MS` в Zod с default 30 дней и bounds 1 ч–90 сут.
- [x] Login/refresh persist `expires_at` из env, не из хардкода.
- [x] Unit specs в том же change set, что production-код.
- [x] TTL policy задокументирована в уроке и storytelling.
- [x] `nx run api:test` green.

## What To Remember

- Access — `JWT_ACCESS_EXPIRES_IN` (строка для jsonwebtoken); refresh — `JWT_REFRESH_EXPIRES_MS` (число ms).
- Rotation/reuse/logout не отменяют env TTL.
- Новые короче env — только для **новых** refresh-строк.

## Verify

```bash
npx nx run api:test
npx nx run api:lint
npx nx run api:build
```

## Homework

В `.env` локально поставить `JWT_REFRESH_EXPIRES_MS=3600000` (1 ч), перезапустить API, login → проверить в БД `refresh_tokens.expires_at` ≈ now + 1 ч.
