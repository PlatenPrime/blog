# ADR-008: Sentry waived until needed

- **Status:** accepted
- **Date:** 2026-11-16
- **Step:** 099

## Context

[`tech-stack.md`](../tech-stack.md) listed **optional** Sentry (free tier) for error tracking if connecting is simple. Step **098** already shipped a usable baseline: structured [`src/lib/logger.ts`](../../src/lib/logger.ts) (JSON via `console.*`) and [runbooks/vercel-logs.md](../runbooks/vercel-logs.md) for Production/Preview runtime logs.

The product is a personal **author-only** blog ([ADR-007](./007-author-only-no-public-auth.md)): one admin, anonymous readers, low traffic. Connecting `@sentry/nextjs` now means a new dependency, DSN secrets, CSP origins, source-map upload, and another SaaS surface — without a demonstrated gap that Vercel Logs cannot cover for server errors.

Client `error.tsx` / `global-error.tsx` already write to the **browser** console and do not appear in Vercel Logs (noted in step 098). That gap is real but not yet painful enough to justify the SDK for v1.

## Decision

1. **Do not** add Sentry (or any third-party error SDK) in v1.
2. **Canon for errors:** Vercel Logs + structured `logger` from step 098.
3. **Revisit** only when at least one inclusion criterion below is met; then open a **new numbered roadmap step** (do not quietly add the SDK).

### Inclusion criteria (when to add Sentry)

Any one is enough to schedule a follow-up step:

| Criterion                  | Signal                                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| Untriageable server errors | Recurring Production failures whose stack / `requestId` in Vercel Logs is insufficient to diagnose |
| Client crash grouping      | Need grouped browser uncaught errors / source maps (browser console alone is not enough)           |
| Alerting                   | Need email/Slack (or equivalent) on uncaught errors without manual log grep                        |
| Scale of triage            | Traffic or incident volume makes log-only triage clearly more expensive than free-tier Sentry ops  |

## Alternatives considered

| Approach                              | Why not for v1 now                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| Wire `@sentry/nextjs` immediately     | Extra deps, DSN, CSP, source maps, and ops for a gap not yet blocking diagnosis |
| Stub SDK / "DSN optional" scaffolding | Dead code and false sense of coverage; waive stays honest until criteria fire   |
| OpenTelemetry full stack              | Already out of v1 scope in tech-stack; heavier than Sentry for this need        |

## Consequences

- tech-stack marks Sentry as **waived (this ADR)** until criteria apply — not an open "optional" grey area.
- No `SENTRY_*` env vars, no instrumentation files, no CSP allowances for Sentry ingest in v1.
- When criteria fire: new roadmap step owns SDK + env + CSP + runbook + Verify (test event in Sentry).

## See also

- [`docs/runbooks/vercel-logs.md`](../runbooks/vercel-logs.md)
- [`docs/tech-stack.md`](../tech-stack.md) §11, §14
- [`docs/development-roadmap.md`](../development-roadmap.md) step **099**
