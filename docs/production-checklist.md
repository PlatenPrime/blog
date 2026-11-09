# Production checklist

Операционный gate перед go-live. Полный набор пунктов (env, OAuth, Resend, R2, analytics, backups, CI) — шаг **108**. Здесь живут проверки, которые уже появились раньше по роадмапу.

## SEO

- [ ] **Sitemap:** `GET /sitemap.xml` отдаёт валидный XML; в нём есть локали `uk` / `ru` / `en` для публичных оболочек; published articles/notes присутствуют; drafts и scheduled **отсутствуют**; auth/dev/admin URL не перечислены.
- [ ] **RSS:** `GET /{locale}/rss.xml`, `/{locale}/articles/rss.xml`, `/{locale}/notes/rss.xml` (`uk` / `ru` / `en`) отдают `application/rss+xml`; channel/item ссылки абсолютные; published items присутствуют; drafts и scheduled **отсутствуют**; в `<head>` есть `rel="alternate"` на mixed-фид локали.
- [ ] **OG images:** на locale shell и деталях articles/notes/about в `<head>` есть `og:image`; URL из meta отдаёт `image/png` (1200×630); у статьи без `seo.ogImage` используется hero, иначе title card; черновик по slug по-прежнему 404 страницы.
- [ ] **JSON-LD:** на locale shell в DOM есть `application/ld+json` с `@graph` WebSite + Person; на деталях articles/notes — Article; `url` / `mainEntityOfPage` абсолютные с префиксом локали (`uk` / `ru` / `en`); Article `author`/`isPartOf` ссылаются на стабильные `{origin}/#person` и `{origin}/#website`; image либо абсолютный media URL, либо `{pageUrl}/opengraph-image`.
