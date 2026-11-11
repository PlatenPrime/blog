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

Детальная шпаргалка (инвентарь кода, must, waivers): [`security/checklist.md`](./security/checklist.md). Threat model — [`security/threat-model.md`](./security/threat-model.md).

- [ ] **Headers:** на prod URL в ответе есть `X-Frame-Options: DENY`, `Content-Security-Policy`, в production — HSTS; публичные страницы и `/admin` открываются без CSP-поломок.
- [ ] **Turnstile keys:** на preview/prod заданы `NEXT_PUBLIC_TURNSTILE_SITE_KEY` и `TURNSTILE_SECRET_KEY` (пустые = bypass).
- [ ] **Upstash:** на serverless заданы `UPSTASH_REDIS_REST_URL` и `UPSTASH_REDIS_REST_TOKEN` (иначе memory per-isolate).
- [ ] **GitHub:** Dependabot updates/alerts включены; secret scanning + push protection on (или waived с пометкой plan limitation в security checklist).
- [ ] **ACL sanity:** anonymous не upload Media и не создаёт comment; unverified reader не комментирует; reader не проходит в `/admin`.
