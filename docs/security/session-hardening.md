# Session security (step 030)

Admin sessions only at `/admin` (ADR-007). No public login routes.

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

| Path            | Behavior                                    |
| --------------- | ------------------------------------------- |
| `/admin` logout | Clears current session via Payload admin UI |

Historical `/logout` and “log out everywhere” on the public site were removed with reader auth (ADR-007).

## Rate limits / Turnstile

**Not product features** after author-only pivot (ADR-007). Historical step **074** / ADR-006 and step **075** Turnstile may still appear in old commits; do not treat Upstash/Turnstile env vars as go-live requirements.

## Auth smoke

Playwright e2e снят в **085**. Регрессия admin-сессии: ручной poke — `seed:admin` → `/admin` login → publish smoke → logout (LOCAL_SETUP §6).
