# ADR-003: Scheduled publish via query-time visibility

- **Status:** accepted
- **Date:** 2026-10-21
- **Step:** 036

## Context

Articles, Notes, and Pages have `_status` (draft / published) and `publishedAt`. Authors need to schedule a post for a future time so it stays hidden until then. Roadmap allowed either a cron/job that flips status or query-time visibility.

## Decision

**Query-time visibility** (no publish cron in v1):

1. Author **Publishes** (`_status: published`) and may set `publishedAt` to a future datetime.
2. Public `read` access (`publishedOrAdmin` → `publicContentWhere`) returns only documents where:
   - `_status = published`, and
   - `publishedAt` is missing/null **or** `publishedAt <= now`.
3. Admins (and draft Preview with admin session) still see all documents, including future-dated ones.
4. If Publish happens with empty `publishedAt`, hook `setPublishedAtOnPublish` stamps `now` so immediate publishes get a stable timestamp.

We deliberately **do not** run a Vercel cron (or similar) to change `_status` when the clock passes. Visibility is evaluated on every public query.

## Alternatives considered

| Approach                              | Why not for v1                                                 |
| ------------------------------------- | -------------------------------------------------------------- |
| Cron flips `_status` at `publishedAt` | Missed ticks, local/dev without cron, extra secret/job surface |
| Keep draft until cron publishes       | Same cron dependency; Preview already covers drafts            |

Cron may still be added later for **side effects** (ISR revalidate, notifications) — not as the source of truth for “is it public yet?”.

## Consequences

- Single source of truth: [`src/access/publicContentWhere.ts`](../../src/access/publicContentWhere.ts) + [`publishedOrAdmin`](../../src/access/publishedOrAdmin.ts).
- Frontend list/detail queries must use `overrideAccess: false` (or the same where) so schedule is enforced.
- A document can be `_status: published` but invisible to anonymous users until `publishedAt`.
- Clock skew is wall-clock of the server handling the request (acceptable for a personal blog).
