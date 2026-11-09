# Production checklist

Операционный gate перед go-live. Полный набор пунктов (env, OAuth, Resend, R2, analytics, backups, CI) — шаг **108**. Здесь живут проверки, которые уже появились раньше по роадмапу.

## SEO

- [ ] **Sitemap:** `GET /sitemap.xml` отдаёт валидный XML; в нём есть локали `uk` / `ru` / `en` для публичных оболочек; published articles/notes присутствуют; drafts и scheduled **отсутствуют**; auth/dev/admin URL не перечислены.
- [ ] **RSS:** `GET /{locale}/rss.xml`, `/{locale}/articles/rss.xml`, `/{locale}/notes/rss.xml` (`uk` / `ru` / `en`) отдают `application/rss+xml`; channel/item ссылки абсолютные; published items присутствуют; drafts и scheduled **отсутствуют**; в `<head>` есть `rel="alternate"` на mixed-фид локали.
