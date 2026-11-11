# Threat model (step 077)

Stub for v1 of a personal blog: one admin/author, public reader registration, Next.js + Payload on Vercel, Neon PostgreSQL, Cloudflare R2.

**In scope:** auth abuse, stored XSS via Lexical content, R2/media misuse, comment spam.

**Out of scope (v1):** MFA / WebAuthn, multi-tenant / multi-author CMS, product WAF, custom R2 CDN domain, paid content, full STRIDE worksheets. Pre-launch gate: [checklist.md](./checklist.md) (step **078**).

## Assets

| Asset                      | Why it matters                        |
| -------------------------- | ------------------------------------- |
| Session cookies            | Impersonation of reader or admin      |
| Credentials / reset tokens | Account takeover                      |
| Neon data                  | Content, users, comments, bookmarks   |
| R2 objects                 | Published (and draft-era) media bytes |
| `/admin` + Payload REST    | Full CMS write surface                |
| Reader email (PII)         | Registration, verify, reset           |

## Auth

| Threat                            | Impact                                           | Mitigations                                                                                                                                                            | Residual / deferred                                  |
| --------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Brute force / credential stuffing | Account lockout noise; takeover if weak password | Step **074** + [ADR-006](../adr/006-rate-limiting.md) (proxy 429 + action keys); Payload `maxLoginAttempts` / lockout — [session-hardening.md](./session-hardening.md) | No MFA (v1 out of scope)                             |
| Bot-driven register/login         | Fake accounts; burned rate-limit budget          | Step **075** Turnstile on login/register (`src/security/turnstile.ts`); empty keys = bypass (local/CI)                                                                 | WAF — later; live-widget e2e waived (**085**)        |
| Session theft / CSRF              | Act as victim                                    | HttpOnly + `SameSite=Lax` + `Secure` in prod; Payload `csrf`/`cors` = `NEXT_PUBLIC_SERVER_URL` — [session-hardening.md](./session-hardening.md)                        | XSS that steals cookies is layered under Lexical/CSP |
| Unverified reader abuse           | Comments/bookmarks without mailbox proof         | [ADR-002](../adr/002-auth-verification-and-account-linking.md); `isVerified` for sensitive site actions                                                                | —                                                    |
| OAuth link mistakes               | Wrong account merge / role escalation            | ADR-002 link-by-email; role changes admin-only — [access-matrix.md](./access-matrix.md)                                                                                | Google OAuth misconfig is ops, not app code          |
| Password reset flooding           | Email spam / token spray                         | Payload `forgotPassword.minRequestInterval`; step **074** limits on forgot/reset                                                                                       | Turnstile not on forgot/reset (075 deliverables)     |

## XSS via Lexical

| Threat                          | Impact                             | Mitigations                                                                                                                              | Residual / deferred                                      |
| ------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Stored XSS in article/note body | Script on public pages             | Body stored as Lexical JSON; render via JSX converters (`PayloadRichText`) — not raw HTML dump                                           | Author is trusted admin; compromise of admin = game over |
| Malicious embeds                | Phishing / drive-by via iframe     | YouTube block allowlists host; embed only `youtube-nocookie` (`src/lib/youtube.ts`)                                                      | No arbitrary iframe/HTML blocks in editor                |
| Scriptable media (SVG, etc.)    | XSS via image URL / MIME confusion | Media CUD admin-only; MIME allowlist jpeg/png/webp/gif **no SVG** (`mediaLimits`); step **073** CSP (`img-src`, no public `unsafe-eval`) | CSP still allows `'unsafe-inline'` on public (phase 1)   |
| Admin XSS / CSP bypass          | Steal admin session                | Softer CSP on `/admin` (eval + R2 `connect-src` for client uploads) — step **073**                                                       | Nonce/hash CSP — later                                   |

## R2 / media

| Threat                         | Impact                                | Mitigations                                                                                                  | Residual / deferred                          |
| ------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| Unauthorized upload            | Bucket filled / malware hosted        | Media create/update/delete admin-only — [access-matrix.md](./access-matrix.md); readers cannot upload        | Compromised admin credentials                |
| Oversized / wrong-type files   | Cost / XSS-ish payloads               | `mediaLimits` (5 MiB; image MIME only; WebP convert)                                                         | Video upload explicitly out of product scope |
| CORS / client-upload misconfig | Broken admin UX or overly open bucket | `@payloadcms/storage-s3` + [runbooks/r2-media.md](../runbooks/r2-media.md) (origin allowlist)                | Ops drift if bucket CORS widened manually    |
| Public URL of “private” object | Unexpected disclosure                 | Published media is **public-read by design**; draft content still uses same public object URLs once uploaded | Private/signed media — not v1                |
| CSP bypass via R2 origin       | Load unexpected scripts/images        | Step **073** allowlists `R2_PUBLIC_URL` origin in `img-src` / admin `connect-src`                            | Wrong env origin widens CSP                  |

## Comments spam

| Threat                 | Impact                          | Mitigations                                                                                                         | Residual / deferred                                       |
| ---------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Bot / scripted spam    | Noise on public posts           | Create = authenticated + verified; step **075** Turnstile before rate limit; step **074** comment limit by `userId` | Empty Turnstile keys bypass in prod if misconfigured      |
| Abuse of create volume | Flood approved thread           | Rate limit **074**; body max (`COMMENT_BODY_MAX`); author forced from session                                       | No captcha on every subsequent edit (readers cannot edit) |
| XSS in comment body    | Script on article page          | Plain textarea; UI renders as React text (`whitespace-pre-wrap`), not `dangerouslySetInnerHTML`                     | —                                                         |
| Unmoderated abuse      | Offensive content stays visible | `moderationStatus` admin-only; public read = `approvedOrAdmin`                                                      | No AI/auto-moderation; manual hide only                   |

## Adjacent: supply chain

Dependency CVEs and secrets in git are outside the four app surfaces above but part of Track 8: step **076** + [supply-chain.md](./supply-chain.md) (Dependabot, secret scanning, push protection). Do not duplicate that policy here.

## Verify

- [ ] Auth mitigations cite **074**, **075**, and/or [session-hardening.md](./session-hardening.md) / [ADR-006](../adr/006-rate-limiting.md) / [ADR-002](../adr/002-auth-verification-and-account-linking.md).
- [ ] Lexical XSS mitigations cite render path + YouTube allowlist + step **073** CSP (and media MIME).
- [ ] R2 mitigations cite Media ACL, limits, R2 runbook, and step **073** CSP origins.
- [ ] Comments spam mitigations cite **074**, **075**, verified create, and text-safe render.
- [ ] Gaps above are labeled residual/deferred (not silent).
- [x] Pre-launch checkbox list lives in [checklist.md](./checklist.md) (step **078**), not this stub.

## See also

- [access-matrix.md](./access-matrix.md)
- [session-hardening.md](./session-hardening.md)
- [supply-chain.md](./supply-chain.md)
- [ADR-002](../adr/002-auth-verification-and-account-linking.md)
- [ADR-006](../adr/006-rate-limiting.md)
- [checklist.md](./checklist.md) (pre-launch must / waivers)
- Track 8 in [development-roadmap.md](../development-roadmap.md) (steps 073–078)
