# Lesson 093: `REQUIRE_EMAIL_VERIFIED` policy

## Learning Goal

Включить **env-политику подтверждённой почты**: при `REQUIRE_EMAIL_VERIFIED=true` блокировать `login` и `refresh` для пользователей без `email_verified_at`, а на JWT-защищённых маршрутах — **403** `FORBIDDEN` через guard после проверки в БД. По умолчанию `false` — локальный dev без изменений.

## Implementation Scope

В скоупе:

- Env `REQUIRE_EMAIL_VERIFIED` в [`env.schema.ts`](../../apps/api/src/config/env.schema.ts) + `.env.example`.
- [`email-verified-policy.service.ts`](../../apps/api/src/auth/email-verified-policy.service.ts) + spec — `isRequired()`, `assertUserMayAuthenticate`.
- [`email-verified.guard.ts`](../../apps/api/src/auth/email-verified.guard.ts) + spec — после `JwtAuthGuard` на sensitive routes.
- [`auth.service.ts`](../../apps/api/src/auth/auth.service.ts) — проверка в `login` / `refresh`; audit `auth.login.blocked_unverified`.
- [`user.service.ts`](../../apps/api/src/users/user.service.ts) — `findById` для guard и refresh.
- Guards на `GET /auth/me`, `GET /rbac/_probe/*`, `GET /cms/posts`.
- E2e: [`auth-require-email-verified.e2e-spec.ts`](../../apps/api/test/auth-require-email-verified.e2e-spec.ts).

Намеренно **не** делаем:

- Claim `emailVerified` в JWT — проверка по БД.
- Глобальный `APP_GUARD` на все маршруты.
- Унификация auth error codes (**096**); OpenAPI — [lesson-094](./lesson-094-openapi-swagger.md).

## Dependencies

- [Шаг 076](./lesson-076-auth-verify-email.md) — `email_verified_at`, verify flow.
- [Шаг 092](./lesson-092-api-security-baseline.md) — периметр до публичного CMS.
- [Шаг 081](./lesson-081-roles-guard.md) — паттерн guard + JWT.

## External operations (outside the repo)

В этом шаге достаточно monorepo + уже поднятого local compose; аккаунты Railway/Vercel/Supabase не нужны.

| Action | Where | Required this step? | Why                                    |
| ------ | ----- | ------------------- | -------------------------------------- |
| —      | —     | **Нет**             | Нет новых портов, dashboard или облака |

**Architecture sketch:** Клиент регистрируется и подтверждает email через verify/resend (без gate). Оператор включает `REQUIRE_EMAIL_VERIFIED=true` на staging/production. Тогда login/refresh и маршруты с `EmailVerifiedGuard` читают `users.email_verified_at` из Postgres; JWT по-прежнему содержит только `sub`. Pre-auth маршруты (register, verify-email, reset) остаются доступны.

## Step-by-Step Changes

1. **Red:** policy service spec, guard spec, `user.service` `findById` spec, `auth.service` login/refresh specs, env spec, e2e policy suite.
2. **Green:** env key, policy service, guard, auth service hooks, wire controllers.
3. **Verify:** `shared-contracts:build`, `api:test`, `api:test:e2e`, `api:lint`, `api:build`.

## Code Example

```typescript
// apps/api/src/auth/auth.controller.ts
@Get('me')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
me(@CurrentUser() user: AuthRequestUser): AuthMeResponse {
  return { id: user.sub };
}
```

## Context

После **092** API имеет общий throttle и Helmet, но учётка с неподтверждённой почтой всё ещё могла войти и ходить по RBAC/CMS probe. **093** — продуктовый gate перед Track 3 (**110**) и OpenAPI **094**.

## Concept

| `REQUIRE_EMAIL_VERIFIED` | Поведение                                                      |
| ------------------------ | -------------------------------------------------------------- |
| `false` (default)        | как до шага 093                                                |
| `true`                   | login/refresh/sensitive JWT routes требуют `email_verified_at` |

**403 vs 401:** неверный пароль — **401**; верный пароль, но почта не подтверждена — **403** (не login lockout).

