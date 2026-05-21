# Lesson 074: Login brute-force lockout (email)

## Learning Goal

Ограничить перебор паролей на **`POST /auth/login`**: in-memory lockout по **normalized email**, env-политика (порог, окно, длительность), ответ **429** `TOO_MANY_REQUESTS` в problem+json; неудачи на несуществующий email тоже считаются.

## Implementation Scope

В скоупе:

- [`libs/shared-contracts/src/errors/api-error.types.ts`](../../libs/shared-contracts/src/errors/api-error.types.ts) — `API_ERROR_CODE_TOO_MANY_REQUESTS`.
- [`libs/shared-contracts/src/errors/problem-details.types.ts`](../../libs/shared-contracts/src/errors/problem-details.types.ts) — slug/title для 429.
- [`apps/api/src/auth/login-lockout.constants.ts`](../../apps/api/src/auth/login-lockout.constants.ts) — defaults, `LOGIN_LOCKOUT_MESSAGE`.
- [`apps/api/src/auth/login-lockout-state.ts`](../../apps/api/src/auth/login-lockout-state.ts) + spec — pure streak/lock logic.
- [`apps/api/src/auth/login-lockout.service.ts`](../../apps/api/src/auth/login-lockout.service.ts) + spec — in-memory `Map`, `assertNotLocked` / `recordFailure` / `clear`.
- [`apps/api/src/config/env.schema.ts`](../../apps/api/src/config/env.schema.ts) — `LOGIN_LOCKOUT_*` keys.
- [`apps/api/src/auth/auth.service.ts`](../../apps/api/src/auth/auth.service.ts) — lockout в `login()`.
- [`apps/api/src/errors/map-exception-to-api-error.ts`](../../apps/api/src/errors/map-exception-to-api-error.ts) — map 429 → platform code.
- [`apps/api/test/auth-login-lockout.e2e-spec.ts`](../../apps/api/test/auth-login-lockout.e2e-spec.ts) — e2e с `maxAttempts: 2`.

Намеренно **не** делаем:

- Lockout по IP, `@nestjs/throttler`, Redis/DB — [шаги 279–280](../development-roadmap.md).
- `Retry-After` header — note в Architecture Notes.
- Register / refresh / logout — без изменений.

## Dependencies

- [Шаг 065](./lesson-065-auth-login.md) — `POST /auth/login`, единый `401` на credentials.
- [Шаг 058](./lesson-058-datasource-config-database-url.md) — Zod root env.
- [Шаг 038](./lesson-038-global-exception-filter.md) — problem+json.

## Step-by-Step Changes

1. **Red:** `login-lockout-state.spec.ts`, `login-lockout.service.spec.ts`, расширить `auth.service.spec.ts` и `map-exception-to-api-error.spec.ts`.
2. `API_ERROR_CODE_TOO_MANY_REQUESTS` в `shared-contracts`.
3. Pure state + `LoginLockoutService` + env schema + `.env.example`.
4. `AuthService.login`: assert → try credentials → `recordFailure` on `401` / `clear` on success.
5. E2e `auth-login-lockout.e2e-spec.ts` с override `LoginLockoutService.useValue`.
6. **Verify:** `shared-contracts:build`, `api:test`, `api:test:e2e`, `api:lint`, `api:build`.
7. Docs sync: roadmap, storytelling, README, learning-path, LOCAL_SETUP; back-links в 065, 073.

## Context

После 073 login принимает неограниченное число неверных паролей. 074 добавляет **базовую** защиту аккаунта до RBAC (081+) и глобального rate limit (279+).

## Concept

| Env                          | Default           | Смысл                          |
| ---------------------------- | ----------------- | ------------------------------ |
| `LOGIN_LOCKOUT_MAX_ATTEMPTS` | `5`               | неудач в streak до lockout     |
| `LOGIN_LOCKOUT_WINDOW_MS`    | `900000` (15 мин) | сброс streak без новых failure |
| `LOGIN_LOCKOUT_DURATION_MS`  | `900000`          | длительность lockout           |

**Поток:** перед проверкой пароля — `assertNotLocked`; при `UnauthorizedException` — `recordFailure` (включая unknown email); при успехе — `clear`. Lockout → **429** с отдельным сообщением (не путать с `401` credentials).

