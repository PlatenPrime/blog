# Access control matrix

Canonical matrix for **admin vs anonymous guest**. Must match Payload collection `access` in code.

Roles: **admin** (CMS author, session on `/admin`), **anonymous** (no session on public site). There are no reader accounts (ADR-007).

| Collection / action                             | Anonymous (guest) | Admin              |
| ----------------------------------------------- | ----------------- | ------------------ |
| `/admin` panel                                  | no                | yes                |
| Users — create/read/update/delete               | no                | admin              |
| Users — set `role`                              | no                | yes (`admin` only) |
| Articles / Notes / Pages — read published       | yes               | all                |
| Articles / Notes / Pages — create/update/delete | no                | yes                |
| Categories / Tags — read                        | yes               | yes                |
| Categories / Tags — write                       | no                | yes                |
| Media — read                                    | yes               | yes                |
| Media — create/update/delete                    | no                | yes                |

Public site actions (share / copy link on article/note detail) do not use Payload write access — they are client UI only.

## Auth session notes

| Concern       | Policy                                                             |
| ------------- | ------------------------------------------------------------------ |
| Cookie        | HttpOnly (Payload default), `SameSite=Lax`, `Secure` in production |
| CSRF          | Payload CSRF allowlist = `NEXT_PUBLIC_SERVER_URL`                  |
| Session scope | Admin login only at `/admin`; no public auth routes                |
| Password      | Change in `/admin` or DB; no email reset (ADR-007)                 |
| Lockout       | Payload `maxLoginAttempts` / lockout on admin login                |

See also: [ADR-007](../adr/007-author-only-no-public-auth.md), [content-model.md](../content-model.md).

## Verify (automated)

- Unit: `tests/unit/access.test.ts` (`isAdmin`, `publishedOrAdmin`, `publicContentWhere`)
- Unit: `tests/unit/contentAccess.test.ts` (Articles/Notes/Pages/Categories/Tags/Users wiring)
- Unit: `tests/unit/mediaAccess.test.ts` (Media CUD admin-only)
- Integration: `tests/int/media.int.spec.ts` (anonymous upload denied; admin WebP ok; needs Postgres)

Legacy tests that mention readers/comments/bookmarks may remain until cleaned up; **this matrix** is the product canon after the author-only pivot.
