# ADR-004: OAuth/social login deferred

## Status

Accepted (2026-05)

## Context

Track 2 already has a working first-party identity perimeter: email/password registration and login, refresh token rotation, email verification, password reset, RBAC, security audit events, API error envelope coverage, OpenAPI review points, and a separate service-key stub for future machine callers.

OAuth, OIDC, and social login would add a different integration surface before the product has public posts, an admin studio, or a real account-linking UX. Doing it now would require provider accounts, redirect URI ownership, callback endpoints, provider claim mapping, linked identities, secret handling, and additional threat-model work before there is a user-facing need to validate those choices.

## Decision

Defer OAuth/social login from the current Track 2 implementation. Keep first-party email/password auth as the only human sign-in method until a later product step explicitly introduces social identity.

For now, do not add:

1. OAuth/OIDC provider dependencies.
2. Social login routes or callback handlers.
3. Provider account tables or account-linking logic.
4. OAuth client secrets, redirect URL env vars, or dashboard setup.
5. OpenAPI OAuth security schemes.

Return to this decision when the product has enough surface to answer the missing questions:

1. Which provider(s) serve the actual audience: GitHub, Google, enterprise OIDC, or another identity provider?
2. How should account linking work when a social email matches an existing password account?
3. Which redirect origins are trusted in local, staging, and production?
4. What claims are required for authorization, and which claims are advisory only?
5. How should failed provider callbacks, revoked grants, and provider outages appear in the API error envelope and audit log?

## Consequences

- Track 2 stays focused on the identity primitives already needed by the CMS: local accounts, verified email, sessions, permissions, audit, and machine auth boundaries.
- No learner has to create Google/GitHub/Auth0/Clerk apps during step 098.
- Future OAuth work must arrive as a separate roadmap step or ADR-backed change with provider setup, redirect policy, account-linking rules, tests, threat-model updates, and OpenAPI documentation.
- Lessons and storytelling should describe OAuth as intentionally deferred, not forgotten.

## References

- [`docs/development-roadmap.md`](../development-roadmap.md) — step 098
- [`docs/lessons/lesson-098-oauth-social-login-deferred-adr.md`](../lessons/lesson-098-oauth-social-login-deferred-adr.md)
- [`docs/storytelling.md`](../storytelling.md) — chapter XVI
