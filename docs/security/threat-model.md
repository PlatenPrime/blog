# Threat model (step 077)

Stub for v1 of a personal blog: **one admin/author**, anonymous public readers, Next.js + Payload on Vercel, Neon PostgreSQL, Cloudflare R2. Product canon after pivot — [ADR-007](../adr/007-author-only-no-public-auth.md).

**In scope:** admin session abuse, stored XSS via Lexical content, R2/media misuse.

**Out of scope (v1):** reader accounts, public auth, comments, rate limits / Turnstile as product features (historical steps 074–075; ADR-006 superseded), MFA / WebAuthn, multi-tenant / multi-author CMS, product WAF, custom R2 CDN domain, paid content, full STRIDE worksheets. Pre-launch gate: [checklist.md](./checklist.md) (step **078**).

## Assets

| Asset                   | Why it matters                        |
| ----------------------- | ------------------------------------- |
| Admin session cookies   | Full CMS impersonation                |
| Admin credentials       | Account takeover, content defacement  |
| Neon data               | Content, admin users                  |
| R2 objects              | Published (and draft-era) media bytes |
| `/admin` + Payload REST | Full CMS write surface                |

## Auth (admin only)

| Threat                        | Impact                          | Mitigations                                                                                                                                     | Residual / deferred               |
| ----------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Brute force on `/admin` login | Lockout noise; takeover         | Payload `maxLoginAttempts` / lockout — [session-hardening.md](./session-hardening.md); strong password hygiene (ops)                            | No MFA (v1 out of scope)          |
| Session theft / CSRF          | Act as admin                    | HttpOnly + `SameSite=Lax` + `Secure` in prod; Payload `csrf`/`cors` = `NEXT_PUBLIC_SERVER_URL` — [session-hardening.md](./session-hardening.md) | XSS that steals cookies — see CSP |
| Stolen `PAYLOAD_SECRET`       | Forged sessions / crypto issues | Env-only secret; rotation procedure in ops                                                                                                      | —                                 |

Public site has **no** login surface; historical reader/OAuth/reset threats are out of product scope (ADR-007).

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
| Unauthorized upload            | Bucket filled / malware hosted        | Media create/update/delete admin-only — [access-matrix.md](./access-matrix.md)                               | Compromised admin credentials                |
| Oversized / wrong-type files   | Cost / XSS-ish payloads               | `mediaLimits` (5 MiB; image MIME only; WebP convert)                                                         | Video upload explicitly out of product scope |
| CORS / client-upload misconfig | Broken admin UX or overly open bucket | `@payloadcms/storage-s3` + [runbooks/r2-media.md](../runbooks/r2-media.md) (origin allowlist)                | Ops drift if bucket CORS widened manually    |
| Public URL of “private” object | Unexpected disclosure                 | Published media is **public-read by design**; draft content still uses same public object URLs once uploaded | Private/signed media — not v1                |
| CSP bypass via R2 origin       | Load unexpected scripts/images        | Step **073** allowlists `R2_PUBLIC_URL` origin in `img-src` / admin `connect-src`                            | Wrong env origin widens CSP                  |

## Adjacent: supply chain

Dependency CVEs and secrets in git are outside the app surfaces above but part of Track 8: step **076** + [supply-chain.md](./supply-chain.md) (Dependabot, secret scanning, push protection). Do not duplicate that policy here.

## Verify

- [x] Auth mitigations cite [session-hardening.md](./session-hardening.md) and admin-only scope (ADR-007).
- [x] Lexical XSS mitigations cite render path + YouTube allowlist + step **073** CSP (and media MIME).
- [x] R2 mitigations cite Media ACL, limits, R2 runbook, and step **073** CSP origins.
- [x] Gaps above are labeled residual/deferred (not silent).
- [x] Pre-launch checkbox list lives in [checklist.md](./checklist.md) (step **078**), not this stub.

## See also

- [access-matrix.md](./access-matrix.md)
- [session-hardening.md](./session-hardening.md)
- [supply-chain.md](./supply-chain.md)
- [ADR-007](../adr/007-author-only-no-public-auth.md)
- [checklist.md](./checklist.md) (pre-launch must / waivers)
- Track 8 in [development-roadmap.md](../development-roadmap.md) (steps 073–078)