## Code Changes

- Ключ lockout: `normalizeUserEmail` — как в `UserService.findByEmail`.
- После истечения `lockedUntil` новый failure начинает streak с 1 (не продолжает старый счётчик).

## Why This Matters

Единый `401` скрывает перечисление аккаунтов, но не замедляет brute-force. Lockout по email — минимальная защита без инфраструктуры; оператор настраивает пороги через env.

## Architecture Notes

- **In-memory** `Map`: один процесс API; multi-instance → шаги 279+ / Redis позже.
- **Неудача до `findByEmail`:** `recordFailure` на любом `401` login — иначе lockout выдаёт существующие emails.
- **429 vs 401:** отдельный platform code `TOO_MANY_REQUESTS`; mapper по HTTP status 429.
- **E2E:** `overrideProvider(LoginLockoutService).useValue(instance)` — не `.useFactory(() => new ...)`, иначе Nest может не подменить singleton.

## Changed Files

| File                                                                                        | Action               |
| ------------------------------------------------------------------------------------------- | -------------------- |
| `libs/shared-contracts/src/errors/api-error.types.ts`                                       | changed              |
| `libs/shared-contracts/src/errors/problem-details.types.ts`                                 | changed              |
| `libs/shared-contracts/src/index.ts`                                                        | changed              |
| `apps/api/src/auth/login-lockout.constants.ts`                                              | created              |
| `apps/api/src/auth/login-lockout-state.ts`                                                  | created              |
| `apps/api/src/auth/login-lockout-state.spec.ts`                                             | created              |
| `apps/api/src/auth/login-lockout.service.ts`                                                | created              |
| `apps/api/src/auth/login-lockout.service.spec.ts`                                           | created              |
| `apps/api/src/config/env.schema.ts`                                                         | changed              |
| `apps/api/src/config/env.schema.spec.ts`                                                    | changed              |
| `.env.example`                                                                              | changed              |
| `apps/api/src/auth/auth.service.ts`                                                         | changed              |
| `apps/api/src/auth/auth.service.spec.ts`                                                    | changed              |
| `apps/api/src/auth/auth.module.ts`                                                          | changed              |
| `apps/api/src/errors/map-exception-to-api-error.ts`                                         | changed              |
| `apps/api/src/errors/map-exception-to-api-error.spec.ts`                                    | changed              |
| `apps/api/test/auth-login-lockout.e2e-spec.ts`                                              | created              |
| `docs/lessons/lesson-074-login-brute-force-lockout.md`                                      | created              |
| `docs/lessons/lesson-065-auth-login.md` / `lesson-073-*.md`                                 | changed — back-links |
| `docs/development-roadmap.md`                                                               | changed — 074 done   |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` / `docs/LOCAL_SETUP.md` | changed              |

## Verification

- `npx nx run shared-contracts:build`
- `npx nx run api:test` — lockout state/service, auth.service, map-exception, env.schema
- `npx nx run api:test:e2e` — `auth-login-lockout.e2e-spec.ts`
- `npx nx run api:lint` / `api:build`

## TDD Sequence

- **Red:** unit specs на pure state и service; auth.service lockout cases; mapper 429.
- **Green:** implementation + e2e.
- **Refactor:** нет.

## Definition of Done

- [x] После N неудачных login на email — 429 `TOO_MANY_REQUESTS`.
- [x] Успешный login сбрасывает streak.
- [x] Неудачи на unknown email учитываются в lockout.
- [x] Unit + e2e green; docs/storytelling синхронизированы.

## What To Remember

- Lockout key = normalized email, не raw DTO.
- `recordFailure` на любом login `401`, не только «user found».
- In-memory lockout не shared между репликами API.
- IP/global throttle — отдельные roadmap-шаги.

## Verify

```bash
npx nx run shared-contracts:build
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint
npx nx run api:build
```

## Homework

В `.env` поставить `LOGIN_LOCKOUT_MAX_ATTEMPTS=3`, перезапустить API, трижды отправить неверный пароль на один email — убедиться в 429 problem+json; успешный login после одной-двух неудач сбрасывает счётчик.
