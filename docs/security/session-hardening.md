# Session security (step 030)

## Cookies

Configured on `Users.auth.cookies`:

| Flag     | Value                                   |
| -------- | --------------------------------------- |
| HttpOnly | Payload default (yes)                   |
| SameSite | `Lax` (same-site Next + Payload app)    |
| Secure   | `true` when `NODE_ENV === 'production'` |

Token expiration: 7 days (`tokenExpiration`). Max login attempts: 8 with lockout.

## CSRF

`payload.config` sets `csrf` and `cors` to `NEXT_PUBLIC_SERVER_URL`. Browser cookie auth for REST from the same origin includes credentials; cross-origin admin/API clients must be allowlisted deliberately.

## Logout

| Path                        | Behavior                                    |
| --------------------------- | ------------------------------------------- |
| `GET/POST /logout`          | Clears current session cookie               |
| Home → “Log out everywhere” | `logout({ allSessions: true })` via Payload |

## Rate limits

Step **074** / [ADR-006](../adr/006-rate-limiting.md):

- **Store:** Upstash Redis REST when `UPSTASH_REDIS_REST_*` is set; otherwise in-memory (local/CI; per-isolate on serverless).
- **Proxy:** IP limits on `POST` to login/register/forgot/reset → **HTTP 429** + `Retry-After` (not on article/note pages: bookmarks share Next-Action).
- **Actions:** identity keys (email / userId / IP for reset) → i18n `{ ok: false }` (`src/security/rateLimit.ts`); comments by `userId`.
- Payload `forgotPassword.minRequestInterval` remains 15s. Turnstile (075) and product WAF are separate.

## Playwright smoke

`tests/e2e/auth.e2e.spec.ts`: login → session visible → logout.
