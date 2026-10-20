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

Server actions apply in-memory limits (register / login / forgot). Payload `forgotPassword.minRequestInterval` is 15s. Production should add edge/WAF limits (future ops track).

## Playwright smoke

`tests/e2e/auth.e2e.spec.ts`: login → session visible → logout.
