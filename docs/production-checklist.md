# Production checklist

Операционный gate перед go-live. Полный набор пунктов (env, OAuth, Resend, R2, analytics, backups, CI) — шаг **108**. Здесь живут проверки, которые уже появились раньше по роадмапу.

## SEO

Детальная шпаргалка (инвентарь кода, CMS, gaps): [`seo-checklist.md`](./seo-checklist.md).

- [ ] **Sitemap:** `GET /sitemap.xml` отдаёт валидный XML; в нём есть локали `uk` / `ru` / `en` для публичных оболочек; published articles/notes присутствуют; drafts и scheduled **отсутствуют**; auth/dev/admin URL не перечислены.
- [ ] **RSS:** `GET /{locale}/rss.xml`, `/{locale}/articles/rss.xml`, `/{locale}/notes/rss.xml` (`uk` / `ru` / `en`) отдают `application/rss+xml`; channel/item ссылки абсолютные; published items присутствуют; drafts и scheduled **отсутствуют**; в `<head>` есть `rel="alternate"` на mixed-фид локали.
- [ ] **OG images:** на locale shell и деталях articles/notes/about в `<head>` есть `og:image`; URL из meta отдаёт `image/png` (1200×630); у статьи без `seo.ogImage` используется hero, иначе title card; черновик по slug по-прежнему 404 страницы.
- [ ] **JSON-LD:** на locale shell в DOM есть `application/ld+json` с `@graph` WebSite + Person; на деталях articles/notes — Article; `url` / `mainEntityOfPage` абсолютные с префиксом локали (`uk` / `ru` / `en`); Article `author`/`isPartOf` ссылаются на стабильные `{origin}/#person` и `{origin}/#website`; image либо абсолютный media URL, либо `{pageUrl}/opengraph-image`.
- [ ] **Metadata:** на ключевых публичных страницах уникальный `<title>`, `meta[name=description]`, `link[rel=canonical]` без query; home — голый `nav.siteTitle`; list/detail не делят title с auth; auth/bookmarks/account и `/search?q=` — `noindex`; hreflang в `<head>` согласован с locale/slug (как в sitemap).

## Security

Детальная шпаргалка (инвентарь кода, ops, waived): [`security/checklist.md`](./security/checklist.md).

- [ ] **Headers:** public ответ — `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; в production — HSTS; CSP не ломает public и `/admin`.
- [ ] **Rate limit:** превышение на auth POST → HTTP 429 + `Retry-After`; actions login/register/comment отдают i18n rate-limit ошибку.
- [ ] **Turnstile:** в production заданы site + secret keys; без токена login/register/comment не проходит.
- [ ] **Upstash:** в production заданы Redis REST URL/token (не memory-only на multi-isolate).
- [ ] **Supply chain:** Dependabot updates/alerts + Secret scanning + Push protection включены (или явный waiver по плану GitHub).
- [ ] **Session:** cookie HttpOnly + SameSite=Lax (+ Secure в prod); `/logout` сбрасывает сессию.