## Why This Matters

Регистрация без verify не доказывает владение адресом. Env-флаг позволяет включить строгость на staging/prod, не ломая локальные flow и e2e по умолчанию.

## Changed Files

| File                                                       | Action                                 |
| ---------------------------------------------------------- | -------------------------------------- |
| `apps/api/src/config/env.schema.ts`                        | changed — `REQUIRE_EMAIL_VERIFIED`     |
| `apps/api/src/config/env.schema.spec.ts`                   | changed                                |
| `.env.example`                                             | changed                                |
| `apps/api/src/auth/auth-credentials.constants.ts`          | changed — `EMAIL_NOT_VERIFIED_MESSAGE` |
| `apps/api/src/auth/email-verified-policy.constants.ts`     | created                                |
| `apps/api/src/auth/email-verified-policy.service.ts`       | created                                |
| `apps/api/src/auth/email-verified-policy.service.spec.ts`  | created                                |
| `apps/api/src/auth/email-verified.guard.ts`                | created                                |
| `apps/api/src/auth/email-verified.guard.spec.ts`           | created                                |
| `apps/api/src/auth/auth.service.ts`                        | changed — login/refresh assert         |
| `apps/api/src/auth/auth.service.spec.ts`                   | changed                                |
| `apps/api/src/auth/auth.controller.ts`                     | changed — `EmailVerifiedGuard` on `me` |
| `apps/api/src/auth/auth.module.ts`                         | changed — providers/exports            |
| `apps/api/src/users/user.service.ts`                       | changed — `findById`                   |
| `apps/api/src/users/user.service.spec.ts`                  | changed                                |
| `apps/api/src/rbac/rbac-probe.controller.ts`               | changed                                |
| `apps/api/src/cms/cms-posts.controller.ts`                 | changed                                |
| `apps/api/src/security-audit/security-audit-event-type.ts` | changed — `AuthLoginBlockedUnverified` |
| `apps/api/test/auth-require-email-verified.e2e-spec.ts`    | created                                |
| `docs/lessons/lesson-093-require-email-verified-policy.md` | created                                |
| `docs/development-roadmap.md`                              | changed                                |
| `docs/storytelling.md`                                     | changed                                |
| `docs/README.md`                                           | changed                                |
| `docs/learning-path.md`                                    | changed                                |
| `docs/LOCAL_SETUP.md`                                      | changed                                |
| `docs/security/threat-model-stub.md`                       | changed                                |
| `docs/lessons/lesson-092-api-security-baseline.md`         | changed — back-link                    |

## Verification

```bash
nx run shared-contracts:build
nx run api:test
nx run api:test:e2e
nx run api:lint
nx run api:build
```

- **E2E:** `test/auth-require-email-verified.e2e-spec.ts` — policy on → login/refresh/me **403**; verified login **200**; policy off → unverified login **200**.

## TDD Sequence

1. **Red:** policy/guard/service specs + e2e with `REQUIRE_EMAIL_VERIFIED=true` in suite `beforeEach`.
2. **Green:** env, policy service, guard wiring, auth hooks.
3. **Refactor:** shared `assertUserMayAuthenticate` для login, refresh и guard.

## Definition of Done

- [x] `REQUIRE_EMAIL_VERIFIED` в env (default `false`).
- [x] Login/refresh блокируют unverified при policy on; **403** не триггерит lockout.
- [x] `EmailVerifiedGuard` на `me`, RBAC probes, `cms/posts`.
- [x] Audit `auth.login.blocked_unverified` на blocked login.
- [x] Unit specs colocated; e2e policy suite.
- [x] Docs sync: roadmap, storytelling, indexes, threat model.

## What To Remember

- Pre-auth маршруты (register, verify-email, resend, reset) **вне** gate — иначе пользователь не сможет подтвердить почту.
- Refresh блокируется при policy on — нельзя обойти gate старым refresh.
- Session metadata в audit — [lesson-095](./lesson-095-session-device-metadata.md); следующий шаг Track 2 — **096** (auth error envelope).
