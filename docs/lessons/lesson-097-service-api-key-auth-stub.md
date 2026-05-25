# Lesson 097: Service/API key auth stub

## Learning Goal

Заложить минимальный **machine-to-machine auth primitive**: `SERVICE_API_KEY` в validated env, reusable service + guard для будущих внутренних маршрутов и OpenAPI security scheme `ServiceApiKey`, не меняя поведение существующих JWT/RBAC routes.

## Implementation Scope

В скоупе:

- [`service-api-key.service.ts`](../../apps/api/src/auth/service-api-key.service.ts) + spec — optional env secret, constant-time hash comparison, neutral `401`.
- [`service-api-key.guard.ts`](../../apps/api/src/auth/service-api-key.guard.ts) + spec — header `x-service-api-key`.
- [`service-api-key-auth.decorator.ts`](../../apps/api/src/auth/service-api-key-auth.decorator.ts) — helper for future route handlers.
- `SERVICE_API_KEY` in [`env.schema.ts`](../../apps/api/src/config/env.schema.ts) and [`.env.example`](../../.env.example).
- OpenAPI apiKey scheme in [`build-openapi-document.ts`](../../apps/api/src/config/build-openapi-document.ts) and snapshot [`docs/openapi/api-v1.openapi.json`](../openapi/api-v1.openapi.json).

Намеренно **не** делаем:

- API key storage in Postgres, rotation UI, ownership, scopes or audit events.
- Protection for existing user-facing routes; JWT + RBAC stay unchanged.
- OAuth/OIDC/social login; that is deferred to step **098**.

## Dependencies

- [Шаг 067](./lesson-067-jwt-strategy-auth-guard.md) — auth guard pattern and neutral `401`.
- [Шаг 092](./lesson-092-api-security-baseline.md) — global HTTP perimeter.
- [Шаг 094](./lesson-094-openapi-swagger.md) — OpenAPI security schemes.
- [Шаг 096](./lesson-096-auth-error-envelope.md) — auth failures stay in the common Problem Details envelope.

## External operations (outside the repo)

В этом шаге достаточно monorepo + уже поднятого local compose; аккаунты Railway/Vercel/Supabase не нужны.

| Action | Where | Required this step? | Why                                                  |
| ------ | ----- | ------------------- | ---------------------------------------------------- |
| —      | —     | **Нет**             | Stub uses local env and unit tests; no new dashboard |

**Architecture sketch:** Browser users still authenticate with JWT and RBAC. Future internal callers can send `x-service-api-key` to routes that explicitly opt in with `ServiceApiKeyAuth()`. The key is a private environment secret, not a database row yet; empty env disables successful validation instead of creating a dev backdoor. OpenAPI documents the scheme now so future routes can reference a stable security name.

## Step-by-Step Changes

1. **Red:** service/guard specs, env schema spec, OpenAPI scheme spec.
2. **Green:** constants, service, guard, decorator, `AuthModule` providers/exports.
3. **Contract:** `SERVICE_API_KEY` in env docs and `ServiceApiKey` in OpenAPI.
4. **Docs sync:** lesson 097, roadmap, indexes, storytelling, threat model, previous lesson pointer.
5. **Verify:** focused specs, `api:test`, `api:lint`, `api:build`, OpenAPI export.

## Code Example

```typescript
@Get('internal/probe')
@ServiceApiKeyAuth()
probe(): { ok: true } {
  return { ok: true };
}
```

## Context

Track 2 already has human identity: users, JWT access, refresh rotation, email verification, RBAC, audit and error contracts. Step **097** adds the shape for a different actor: a service, job or future webhook adapter that should not pretend to be a user.

## Concept

| Credential          | Used by            | Current state               |
| ------------------- | ------------------ | --------------------------- |
| Bearer JWT          | Browser/user flows | Active on auth/CMS routes   |
| `x-service-api-key` | Internal callers   | Stub only; opt-in per route |

The API key is intentionally simple: one env secret, one header, one guard. That keeps the contract visible without committing to storage, scopes or rotation before there is a real caller.

## Why This Matters

Machine credentials often arrive late as a one-off exception. Adding the stub now makes the boundary explicit: service auth is separate from user auth, has its own header and OpenAPI scheme, and still uses the same error envelope.

## Architecture Notes

- Empty `SERVICE_API_KEY` means no key can authenticate; it is not a local bypass.
- Non-empty keys must be at least 32 characters and are trimmed by validated env.
- Incoming keys are compared by SHA-256 digest with `timingSafeEqual`, avoiding raw string comparison and Buffer length mismatch leaks.
- The decorator is reusable, but no existing route uses it yet.

## Changed Files

| File                                                                | Action                                     |
| ------------------------------------------------------------------- | ------------------------------------------ |
| `apps/api/src/auth/service-api-key.constants.ts`                    | created                                    |
| `apps/api/src/auth/service-api-key.service.ts`                      | created                                    |
| `apps/api/src/auth/service-api-key.service.spec.ts`                 | created                                    |
| `apps/api/src/auth/service-api-key.guard.ts`                        | created                                    |
| `apps/api/src/auth/service-api-key.guard.spec.ts`                   | created                                    |
| `apps/api/src/auth/service-api-key-auth.decorator.ts`               | created                                    |
| `apps/api/src/auth/auth.module.ts`                                  | changed — providers/exports                |
| `apps/api/src/config/env.schema.ts` / `env.schema.spec.ts`          | changed — `SERVICE_API_KEY`                |
| `apps/api/src/config/build-openapi-document.ts`                     | changed — apiKey scheme                    |
| `apps/api/src/config/configure-api-openapi.spec.ts`                 | changed                                    |
| `apps/api/src/openapi/openapi-constants.ts`                         | changed                                    |
| `.env.example`                                                      | changed — optional service key             |
| `docs/openapi/api-v1.openapi.json`                                  | changed — exported scheme                  |
| `docs/lessons/lesson-097-service-api-key-auth-stub.md`              | created                                    |
| `docs/development-roadmap.md`                                       | changed — 097 done                         |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` | changed — indexes and narrative checkpoint |
| `docs/LOCAL_SETUP.md` / `docs/security/threat-model-stub.md`        | changed — env/runbook and threat model     |
| `docs/lessons/lesson-096-auth-error-envelope.md`                    | changed — next-step pointer                |

## Verification

```bash
npx nx run api:test -- service-api-key
npx nx run api:test -- env.schema.spec.ts configure-api-openapi.spec.ts
npx nx run api:test
npx nx run api:lint
npx nx run api:build
npx nx run api:openapi:export
```

## TDD Sequence

1. **Red:** assert service key validation, guard header extraction, env constraints and OpenAPI scheme.
2. **Green:** implement the smallest reusable primitive.
3. **Refactor:** keep it opt-in and separate from JWT/RBAC flows.

## Definition of Done

- [x] `SERVICE_API_KEY` validated and documented with empty local default.
- [x] Service + guard covered by colocated unit specs.
- [x] OpenAPI exposes `ServiceApiKey` apiKey scheme.
- [x] Existing routes remain JWT/RBAC-only.
- [x] Docs sync completed.

## What To Remember

- Service keys are machine credentials, not user sessions.
- Empty env disables successful API-key auth; it does not open a backdoor.
- Следующий шаг Track 2 — **098**: OAuth/social login deferred ADR.
