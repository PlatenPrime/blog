# ADR-007: Author-only product model (no public auth / reader layer)

- **Status:** accepted
- **Date:** 2026-11-12
- **Supersedes (product scope):** [ADR-002](./002-auth-verification-and-account-linking.md), [ADR-006](./006-rate-limiting.md)
- **Migration:** [`src/migrations/20261112_130000_drop_reader_social.ts`](../../src/migrations/20261112_130000_drop_reader_social.ts)

## Context

The blog started as a personal site with **one author** plus **reader accounts** (register/login, email verify, Google OAuth, comments, bookmarks, Resend mail, Upstash rate limits, Turnstile on auth forms). That matched an early product sketch and roadmap steps 021–032, 057–061, 028–029, 074–075, 082.

In practice the product goal is simpler: **one admin publishes; everyone else reads anonymously**. Reader UX added ops surface (email deliverability, bots, moderation, dual auth paths) without matching how the site is operated.

Historical roadmap steps remain **done as history**; **current product canon** is defined here and in [`tech-stack.md`](../tech-stack.md) / [`content-model.md`](../content-model.md).

## Decision

### Product model (v1)

1. **One admin author.** Users collection holds admin accounts only (`role: admin`). Bootstrap via `npm run seed:admin` or Payload create-first-user on empty DB.
2. **No public authentication.** No `/login`, `/register`, verify, forgot/reset on the public site. `/admin` is the only login surface (Payload Users auth).
3. **Guests read published content** (Articles, Notes, Pages, taxonomy, Media metadata/URLs). On article/note detail they may **Share / Copy link** (native share + social links); no accounts required.
4. **Collections (CMS):** Articles, Notes, Pages, Media, Categories, Tags, Users — **no** Comments, **no** Bookmarks.
5. **Removed integrations (product):** Resend (transactional email), Google OAuth, Cloudflare Turnstile, Upstash rate limiting as **required** product features. Password change only in `/admin` or direct DB update — **no** email reset flow.

### Schema / data

Append-only migration `20261112_130000_drop_reader_social` drops `comments` / `bookmarks` tables and reader/OAuth/verify columns; deletes `users` with `role = reader`; narrows `enum_users_role` to `admin` only.

### Access helpers (canon)

Public read uses `publishedOrAdmin` → `publicContentWhere` (ADR-003). Admin writes use `isAdmin`. Legacy reader helpers may remain in repo history/tests until cleaned up; **documentation** reflects only `isAdmin`, `publishedOrAdmin`, `publicContentWhere`.

## Alternatives considered

| Approach                  | Why not                                                       |
| ------------------------- | ------------------------------------------------------------- |
| Keep readers, hide UI     | Dead schema, misleading docs, ongoing security/test burden    |
| Separate “lite” deploy    | Two products; contradicts single-repo personal blog           |
| Comments without accounts | Spam/moderation without clear owner; out of author-only scope |

## Consequences

- **ADR-002** and **ADR-006** remain in `docs/adr/` for historical context but are **superseded for product scope** — see banners on those files.
- Roadmap Product DoD and security docs no longer list reader/auth/comment/rate-limit **product** requirements; Track 8 steps 074–075 stay historically done but waives are noted in security checklist where code was removed.
- Privacy/Terms page copy in CMS may still mention old auth until content edit — legal pages are author-owned content, not stack canon.
- Tests that referenced comments/bookmarks/reader flows should be removed or narrowed in follow-up code work; **087** factories target `user` / `article` / `note` only.

## See also

- [`docs/tech-stack.md`](../tech-stack.md) §1, §6–§10, §14
- [`docs/content-model.md`](../content-model.md)
- [`docs/security/access-matrix.md`](../security/access-matrix.md)
- [`docs/development-roadmap.md`](../development-roadmap.md) (Pivot note + Product DoD)
