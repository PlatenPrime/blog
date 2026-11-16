# Runbook: Vercel Web Analytics

Шаг **097**. Consent-aware Web Analytics на публичном сайте. Connect / Preview / secrets — [vercel-connect.md](./vercel-connect.md), [vercel-preview.md](./vercel-preview.md), [secrets.md](./secrets.md).

## Что подключено

| Элемент        | Где                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Пакет          | `@vercel/analytics`                                                                                                                         |
| Монтирование   | `<Analytics />` внутри `ConsentAwareAnalytics` в [`src/app/(frontend)/[locale]/layout.tsx`](<../../src/app/(frontend)/[locale]/layout.tsx>) |
| Согласие       | Opt-in `localStorage` ключ `cookie-consent` (`accepted` \| `declined`) — шаг **081**                                                        |
| CSP            | Public: `https://va.vercel-scripts.com` в `script-src` и `connect-src` ([`src/security/headers.ts`](../../src/security/headers.ts))         |
| Admin `/admin` | Без Analytics                                                                                                                               |

На **production** скрипт идёт с same-origin `/_vercel/insights` (`'self'`). Origin `va.vercel-scripts.com` нужен для **local/dev** debug-скрипта.

**Speed Insights** (`@vercel/speed-insights`) в v1 не подключаем.

## Включить в Vercel (один раз)

1. Vercel → Project `blog` → **Analytics** → включить **Web Analytics** (Hobby / Free).
2. Deploy с кодом шага **097** на Production (`main`).
3. Открыть production URL в чистом профиле → **Accept** в cookie banner → пройтись по 2–3 страницам.
4. Dashboard → Analytics: через несколько минут видны pageviews.

Без Accept (или после Decline) скрипт не монтируется — в Network не должно быть `/_vercel/insights` и `va.vercel-scripts.com`.

## Локальная проверка

1. `npm run dev` → `http://localhost:3000/uk` без `localStorage.cookie-consent`.
2. DevTools → Network: до выбора согласия запросов к `va.vercel-scripts.com` нет.
3. Accept → появляется debug script с `va.vercel-scripts.com` (события в prod dashboard с localhost обычно не копятся).
4. Decline / clear → снова нет скрипта.

Unit CSP: `npm test -- tests/unit/securityHeaders.test.ts`.

## Связанные документы

- [LOCAL_SETUP.md](../LOCAL_SETUP.md) — poke cookie consent + Analytics
- [tech-stack.md](../tech-stack.md) §11 Observability
- [security/checklist.md](../security/checklist.md)
- Cookie helpers: [`src/lib/cookie-consent.ts`](../../src/lib/cookie-consent.ts)
