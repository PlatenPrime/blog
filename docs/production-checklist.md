# Production checklist

Операционный gate перед go-live (шаг **108**). Author-only продукт — [ADR-007](adr/007-author-only-no-public-auth.md).

**Канонический Production URL (v1):** `https://platenprimeblog.vercel.app`  
Публичный announce + Live URL в README — шаг **109**. Custom domain / post-v1 — **110**. Полный docs audit — **115**.

Не дублировать runbooks: здесь короткие галочки и ссылки. Матрица секретов — [`runbooks/secrets.md`](./runbooks/secrets.md). Карта ops — [`runbooks/README.md`](./runbooks/README.md).

---

## Env (Production)

Канон имён — [`.env.example`](../.env.example). Процедуры — [`runbooks/vercel-connect.md`](./runbooks/vercel-connect.md), [`runbooks/secrets.md`](./runbooks/secrets.md).

- [x] **Runtime DB:** `DATABASE_URL` (Neon pooled) задан на Vercel Production.
- [x] **Migrate DB:** `DATABASE_URL_UNPOOLED` (Neon direct) задан на Production.
- [x] **Secrets:** `PAYLOAD_SECRET` и `PREVIEW_SECRET` заданы на Production (отдельные от Preview — см. secrets matrix).
- [x] **Origin:** `NEXT_PUBLIC_SERVER_URL` на Production; публичные canonical смотрят на `https://platenprimeblog.vercel.app`.
- [x] **R2 set:** все `R2_BUCKET` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_ENDPOINT` / `R2_PUBLIC_URL` (+ `R2_REGION`) на Production и Preview.
- [x] **Нет bootstrap на хостинге:** `ADMIN_EMAIL` / `ADMIN_PASSWORD` **не** лежат в Vercel env.
- [ ] **Рекомендуется:** `CONTACT_EMAIL` на Production (mailto на About). Пусто — ссылки нет; не блокер gate, желательно до **109**.

Preview: свои `PAYLOAD_SECRET` / `PREVIEW_SECRET`; `NEXT_PUBLIC_SERVER_URL` на Preview **не** задавать ([`vercel-preview.md`](./runbooks/vercel-preview.md)).

---

## Removed / N/A (ADR-007)

Устаревший текст deliverables шага 108 упоминал OAuth / Resend. После pivot это **не** go-live требования:

- [x] **N/A — Resend / transactional email** (снято с продукта).
- [x] **N/A — Google OAuth redirect URIs** (снято с продукта).
- [x] **N/A — Turnstile / Upstash** как обязательные product env (снято с продукта).

---

## R2 public access

Процедура — [`runbooks/r2-media.md`](./runbooks/r2-media.md). Backup — [`runbooks/backup-r2.md`](./runbooks/backup-r2.md).

- [x] **Public origin:** `R2_PUBLIC_URL` живой r2.dev (или custom); origin попадает в public CSP `img-src` на prod.
- [x] **Keys на Vercel:** полный набор `R2_*` (см. Env).
- [ ] **CORS:** bucket CORS разрешает Production origin (`NEXT_PUBLIC_SERVER_URL`) для client uploads из `/admin` (Methods GET/PUT/HEAD). Проверить в Cloudflare Dashboard перед первой боевой загрузкой с prod admin.
- [ ] **Object smoke:** после upload в prod `/admin` объект открывается по публичному URL без auth.

---

## Analytics

Код + consent — шаг **097**; runbook — [`runbooks/vercel-analytics.md`](./runbooks/vercel-analytics.md).

- [x] **Consent gate:** `@vercel/analytics` только после Accept в cookie banner (`DeferredPublicShell`); Decline — без скрипта.
- [ ] **Vercel Web Analytics:** включить в Project → Analytics (Hobby). После Accept на prod в Network есть `/_vercel/insights`; dashboard копит pageviews. Сделать до публичного announce (**109**).

Speed Insights в v1 не подключаем.

---

## Backups

- [x] **Neon policy + restore drill:** [`runbooks/backup-neon.md`](./runbooks/backup-neon.md) (шаг **100**) — PITR ≤ 6h, manual snapshot, `pg_dump`; drill на копии ветки выполнен.
- [x] **R2 policy + primary drill:** [`runbooks/backup-r2.md`](./runbooks/backup-r2.md) (шаг **101**) — нет versioning (accepted); mirror/cold copy описаны; primary put/copy/get/delete drill выполнен.
- [ ] **R2 secondary bucket:** завести private `blog-media-backup` и еженедельный sync, если ещё не сделано (см. Notes **101**).

---

## CI / release

- [x] **CI green:** `quality` на `main` success (GitHub Actions).
- [x] **Branch protection:** Ruleset `check quality` Active — PR-only + required check `quality` ([`runbooks/branch-protection.md`](./runbooks/branch-protection.md), [`release-policy.md`](./release-policy.md)).

---

## Content readiness

Шаг **107** / seed go-live. Ручной poke на уже залитой БД — [`LOCAL_SETUP.md`](./LOCAL_SETUP.md).

- [x] **Legal / about:** `/uk/about`, `/uk/privacy`, `/uk/terms` (и аналоги локалей) отдают 200 без Lorem на Production.
- [x] **Feed empty-state ok:** articles/notes могут быть пустыми; UI empty-state допустим для v1.

---

## SEO

Детальная шпаргалка: [`seo-checklist.md`](./seo-checklist.md).

- [x] **Sitemap:** `GET /sitemap.xml` → XML; локали `uk` / `ru` / `en`; `/admin` и login **нет**.
- [x] **RSS:** `/{locale}/rss.xml` (+ articles/notes) → `application/rss+xml` для `uk` / `ru` / `en`.
- [x] **OG images:** на locale shell в `<head>` есть `og:image`.
- [x] **JSON-LD:** на locale shell есть `application/ld+json`.
- [x] **Metadata:** уникальный title / description / `rel=canonical` на ключевых публичных страницах (canonical на prod = `platenprimeblog.vercel.app`).

---

## Security

Детальная шпаргалка: [`security/checklist.md`](./security/checklist.md). Threat model — [`security/threat-model.md`](./security/threat-model.md).

- [x] **Headers:** на prod — `X-Frame-Options: DENY`, `Content-Security-Policy` (в т.ч. `youtube-nocookie`), HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`; `/uk` и `/admin` открываются.
- [x] **GitHub:** Dependabot updates + security updates включены; secret scanning + push protection **enabled** (public repo). Config — [`.github/dependabot.yml`](../.github/dependabot.yml), [`security/supply-chain.md`](./security/supply-chain.md).
- [x] **ACL sanity:** anonymous `POST /api/media` и `POST /api/articles` → **403**; только admin пишет контент (ADR-007).

---

## Performance

Кеш / картинки — **104** / **105**. Bundle pass — **106**.

- [x] **Bundle / route pass:** на home нет очевидных client-гигантов; cookie banner / consent analytics — `DeferredPublicShell` + `next/dynamic` (`ssr: false`); `ShareActions` — отдельный chunk; theme toggle без `lucide-react` на публичке.

---

## Docs audit (не этот шаг)

- [ ] **Full docs ↔ code audit** — шаг **115** (чеклист-заглушка здесь, чтобы не потерять).

---

## Перед announce (**109**)

Закрыть оставшиеся `[ ]` выше, которые помечены «до 109» / CORS / object smoke / R2 backup bucket / `CONTACT_EMAIL`, затем smoke auth/content на Live URL и запись в README.
