# ADR-002: Email verification policy & Google account linking

- **Status:** accepted
- **Date:** 2026-10-20
- **Steps:** 026, 029

## Context

Readers authenticate via Payload Users (email+password and optional Google OAuth). We need a clear rule for unverified mailboxes and how Google identities bind to existing accounts.

## Decision

### Email verification

1. `Users.auth.verify` is enabled. New password registrations receive a verification email and **cannot log in** until the token is consumed (`/uk/verify?token=…`, ADR-004).
2. **Sensitive site actions** (create comments, create bookmarks) additionally require `isAuthenticatedAndVerified` — admins are always treated as verified.
3. First-user bootstrap (`totalDocs === 0`) forces `role: admin`. Any user with `role: admin` is always `_verified: true` (hook) so `/admin` cannot enter a login↔panel loop when verify is enabled (JWT requires truthy `_verified`; login only rejects explicit `false`).
4. Google OAuth users are created/linked with `_verified: true` when Google reports a verified email (default).

Unverified UX: login error points to inbox; home shows “(email not verified)” if a session somehow lacks verification.

### Account linking (Google)

1. Plugin: `payload-oauth2` with `useEmailAsIdentity: true` and `onUserNotFoundBehavior: 'create'`.
2. If a user with the same email already exists (credentials or prior OAuth), Google login **links** to that user via email identity — no second account.
3. New Google-only users are created as `role: reader` with OAuth `sub` stored on the user document.
4. Linking does **not** escalate role; `role` remains admin-only for writes.

Out of scope v1: linking multiple distinct Google accounts to one user, GitHub/Apple, forced re-verify after email change.

## Consequences

- Local auth works with the console email adapter when `RESEND_API_KEY` is unset; production must use Resend (step 028).
- OAuth is inactive until `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are set; field `users.sub` remains in schema for when OAuth is enabled.
- Frontend auth paths live under `[locale]` after step **041** (e.g. `/uk/login`); see ADR-004. UI dictionaries — step **042**.
