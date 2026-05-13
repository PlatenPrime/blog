# Threat model (stub)

**Status:** stub — Track 0 placeholder. Detailed threat modeling (abuse cases, data-flow diagrams, control mapping) is scheduled with **Track 7: Reliability and Security** in [`development-roadmap.md`](../development-roadmap.md).

This document anchors **scope and vocabulary** so later lessons do not start from a blank page.

## System in scope (high level)

| Asset / surface        | Location / notes                                        |
| ---------------------- | ------------------------------------------------------- |
| Public HTTP API        | `apps/api` (NestJS), future auth/CMS/moderation         |
| Public SSR site        | `apps/web` (TanStack Start), SEO and user-facing pages  |
| Admin / editor UI      | Same `apps/web` app, privileged routes (future)         |
| PostgreSQL             | Local compose; future production DB                     |
| Secrets / env          | `.env` (gitignored), `VITE_PUBLIC_*` vs server-only web |
| CI / repository        | GitHub Actions, cache keys, `GITHUB_TOKEN` permissions  |
| Developer workstations | Node, Docker, editor configs                            |

## Trust boundaries (initial)

```text
Browser (untrusted)
    --> HTTPS --> CDN / edge (future, not implemented)
    --> apps/web (SSR + client)
    --> HTTP --> apps/api
    --> TCP --> PostgreSQL
```

## Adversaries (stub list)

- Anonymous Internet client (scraping, injection, abuse of public endpoints).
- Authenticated user with least privilege (horizontal/vertical privilege escalation — future once auth exists).
- Insider / compromised developer credential (supply chain, secret leakage).
- Third-party dependency compromise (npm supply chain).

## STRIDE-oriented prompts (fill in later)

Use these as section headers when the model is expanded; keep one-line notes for now.

| Category               | Question we will answer in Track 7                         | Stub note |
| ---------------------- | ---------------------------------------------------------- | --------- |
| Spoofing               | Who can impersonate whom (sessions, API keys, web origin)? | TBD       |
| Tampering              | What can be altered in transit or at rest?                 | TBD       |
| Repudiation            | What must be logged for moderation and audits?             | TBD       |
| Information disclosure | What data leaves each trust zone?                          | TBD       |
| DoS                    | What endpoints are amplification or expensive-query risks? | TBD       |
| Elevation              | How are roles enforced across API and web?                 | TBD       |

## Out of scope for this stub

- Numeric risk scores, formal DREAD tables, penetration-test findings.
- Production network topology and cloud IAM — not selected yet.

## References

- [`docs/adr/000-nx-and-tanstack-start.md`](../adr/000-nx-and-tanstack-start.md) — baseline stack decision.
- [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md) — local ports and env contracts.
