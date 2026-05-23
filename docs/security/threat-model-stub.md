# Threat model (stub)

**Status:** living stub — auth controls mapped after step **089**; full expansion in Track 7 step **305** and capstone **328**.

This document anchors **scope and vocabulary**. Step numbers refer to the **2026-05 roadmap renumber** ([ADR-003](../adr/003-roadmap-renumber-090-plus.md)).

## System in scope (high level)

| Asset / surface        | Location / notes                                               |
| ---------------------- | -------------------------------------------------------------- |
| Public HTTP API        | `apps/api` — auth, RBAC probe CMS, health/metrics              |
| Public SSR site        | `apps/web` (TanStack Start) — scaffold; product routes planned |
| Admin / editor UI      | Same `apps/web` app, privileged routes (Track 5)               |
| PostgreSQL             | Local compose; users, roles, refresh tokens, audit log         |
| Email (dev)            | MailDev in compose + `EmailService` (step **090**)             |
| Secrets / env          | `.env` (gitignored), validated Zod schema in API               |
| CI / repository        | GitHub Actions, Nx affected, tests-first gate                  |
| Developer workstations | Node, Docker, editor configs                                   |

## Trust boundaries (initial)

```text
Browser (untrusted)
    --> HTTPS --> CDN / edge (future, not implemented)
    --> apps/web (SSR + client)
    --> HTTP --> apps/api
    --> TCP --> PostgreSQL
    --> SMTP --> MailDev (local) / provider (production, future)
```

## Adversaries (stub list)

- Anonymous Internet client (scraping, injection, brute-force, comment spam — CMS later).
- Authenticated user with least privilege (horizontal/vertical privilege escalation).
- Session thief with stolen refresh token (mitigated by rotation + reuse detection).
- Insider / compromised developer credential (supply chain, secret leakage).
- Third-party dependency compromise (npm supply chain).

## STRIDE (auth + platform baseline)

| Category               | Risk (blog/CMS)                              | Current / planned controls                                                                                                                                                                                                                                    |
| ---------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spoofing               | Stolen refresh, forged JWT, session fixation | Short-lived access JWT; opaque refresh hashed at rest; rotation + reuse revokes family (**070–072**); `@CurrentUser()` from verified JWT (**067–068**); email verify flow (**075–076**); verify/reset tokens via SMTP/MailDev (**090**); production ESP later |
| Tampering              | MITM on API, mass assignment on DTOs         | HTTPS assumed in prod; global `ValidationPipe` whitelist (**039**); Problem Details without stack leak (**042**)                                                                                                                                              |
| Repudiation            | “Who published / logged in?”                 | Structured logs + request/correlation IDs (**043–046**); `security_audit_events` for auth mutations (**088–089**); IP/UA in audit (**095** planned)                                                                                                           |
| Information disclosure | Account enumeration, JWT PII, error oracle   | Login/reset neutral messages (**065**, **077**); no email in access JWT (**066**, **084**); log redaction (**047**); friendly 409 on duplicate email (**064**)                                                                                                |
| DoS                    | Login/reset spam, expensive queries          | Per-email login lockout (**074**); global throttler baseline (**092** planned); prod tuning (**292–293**); request timeout (**053**)                                                                                                                          |
| Elevation              | Viewer → editor, cross-user data             | RBAC schema + seeds (**079–080**); `RolesGuard` / `PermissionsGuard` (**081–082**); CMS route requires `posts:read` (**083**); e2e forbidden cases (**087**)                                                                                                  |

## Out of scope for this stub

- Numeric risk scores, formal DREAD tables, penetration-test findings.
- Production network topology and cloud IAM — not selected yet.
- CMS XSS, SSRF on media URLs, CSP for `web` — Track 3 (**146**, **159**) and Track 7 (**296**, **298**).

## References

- [`docs/adr/000-nx-and-tanstack-start.md`](../adr/000-nx-and-tanstack-start.md)
- [`docs/adr/003-roadmap-renumber-090-plus.md`](../adr/003-roadmap-renumber-090-plus.md)
- [`docs/development-roadmap.md`](../development-roadmap.md)
- [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)
