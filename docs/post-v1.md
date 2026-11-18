# Post-v1 (горизонт после announce)

Шаг **110**. Список того, что **сознательно не входит в v1**, но не должно потеряться.

Это не чертёж работ и не открытые todo роадмапа. Канон статусов — [`development-roadmap.md`](./development-roadmap.md): v1 закрыт, публичный вид после него — Track 15 (шаги **116–121**). Сюда эти шаги не копируются. Стек и out of scope — [`tech-stack.md`](./tech-stack.md) §16. Author-only продукт — [ADR-007](./adr/007-author-only-no-public-auth.md).

---

## Граница v1 / post-v1

| Зона                     | Что сюда                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **v1 done**              | Go-live на `*.vercel.app` (**109**). Live URL: `https://platenprimeblog.vercel.app`. Track 14 docs **111**–**115** закрыты.         |
| **Уже в чертеже**        | Публичный вид — Track 15, шаги **116–121** (`done`). Холодный синий, мягкие градиенты, шрифты и layout. В этот файл не дублируется. |
| **Сюда (v1.1+ / later)** | Custom domain, R2 CDN, MFA, audit log, search upgrade и прочее ниже.                                                                |

Verify границы: новый must-have после announce → сюда (или новый трек), не в закрытый чертёж v1. Waivers / out of scope — **здесь**.

---

## Кандидаты v1.1+

Коротко: что это и где уже зафиксирован якорь. Порядок не приоритет.

### Hosting

- **Custom domain на Vercel** — уйти с `*.vercel.app`; обновить `NEXT_PUBLIC_SERVER_URL`, canonical/OG, CORS R2 под новый origin. Якорь: tech-stack §1/§16, Notes **109**.

### Media / CDN

- **R2 custom CDN domain** (`media.example.com` вместо `*.r2.dev`) — tech-stack §5/§16, [`runbooks/r2-media.md`](./runbooks/r2-media.md), security waivers.
- **Private / signed R2 media** — сейчас public-read by design; security checklist / threat-model.
- **Upload видео в R2** — в v1 только YouTube embed; tech-stack §16.
- **Payload `imageSizes` / ленточные thumbnails** — вне **105**; book/Notes **105**.

### Auth / security

- **MFA / WebAuthn** на `/admin` — tech-stack §6/§16, threat-model residual.
- **Nonce / hash CSP** (убрать phase-1 `'unsafe-inline'` где возможно) — security checklist.
- **Product WAF** — вне приложения; security checklist.

### CMS

- **Полноценный CMS audit log** — tech-stack §9/§16.
- **Content versioning / rollback UI** — tech-stack §16.
- **Live Preview iframe** — вне **035**; Notes **035**.

### Search

- **Search upgrade** — Meilisearch / Algolia или Postgres `tsvector` / ranking / snippets; сейчас ILIKE. Tech-stack §9/§16, Notes **066**. Cross-request cache поиска — сознательно нет в ADR-009.

### Product (осознанно out, не «забыли»)

- Multi-author / multi-tenant CMS.
- Платный контент, подписки, донаты.
- Marketing newsletter / contact forms.
- Reader accounts, comments, bookmarks, публичная auth, Resend как продукт — [ADR-007](./adr/007-author-only-no-public-auth.md).
- Отдельный Nest/Express API или monorepo packages.

### SEO / UX polish

- Публичный визуальный refresh — Track 15 закрыт (**116–121** `done`). Следующий вид, если понадобится, — пункт сюда, не переписывание закрытых шагов.
- `robots.ts` / `robots.txt` — seo-checklist «сознательно нет».
- Privacy / terms в sitemap (сейчас только `about` среди CMS pages) — seo-checklist «сознательно нет» (**115**).
- BreadcrumbList JSON-LD; CMS Site Settings для JSON-LD — seo-checklist / Notes **070**.
- Atom feeds, category RSS, full HTML в RSS — seo-checklist / Notes **068**.
- `CONTACT_EMAIL` на Production (mailto на About) — waived на **109**.

### Ops / observability

- **Sentry** — когда сработают критерии [ADR-008](./adr/008-sentry-waive-until-needed.md).
- **Vercel Speed Insights** — вне **097** / **106**.
- Neon: branch-per-PR, scheduled backups beyond Free — [`runbooks/backup-neon.md`](./runbooks/backup-neon.md).
- R2: CI/cron auto-sync backup, object versioning — [`runbooks/backup-r2.md`](./runbooks/backup-r2.md).
- Bundle-analyzer / trim next-intl catalogs — вне **106**.

### Quality

- Playwright e2e / e2e-in-CI / a11y axe — **086** cancelled; testing.md / security checklist.

---

## Ops hygiene (не фичи продукта)

Хвосты после go-live, которые чинятся операцией, а не новым продуктовым шагом:

- **Redeploy Production** после non-interactive migrate, чтобы `/_vercel/insights/script.js` перестал отдавать 404 (хвост **109**; Web Analytics уже ON в UI).

Не смешивать с backlog v1.1 выше.

---

## Как пользоваться

1. Новая идея «после announce» → пункт сюда (или новый трек в чертеже), не в закрытый чертёж v1 и не в закрытый Track 15.
2. Расхождение docs ↔ код → либо правка канона, либо ticket сюда (аудит **115** закрыт с mismatches = 0).
3. Реализация пункта — отдельное решение и отдельная работа; этот файл только держит горизонт.
