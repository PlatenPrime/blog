# Lesson 092: API security baseline (Helmet + global throttler)

## Learning Goal

Закрыть **базовый периметр HTTP** для всего API: защитные заголовки (Helmet) на каждый ответ и глобальный rate limit по IP (`@nestjs/throttler`), с **429** `TOO_MANY_REQUESTS` в problem+json. Ops-маршруты (`/health`, `/metrics`) не throttl'ятся.

## Implementation Scope

В скоупе:

- `helmet`, `@nestjs/throttler` в `apps/api`.
- [`apps/api/src/config/build-helmet-options.ts`](../../apps/api/src/config/build-helmet-options.ts) + spec — API-friendly профиль (без CSP/COEP).
- [`apps/api/src/config/configure-api-security.ts`](../../apps/api/src/config/configure-api-security.ts) — `app.use(helmet(...))`.
- [`apps/api/src/config/configure-api-http-bootstrap.ts`](../../apps/api/src/config/configure-api-http-bootstrap.ts) — единый bootstrap (CORS → prefix/versioning → Helmet → shutdown).
- [`apps/api/src/config/global-throttle.constants.ts`](../../apps/api/src/config/global-throttle.constants.ts) — defaults + message constant.
- [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts) — `ThrottlerModule.forRootAsync`, `APP_GUARD` `ThrottlerGuard`.
- [`apps/api/src/health/health.controller.ts`](../../apps/api/src/health/health.controller.ts), [`metrics.controller.ts`](../../apps/api/src/metrics/metrics.controller.ts) — `@SkipThrottle()`.
- Env: `GLOBAL_THROTTLE_*` в `env.schema.ts` и `.env.example`.
- E2e: [`apps/api/test/api-security-baseline.e2e-spec.ts`](../../apps/api/test/api-security-baseline.e2e-spec.ts) — headers + 429 + ops exempt.

Намеренно **не** делаем:

- Redis/shared throttle store — **292+**.
- Per-route auth throttles — **293**.
- Helmet hardening (CSP, HSTS) — **294**, **297**.
- Замена login lockout (**074**) или auth-sensitive limits (**091**).
- `Retry-After` на global 429.

## Dependencies

- [Шаг 038](./lesson-038-global-exception-filter.md) — problem+json; 429 → `TOO_MANY_REQUESTS`.
- [Шаг 074](./lesson-074-login-brute-force-lockout.md) — точечный lockout по email.
- [Шаг 091](./lesson-091-auth-sensitive-rate-limits.md) — reset/resend limits.

## External operations (outside the repo)

В этом шаге достаточно monorepo + уже поднятого local compose; аккаунты Railway/Vercel/Supabase не нужны.

| Action | Where | Required this step? | Why                                    |
| ------ | ----- | ------------------- | -------------------------------------- |
| —      | —     | **Нет**             | Нет новых портов, dashboard или облака |

**Architecture sketch:** Клиент (браузер или HTTP tool) бьётся в Nest API. Express middleware Helmet добавляет заголовки до контроллера. `ThrottlerGuard` считает запросы по IP (in-memory) на всех versioned маршрутах; при превышении `GLOBAL_THROTTLE_LIMIT` в окне `GLOBAL_THROTTLE_TTL_MS` — 429 problem+json. K8s probes и Prometheus scrape ходят на `/health` и `/metrics` без глобального throttle. Login lockout и auth-sensitive limits остаются отдельными слоями в сервисах auth.

**Deferred:** distributed rate limit и prod tuning — **292–293**; security headers review — **294**.

## Step-by-Step Changes

1. **Red:** `build-helmet-options.spec.ts`, расширить `env.schema.spec.ts`, `map-exception-to-api-error.spec.ts` (`ThrottlerException`), e2e header/throttle scan.
2. Установить `helmet`, `@nestjs/throttler`; constants + Helmet bootstrap.
3. `configure-api-http-bootstrap`; подключить в `main.ts`, `create-api-test-app.ts`, `request-timeout.e2e-spec.ts`.
4. `ThrottlerModule` + `APP_GUARD`; env keys; `@SkipThrottle` на ops.
5. **Verify:** `shared-contracts:build`, `api:test`, `api:test:e2e`, `api:lint`, `api:build`.

## Code Example

```typescript
// apps/api/src/config/configure-api-http-bootstrap.ts
export function configureApiHttpBootstrap(app: INestApplication): void {
  enableApiCors(app);
  configureApiHttp(app);
  configureApiSecurity(app);
  configureApiShutdown(app);
}
```

## Context

После **091** точечные лимиты закрывают reset/resend, но весь API всё ещё без общего «потолка» запросов и без базовых security headers. **092** — baseline до публичного CMS (**145** зависит от **092**) и prod hardening (**292–294**).

## Concept

