# ADR-004: Public locale prefix

- **Status:** accepted
- **Date:** 2026-10-25
- **Step:** 041

## Context

The public site and Payload content share three locales: `uk`, `ru`, `en`. Payload already defaults to `uk`. Public routes (`/`, `/login`, `/dev/rich-text/...`) had no locale in the URL (ADR-002 deferred that to step 041). Later steps need one stable rule before UI dictionaries (042), localized fields on the public site (043), and a language switcher (044).

## Decision

Public pages live under `app/(frontend)/[locale]` and use **next-intl** (`src/proxy.ts` on Next.js 16):

1. Locales are `uk`, `ru`, `en`. **Default locale is `uk`**, the same as Payload `localization.defaultLocale`.
2. **`localePrefix: 'always'`.** `/uk`, `/ru`, and `/en` are all real URLs. The default locale is not rewritten to `/`.
3. **`localeDetection: false`.** An unprefixed path does not consult `Accept-Language` or a locale cookie. `/` and `/login` redirect to `/uk` and `/uk/login`. `ru` and `en` appear only when the prefix is already in the URL. Internal links use `@/i18n/navigation` so a visit that started at `/ru/...` stays on `ru`.
4. These paths stay **outside** the proxy matcher: `/api` (including Google OAuth), `/admin`, `/next/preview`, `/next/exit-preview`, Next internals, and files with a dot. Draft preview still redirects to an unprefixed `/dev/rich-text/...`; the proxy adds `/uk` on the next request.
5. Verification and reset emails, and OAuth success/failure, are built with `prefixPublicPath` and the default locale (`/uk/verify`, `/uk/login`). OAuth does not carry the locale the user had before leaving for Google; that return stays on `uk`. The public language switcher (044) lets the reader change locale afterward without detection cookies.

Public chrome catalogs (`nav`, `auth`, `errors`, `cookies`) ship in step 042, one JSON file per locale. The cookie banner that reads `cookies` is step 081. Missing-translation behavior is step 045, not this decision. The language switcher (044) lives in the site header: it swaps the locale prefix and keeps the rest of the pathname and query (no per-locale slug remapping yet).

## Alternatives considered

| Approach                       | Why not for v1                                                                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `localePrefix: 'as-needed'`    | `/uk` would redirect to `/`, so the default locale disappears from the URL. Verify for this step requires `/uk`, `/ru`, and `/en`. |
| `localeDetection: true`        | `/` would follow the browser or a cookie and could leave `uk` without an explicit choice. There is no switcher yet.                |
| Payload admin under `[locale]` | Admin already has its own locale control. Prefixing `/admin` would fight the CMS.                                                  |

## Consequences

- Stable public URLs are `/${locale}/...`. Unprefixed public URLs are redirects to the default locale, not a second copy of the page.
- `/admin` and `/api` are unchanged.
- Public chrome strings come from the catalog for the URL locale (042). `html lang` follows the URL locale. Cookie copy is in the catalog; the banner is step 081. Dev-preview chrome and auth emails stay English.
- A reader on `/ru/login` who finishes Google OAuth lands on `/uk` (known limit); they can switch back via the header switcher.
- Switching locale keeps the logical path (`/ru/login?x=1` → `/en/login?x=1`). Remapping content URLs when slugs differ per locale is deferred to Track 5 product routes.
