# ADR-004: Frontend locale routing (uk / ru / en)

- **Status:** accepted
- **Date:** 2026-10-22
- **Steps:** 041

## Context

Payload content localization already uses `uk` / `ru` / `en` with `defaultLocale: 'uk'`. Public Next.js routes were unprefixed (`/login`, `/`). Track 4 needs a stable URL locale before UI dictionaries (042), language switcher (044), and locale-aware SEO/RSS.

## Decision

1. **Library:** `next-intl` (tech-stack).
2. **Locales:** `uk`, `ru`, `en` — same codes as Payload.
3. **Default locale:** `uk`.
4. **Prefix policy:** `localePrefix: 'always'`. Every public page URL starts with `/{locale}` (e.g. `/uk/login`, `/en`). Bare `/` is negotiated by the proxy (Accept-Language + cookie) and redirected to a prefixed locale; fallback is `/uk`.
5. **Entry point:** Next.js 16 `src/proxy.ts` (formerly middleware) via `next-intl` `createMiddleware`.
6. **Out of locale routing:** `/admin`, `/api/*`, and draft-mode entrypoints `/next/preview`, `/next/exit-preview` stay unprefixed. Preview _content_ paths use `/{locale}/dev/rich-text/...` (default locale when generated from admin).
7. **Links without a request locale** (email verify/reset, OAuth success/failure): use default locale prefix (`/uk/...`) via `withDefaultLocale`.

## Consequences

- Auth and home URLs change from `/login` → `/uk/login` (etc.). Clients and e2e must use prefixed paths.
- UI chrome strings remain English/hardcoded until step **042** (dictionaries). Language switcher is **044**. Missing-translation / content fallback policy & tests are **045**.
- `/admin` is not under `[locale]`; Payload admin has its own locale switcher for CMS fields.

## Alternatives considered

- **`localePrefix: 'as-needed'`** (default without prefix): rejected for v1 — DoD requires a stable visible locale in the URL; Verify explicitly checks `/uk`, `/ru`, `/en`.
- **Domain-based locales:** out of scope for personal blog v1.