| Слой                       | Ключ / механизм          | Что ограничивает      |
| -------------------------- | ------------------------ | --------------------- |
| Global throttler (**092**) | `GLOBAL_THROTTLE_*`, IP  | любой HTTP-маршрут    |
| Login lockout (**074**)    | `LOGIN_LOCKOUT_*`, email | неудачные `login`     |
| Auth-sensitive (**091**)   | `AUTH_SENSITIVE_RATE_*`  | reset / resend verify |

**Env global throttle:**

| Env                      | Default | Смысл                 |
| ------------------------ | ------- | --------------------- |
| `GLOBAL_THROTTLE_LIMIT`  | `100`   | запросов с IP за окно |
| `GLOBAL_THROTTLE_TTL_MS` | `60000` | длина окна (мс)       |

## Why This Matters

Один злоумышленник может исчерпать CPU на дешёвых маршрутах, даже не трогая login. Helmet даёт браузерам и прокси предсказуемые сигналы без копипаста заголовков в каждом контроллере.

## Architecture Notes

- **Helmet:** `contentSecurityPolicy: false`, `crossOriginEmbedderPolicy: false` — JSON API + CORS; ужесточение в **294**.
- **E2E throttle:** `.overrideProvider(getOptionsToken()).useValue([{ ttl, limit }])` — детерминированный лимит; prod читает env через `ConfigService`.
- **Ops:** `@SkipThrottle()` на health/metrics — probes не получают 429.
- **429:** `ThrottlerException` → существующий mapper → `TOO_MANY_REQUESTS`.

## Changed Files

| File                                                     | Action                                |
| -------------------------------------------------------- | ------------------------------------- |
| `apps/api/package.json`                                  | changed — helmet, @nestjs/throttler   |
| `apps/api/src/config/global-throttle.constants.ts`       | created                               |
| `apps/api/src/config/build-helmet-options.ts`            | created                               |
| `apps/api/src/config/build-helmet-options.spec.ts`       | created                               |
| `apps/api/src/config/configure-api-security.ts`          | created                               |
| `apps/api/src/config/configure-api-http-bootstrap.ts`    | created                               |
| `apps/api/src/main.ts`                                   | changed — shared bootstrap            |
| `apps/api/src/testing/create-api-test-app.ts`            | changed — shared bootstrap            |
| `apps/api/src/app.module.ts`                             | changed — ThrottlerModule + APP_GUARD |
| `apps/api/src/config/env.schema.ts`                      | changed — GLOBAL*THROTTLE*\*          |
| `apps/api/src/config/env.schema.spec.ts`                 | changed                               |
| `apps/api/src/health/health.controller.ts`               | changed — @SkipThrottle               |
| `apps/api/src/metrics/metrics.controller.ts`             | changed — @SkipThrottle               |
| `apps/api/src/errors/map-exception-to-api-error.spec.ts` | changed — ThrottlerException          |
| `apps/api/test/api-security-baseline.e2e-spec.ts`        | created                               |
| `apps/api/test/request-timeout.e2e-spec.ts`              | changed — shared bootstrap            |
| `.env.example`                                           | changed — GLOBAL*THROTTLE*\*          |
| `docs/lessons/lesson-092-api-security-baseline.md`       | created                               |
| `docs/development-roadmap.md`                            | changed                               |
| `docs/storytelling.md`                                   | changed                               |
| `docs/README.md`                                         | changed                               |
| `docs/learning-path.md`                                  | changed                               |
| `docs/LOCAL_SETUP.md`                                    | changed                               |
| `docs/security/threat-model-stub.md`                     | changed                               |
| `docs/lessons/lesson-091-auth-sensitive-rate-limits.md`  | changed — back-link                   |
| `docs/lessons/lesson-074-login-brute-force-lockout.md`   | changed — back-link                   |

## Verification

```bash
nx run shared-contracts:build
nx run api:test
nx run api:test:e2e
nx run api:lint
nx run api:build
```

- **E2E:** `test/api-security-baseline.e2e-spec.ts` — `x-content-type-options`, `x-frame-options`, 4-й `GET /api/v1` → 429 `TOO_MANY_REQUESTS`, `/health` и `/metrics` → 200 под жёстким лимитом.

## TDD Sequence

1. **Red:** helmet options spec, env spec, ThrottlerException mapper, e2e security baseline.
2. **Green:** packages, bootstrap, ThrottlerModule, SkipThrottle ops.
3. **Refactor:** единый `configureApiHttpBootstrap` вместо дублирования в `main` / e2e.

## Definition of Done

- [x] Helmet на всех ответах (API-friendly profile).
- [x] Global `@nestjs/throttler` с env `GLOBAL_THROTTLE_*`.
- [x] Ops routes skip throttle; 429 → problem+json `TOO_MANY_REQUESTS`.
- [x] Unit specs colocated; e2e header + throttle scan.
- [x] Docs sync: roadmap, storytelling, indexes, threat model.

## What To Remember

- Global throttle, login lockout и auth-sensitive limits — **три слоя**, не один сервис.
- Следующий шаг — **093** (`REQUIRE_EMAIL_VERIFIED`), не путать с **095** (session metadata).
