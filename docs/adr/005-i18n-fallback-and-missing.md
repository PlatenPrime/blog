# ADR-005: i18n fallback and missing translations

- **Status:** accepted
- **Date:** 2026-10-25
- **Step:** 045

## Context

Public URLs, chrome catalogs, and Payload content all use `uk` / `ru` / `en` (ADR-004, steps 041–044). Three different “holes” can look like the same product bug (“missing locale / translation”) but need different rules:

1. An unknown **URL** locale segment (`/fr/...`).
2. A missing **chrome** dictionary key at runtime.
3. An empty **Payload** localized field for the requested locale.

Without an explicit policy, Track 5 pages could silently serve `uk` under a foreign prefix, merge chrome catalogs at runtime, or throw and return 500 when a key is absent. Steps 042–043 already chose compile-time key parity and Payload `fallback: true`; this ADR records those choices and the URL vs request-locale split.

## Decision

1. **Unknown URL locale prefix** (`/fr/...`): `[locale]/layout` calls `notFound()` → **404**. Do not rewrite the same path as `uk`. Middleware still redirects unprefixed public paths to the default prefix (ADR-004); that is not the same as accepting an unknown prefix.
2. **Unknown path under a valid locale** (`/uk/no-such-page`): catch-all `[...rest]` → localized `not-found` → **404**, not 500.
3. **Locale code for request config and Payload queries**: `resolveAppLocale` ([`src/i18n/resolveAppLocale.ts`](../../src/i18n/resolveAppLocale.ts)) maps unknown / empty values to **`uk`**. `getRequestConfig` and `resolveContentLocale` share this helper so catalogs and content queries never throw on a bad locale string.
4. **Chrome UI catalogs** (`nav`, `auth`, `errors`, `cookies`): one full JSON file per locale. Primary guard is TypeScript (`Messages` from `uk.json`) plus key-parity unit tests (042). There is **no** runtime merge of missing `ru`/`en` keys from `uk`. A hole that still reaches runtime uses **next-intl defaults**: log `MISSING_MESSAGE`, render the key path string, **do not throw** (no custom `onError` / `getMessageFallback` in v1).
5. **Payload editorial fields**: keep `localization.fallback: true` and default `uk` as documented in [`docs/content-model.md`](../content-model.md). Empty field in the requested locale resolves to the `uk` value. This is separate from chrome JSON.

Out of scope: per-locale slug remapping (Track 5), cookie banner UX (081), HTTP e2e for `/fr/...` in CI (086).

## Alternatives considered

| Approach                                      | Why not for v1                                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Silent serve `/fr/...` as `uk`                | Would publish a foreign URL as a real page; 404 keeps the address space honest.                |
| Runtime merge chrome `ru`/`en` ← `uk`         | Hides incomplete catalogs; parity tests and `tsc` already force complete files.                |
| Throw / hard-fail on missing chrome keys      | Would turn a missing string into a 500; product prefers a visible key path over a broken page. |
| Custom `getMessageFallback` returning English | Extra surface for no gain while catalogs stay complete; defaults already avoid throws.         |

## Consequences

- “Missing locale” in Verify means: bad URL prefix → 404; bad locale **code** in helpers → `uk`; missing chrome **key** → string fallback, no 500; empty Payload **field** → `uk` content.
- Unit coverage for helpers and missing-key no-throw lives in `tests/unit/i18nFallback.test.ts`; catalog parity and Payload int fallback remain in their existing suites.
- Authors must keep `uk` / `ru` / `en` chrome files in sync; holes are a CI/type failure, not a silent fallback product feature.
- Layout metadata may briefly resolve an invalid segment to `uk` for `getTranslations` before `notFound()`; the response status for that URL is still 404.
