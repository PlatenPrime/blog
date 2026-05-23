# Lesson 091: Auth-sensitive rate limits (reset + resend verify)

## Learning Goal

Ограничить спам на **`POST /auth/request-password-reset`** и новый **`POST /auth/resend-verification`**: in-memory rate limit по **normalized email** и **client IP**, раздельные buckets per route, ответ **429** `TOO_MANY_REQUESTS` в problem+json; anti-enumeration сохранён (считаем каждый запрос, в т.ч. unknown email).

## Implementation Scope

В скоупе:

- [`apps/api/src/rate-limit/rate-limit-state.ts`](../../apps/api/src/rate-limit/rate-limit-state.ts) + spec — общая state-машина (переиспользуется login lockout).
- [`apps/api/src/auth/auth-sensitive-rate-limit.service.ts`](../../apps/api/src/auth/auth-sensitive-rate-limit.service.ts) + spec — scopes `password-reset` / `resend-verification`, email + IP.
- [`apps/api/src/http/resolve-client-ip.ts`](../../apps/api/src/http/resolve-client-ip.ts) + spec — `X-Forwarded-For` → `req.ip` → `unknown`.
- [`apps/api/src/auth/dto/create-resend-verification-body.dto.ts`](../../apps/api/src/auth/dto/create-resend-verification-body.dto.ts), `AuthService.resendVerification`, `POST resend-verification`.
- [`libs/shared-contracts/src/auth/resend-verification.types.ts`](../../libs/shared-contracts/src/auth/resend-verification.types.ts) — `ResendVerificationResponse`.
- [`apps/api/src/auth/email-verification-token.service.ts`](../../apps/api/src/auth/email-verification-token.service.ts) — `invalidateActiveForUser`.
- Env: `AUTH_SENSITIVE_RATE_*` в `env.schema.ts` и `.env.example`.
- E2e: [`apps/api/test/auth-sensitive-rate-limit.e2e-spec.ts`](../../apps/api/test/auth-sensitive-rate-limit.e2e-spec.ts).

Намеренно **не** делаем:

- `@nestjs/throttler`, Helmet — [шаг 092](../development-roadmap.md).
- Redis/shared store — **292+**.
- `Retry-After` header.
- Rate limit на `register` / `login` (login — **074**).
- Audit на каждый 429.

## Dependencies

- [Шаг 074](./lesson-074-login-brute-force-lockout.md) — образец 429 + in-memory Map.
- [Шаг 077](./lesson-077-password-reset-request-flow.md) — `request-password-reset`.
- [Шаг 076](./lesson-076-auth-verify-email.md) — verify tokens; resend отложен до 091.
- [Шаг 090](./lesson-090-email-channel.md) — доставка verify/reset по SMTP.

## External operations (outside the repo)

В этом шаге достаточно monorepo и уже поднятого local compose; аккаунты Railway/Vercel/Supabase не нужны. Rate limits — чистая логика API; MailDev не обязателен для e2e (SMTP отключён в `vitest.config.e2e.ts`).

| Action | Where | Required this step? | Why                                             |
| ------ | ----- | ------------------- | ----------------------------------------------- |
| —      | —     | **Нет**             | Нет новых портов, dashboard или cloud-аккаунтов |

**Architecture sketch:** Браузер или HTTP-клиент бьётся в Nest API. Перед обработкой reset/resend сервис проверяет два in-memory счётчика (email и IP) в рамках scope маршрута. При превышении порога API отвечает 429 problem+json, не раскрывая, существует ли email. В production за reverse proxy IP берётся из `X-Forwarded-For`; в dev supertest без заголовка попадает в bucket `unknown`.

**Deferred:** глобальный throttle и Helmet — **092**; distributed rate limit — **292+**.

## Step-by-Step Changes

1. **Red:** `rate-limit-state.spec.ts`, `auth-sensitive-rate-limit.service.spec.ts`, `resolve-client-ip.spec.ts`, расширить `auth.service.spec.ts`, e2e.
2. Обобщить state из login lockout; `AuthSensitiveRateLimitService` + env.
3. `resolve-client-ip`; контроллер передаёт IP в `requestPasswordReset` / `resendVerification`.
4. `invalidateActiveForUser` на email verification tokens; `resendVerification` + shared-contracts.
5. **Verify:** `shared-contracts:build`, `api:test`, `api:test:e2e`.

## Code Example

```typescript
// apps/api/src/auth/auth.service.ts (reset)
this.sensitiveRateLimit.assertWithinLimits(
  AUTH_SENSITIVE_RATE_SCOPE_PASSWORD_RESET,
  dto.email,
  clientIp,
);
this.sensitiveRateLimit.recordAttempt(
  AUTH_SENSITIVE_RATE_SCOPE_PASSWORD_RESET,
  dto.email,
  clientIp,
);
```

## Context

