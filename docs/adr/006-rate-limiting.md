# ADR-006: Rate limiting (Upstash + dual layer)

> **SUPERSEDED (product scope).** Public auth, comments, and Upstash/Turnstile rate limits are **out of product scope** after the author-only pivot. Current canon: [ADR-007 — Author-only, no public auth](./007-author-only-no-public-auth.md). The body below documents what was built on step 074 before supersession.

- **Status:** accepted (historical; superseded by ADR-007 for product scope)
- **Date:** 2026-11-10
- **Step:** 074

## Context

Auth forms, password reset, and comments are public attack surfaces (credential stuffing, reset spam, comment flood). Step 027 left in-memory `takeRateLimit` hooks on register/login/forgot; those counters live in a process-local `Map` and do not share state across Vercel serverless isolates. Roadmap Verify for 074 requires exceeding a limit to yield **HTTP 429**. Server Actions normally return `{ ok: false }` over a 200 action POST, so identity limits alone cannot satisfy Verify without an HTTP gate.

Tech-stack still says Redis is not a general cache/session store for v1 (cold start / cost). Free Upstash Redis REST is acceptable **only** as a shared counter backend for abuse limits.

## Decision

1. **Store:** `@upstash/redis` + `@upstash/ratelimit` when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set. Otherwise **in-memory fixed window** (local/CI), with a one-time `console.warn` in production if env is missing. Do not fail boot.
2. **Dual layer** (same numeric policies where both apply):
   - **Proxy middleware** ([`src/proxy.ts`](../../src/proxy.ts)): IP limits on `POST` to `/{locale}/login|register|forgot-password|reset-password` → **429** + `Retry-After`. Article/note pages are **not** IP-gated in proxy: bookmarks and comments share `Next-Action` POSTs on the same path.
   - **Server Actions:** identity keys (email / userId / IP for reset) → UI `{ ok: false, error }` via i18n. Comments are limited here by `userId`.
3. **API surface:** shared `takeRateLimit` in [`src/security/rateLimit.ts`](../../src/security/rateLimit.ts); path classification in [`src/security/rateLimitMiddleware.ts`](../../src/security/rateLimitMiddleware.ts). Redis is **not** used for sessions, cache, or Payload KV.
4. **Out of scope for 074:** Turnstile (075), OAuth `/api/users/oauth/*` (matcher excludes `api`), Vercel/Cloudflare WAF product setup, e2e 429 in CI (086).

## Alternatives considered

| Approach                        | Why not for v1                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| Memory-only forever             | Broken under multi-instance serverless; docs already called this out.               |
| Middleware-only, no action keys | Shared NAT/IP would throttle honest users; email/userId limits still needed.        |
| Action-only “soft” errors       | Fails Verify (no 429); weaker for anonymous flood before the action runs.           |
| Neon table as counter store     | Extra DB load and migration surface for ephemeral counters.                         |
| General-purpose Redis cache     | Contradicts stack cost/cold-start stance; counters-only keeps the exception narrow. |

## Consequences

- Production should set Upstash REST env vars; without them limits still run but are per-isolate.
- Payload `forgotPassword.minRequestInterval` (15s) and login lockout remain; they complement, not replace, app limits.
- Turnstile (075) stacks on top of these limits; do not remove rate limits when bots are filtered.
