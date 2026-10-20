# Access control matrix

Canonical matrix for admin vs reader vs anonymous. Must match Payload collection `access` in code.

Roles: **admin** (CMS author), **reader** (site account), **anonymous** (no session).  
Verified: password users after email verify, or Google users with verified email. Admins count as verified for site actions.

| Collection / action                             | Anonymous | Reader (unverified) | Reader (verified) | Admin |
| ----------------------------------------------- | --------- | ------------------- | ----------------- | ----- |
| Users — create (self-register)                  | yes       | yes                 | yes               | yes   |
| Users — read/update/delete self                 | no        | self                | self              | all   |
| Users — set `role`                              | no        | no                  | no                | yes   |
| `/admin` panel                                  | no        | no                  | no                | yes   |
| Articles / Notes / Pages — read published       | yes       | yes                 | yes               | all   |
| Articles / Notes / Pages — create/update/delete | no        | no                  | no                | yes   |
| Categories / Tags — read                        | yes       | yes                 | yes               | yes   |
| Categories / Tags — write                       | no        | no                  | no                | yes   |
| Media — read                                    | yes       | yes                 | yes               | yes   |
| Media — create/update/delete                    | no\*      | yes\*               | yes\*             | yes   |
| Comments — read approved                        | yes       | yes                 | yes               | all   |
| Comments — create                               | no        | no                  | yes               | yes   |
| Comments — update/delete                        | no        | no                  | no                | yes   |
| Bookmarks — create                              | no        | no                  | yes               | yes   |
| Bookmarks — read/update/delete                  | no        | owner               | owner             | all   |

\*Media CUD defaults to authenticated until step **039** (admin-only upload). Tracked as known gap vs product DoD.

## Auth session notes

| Concern        | Policy                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| Cookie         | HttpOnly (Payload default), `SameSite=Lax`, `Secure` in production        |
| CSRF           | Payload CSRF allowlist = `NEXT_PUBLIC_SERVER_URL`                         |
| Logout         | `/logout` clears current session; “Log out everywhere” uses `allSessions` |
| Password reset | Token expiry 1h; `minRequestInterval` 15s; extra action rate limits       |
| Email          | Resend when `RESEND_API_KEY` set; else console adapter (local)            |

See also: [ADR-002](../adr/002-auth-verification-and-account-linking.md), [content-model.md](../content-model.md).

## Verify (automated)

- Unit: `tests/unit/access.test.ts` (`isVerified`, role helpers)
- Integration: `tests/int/auth.int.spec.ts` (anonymous/reader write boundaries, verify/reset)
- Integration: `tests/int/comments.int.spec.ts`, `tests/int/bookmarks.int.spec.ts` (verified reader create)