После **090** письма уходят по SMTP, но без лимитов можно заспамить ящик жертвы или перебирать email с одного IP. **091** добавляет точечную защиту до глобального throttler (**092**).

## Concept

| Env                                | Default   | Смысл                        |
| ---------------------------------- | --------- | ---------------------------- |
| `AUTH_SENSITIVE_RATE_MAX_ATTEMPTS` | `3`       | запросов в streak до lockout |
| `AUTH_SENSITIVE_RATE_WINDOW_MS`    | `3600000` | окно streak                  |
| `AUTH_SENSITIVE_RATE_DURATION_MS`  | `3600000` | длительность lockout         |

**Поток:** `assertWithinLimits` (email + IP) → `recordAttempt` → бизнес-логика → neutral **200**. Сброс и resend — **разные scopes** (лимит reset не блокирует resend).

## Why This Matters

Login lockout (**074**) считает **неудачи**; reset/resend всегда отвечают одинаково — лимит должен считать **каждый запрос**. Два измерения (email + IP) закрывают и спам на один адрес, и перебор адресов с одного IP.

## Architecture Notes

- **In-memory** `Map`: один процесс API; multi-instance → **292+**.
- **Unknown IP** → ключ `unknown` (нельзя обойти отсутствием заголовка).
- **E2E:** `.overrideProvider(AuthSensitiveRateLimitService).useValue(instance)` — тот же singleton, что в `beforeEach`.
- **Resend:** neutral message для unknown / already verified; invalidate старых verify-токенов перед новым.

## Changed Files

| File                                                           | Action                                  |
| -------------------------------------------------------------- | --------------------------------------- |
| `apps/api/src/rate-limit/rate-limit-state.ts`                  | created                                 |
| `apps/api/src/rate-limit/rate-limit-state.spec.ts`             | created                                 |
| `apps/api/src/auth/login-lockout-state.ts`                     | changed — wrapper over rate-limit-state |
| `apps/api/src/auth/auth-sensitive-rate-limit.constants.ts`     | created                                 |
| `apps/api/src/auth/auth-sensitive-rate-limit-scope.ts`         | created                                 |
| `apps/api/src/auth/auth-sensitive-rate-limit.service.ts`       | created                                 |
| `apps/api/src/auth/auth-sensitive-rate-limit.service.spec.ts`  | created                                 |
| `apps/api/src/http/resolve-client-ip.ts`                       | created                                 |
| `apps/api/src/http/resolve-client-ip.spec.ts`                  | created                                 |
| `apps/api/src/auth/dto/create-resend-verification-body.dto.ts` | created                                 |
| `apps/api/src/auth/email-verification-token.service.ts`        | changed — `invalidateActiveForUser`     |
| `apps/api/src/auth/email-verification-token.service.spec.ts`   | changed                                 |
| `apps/api/src/auth/auth-credentials.constants.ts`              | changed — resend message                |
| `apps/api/src/auth/auth.service.ts`                            | changed — rate limits + resend          |
| `apps/api/src/auth/auth.service.spec.ts`                       | changed                                 |
| `apps/api/src/auth/auth.controller.ts`                         | changed                                 |
| `apps/api/src/auth/auth.module.ts`                             | changed                                 |
| `apps/api/src/config/env.schema.ts`                            | changed                                 |
| `apps/api/src/config/env.schema.spec.ts`                       | changed                                 |
| `.env.example`                                                 | changed                                 |
| `libs/shared-contracts/src/auth/resend-verification.types.ts`  | created                                 |
| `libs/shared-contracts/src/index.ts`                           | changed                                 |
| `apps/api/test/auth-sensitive-rate-limit.e2e-spec.ts`          | created                                 |
| `docs/lessons/lesson-091-auth-sensitive-rate-limits.md`        | created                                 |
| `docs/development-roadmap.md`                                  | changed                                 |
| `docs/README.md`, `docs/learning-path.md`                      | changed                                 |
| `docs/storytelling.md`                                         | changed                                 |
| `docs/security/threat-model-stub.md`                           | changed                                 |
| `docs/lessons/lesson-090-email-channel.md`                     | changed — link to 091                   |
| `docs/lessons/lesson-076-auth-verify-email.md`                 | changed — resend done                   |
| `docs/lessons/lesson-077-password-reset-request-flow.md`       | changed — link to 091                   |

## Verification

```bash
nx run shared-contracts:build
nx run api:test
nx run api:test:e2e
```

## Definition of Done

- [x] Rate limits on reset and resend (email + IP, separate scopes).
- [x] `POST /api/v1/auth/resend-verification` with anti-enumeration.
- [x] Unit + e2e specs; env documented.
- [x] Storytelling chapter XVI updated; roadmap baseline **092** next.
- [x] **External operations** — none required.

## What To Remember

- Следующий шаг — **092** (Helmet + global `@nestjs/throttler`), не путать с точечными лимитами 091.
- Register по-прежнему без rate limit; повторная verify — только через resend.
