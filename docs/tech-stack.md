# Технологический стек

Канонический перечень технологий личного блога (персональный сайт автора): публичный Next.js-сайт + Payload CMS v3 admin, деплой на бесплатном production-стеке.

**Архитектура (high level)**

```
Vercel (Next.js SSR/ISR + Payload /admin)
        │                         │
        ▼                         ▼
 Neon PostgreSQL              Cloudflare R2
 (контент, users, схемы)      (медиа / изображения)
```

Документ описывает **что** используем и **зачем**. Почему этот стек (и почему не отдельный API) — [`adr/000-payload-next-neon-r2.md`](./adr/000-payload-next-neon-r2.md). Порядок внедрения — в [`development-roadmap.md`](./development-roadmap.md).

---

## 1. Продуктовые рамки (контекст стека)

| Параметр     | Решение                                                           |
| ------------ | ----------------------------------------------------------------- |
| Тип продукта | Личный блог / персональный сайт автора                            |
| Контент      | Короткие заметки (thoughts/notes) + развёрнутые статьи (articles) |
| Медиа        | Изображения (WebP) + видео через YouTube embed                    |
| Локали       | `uk`, `ru`, `en`                                                  |
| Автор        | Один `admin`; публикует в `/admin`                                |
| Гости        | Читают без аккаунта; на деталях article/note — Share / Copy link  |
| Монетизация  | Нет (открытый контент)                                            |
| Хостинг v1   | `*.vercel.app`, custom domain позже                               |

---

## 2. Runtime и язык

| Технология                  | Назначение                                                                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Node.js 24 (Active LTS)** | Runtime приложения. Pin major — [`.nvmrc`](../.nvmrc) (`24`); `engines.node` в `package.json` — `^24.0.0`. CI (шаг 012) обязан брать версию через `node-version-file: '.nvmrc'` |
| **TypeScript**              | Строгая типизация app + Payload collections + shared types                                                                                                                      |
| **npm** (`>=10`)            | Package manager (workspaces не используем: один Next app); `engines.npm` в `package.json`                                                                                       |

---

## 3. Приложение и CMS

| Технология                      | Назначение                                                        |
| ------------------------------- | ----------------------------------------------------------------- |
| **Next.js (App Router)**        | Публичный сайт (SSR/ISR), API routes, единый deploy unit          |
| **React**                       | UI публичного сайта и admin shell Payload                         |
| **Payload CMS v3**              | Headless CMS + admin UI на `/admin`, Local API, access control    |
| **Lexical** (Payload rich text) | Редактор тела статей и заметок                                    |
| **Payload Local API / REST**    | Чтение/запись контента из Next Server Components и route handlers |

Один репозиторий, **один Next.js application**: website + Payload admin в одном процессе/деплое (без отдельного Nest API и без monorepo-пакетов на старте).

---

## 4. Данные и ORM

| Технология                                 | Назначение                                                   |
| ------------------------------------------ | ------------------------------------------------------------ |
| **Neon PostgreSQL** (Free tier)            | Production/preview БД: users (admin), контент, схемы Payload |
| **`@payloadcms/db-postgres`**              | Локальная разработка и универсальный Postgres-адаптер        |
| **`@payloadcms/db-vercel-postgres`**       | Оптимизированный адаптер для Vercel + Neon                   |
| **Drizzle ORM** (через Payload DB adapter) | Схема и migrations; **отдельный ORM-слой не вводим**         |
| **Payload migrations**                     | Версионирование схемы для production (`src/migrations/`)     |

**Почему так (лимиты Free):** личный блог с ISR/кэшем публичных страниц почти не нагружает БД. Текст и метаданные укладываются в Neon Free (~0.5 GB); тяжёлые байты живут в R2. Общий Redis-кэш и второй ORM на v1 не нужны — они увеличивают стоимость и cold start. Redis/Upstash **не** входит в продукт после pivot author-only (ADR-007); исторический ADR-006 superseded.

**Локально:** Docker Postgres (или Neon local connection) для быстрых schema push в dev. Выбор адаптера — `src/db/adapter.ts` (`db-postgres` по умолчанию; `db-vercel-postgres` при `VERCEL` — Preview и Production). Не ставить `VERCEL=1` в локальный `.env`.

**Политика схемы:** dev — Drizzle push; prod/preview/CI — только migrations. Детали — [`docs/adr/001-migrations-policy.md`](./adr/001-migrations-policy.md).

---

## 5. Медиа и хранилище

| Технология                                                         | Назначение                                                                                 |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| **Cloudflare R2**                                                  | Object storage для изображений (S3-compatible API, бесплатный egress в типичных сценариях) |
| **`@payloadcms/storage-s3`** (или актуальный R2/S3 plugin Payload) | Интеграция upload Media → R2                                                               |
| **WebP pipeline**                                                  | Payload `upload.formatOptions` + sharp → WebP (quality 80) на Media upload                 |
| **YouTube embeds**                                                 | Видео только по ссылке (Lexical block / field), без upload видео в R2                      |
| **CDN / custom domain для R2**                                     | Опционально после v1; на старте достаточно публичного R2 URL                               |

Upload медиа — **только admin**. Читатели не загружают файлы.

---

## 6. Аутентификация и авторизация

| Технология                   | Назначение                                                            |
| ---------------------------- | --------------------------------------------------------------------- |
| **Payload Auth**             | Users + sessions/cookies только для входа в `/admin` и Local API      |
| **Roles**                    | `admin` only (ADR-007)                                                |
| **Email + password**         | Логин автора в `/admin`; bootstrap `seed:admin` или create-first-user |
| **Password change**          | В `/admin` или прямое обновление в БД; **без** email reset            |
| **Access Control (Payload)** | Admin panel, drafts/preview; публичное чтение `publishedOrAdmin`      |
| **MFA (TOTP)**               | Out of scope v1 (заложено «позже»)                                    |

Публичный сайт **без** login/register. Канон pivot — [ADR-007](./adr/007-author-only-no-public-auth.md).

---

## 7. Email

**Out of scope / removed (ADR-007).** Транзакционная почта (Resend, verify, password reset) была в раннем роадмапе (шаги 028, 082) и снята вместе с публичной auth. Newsletter / marketing mail — по-прежнему out of scope.

---

## 8. UI, дизайн-система, i18n

| Технология                                     | Назначение                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------------- |
| **Tailwind CSS**                               | Utility-first стили                                                         |
| **shadcn/ui** (Radix primitives)               | Компонентная база: формы, dialog, dropdown, tabs и т.д.                     |
| **next-themes**                                | Light + **обязательный Dark** mode                                          |
| **Lucide** (или аналог из shadcn)              | Иконки                                                                      |
| **next-intl** (или эквивалент App Router i18n) | Маршрутизация и словари UI: `uk` / `ru` / `en` (fallback/missing — ADR-005) |
| **Payload localization**                       | Локализованные поля контента (title, body, slug и т.д.; empty → `uk`)       |

**Дизайн-принцип:** элегантный, аккуратный, эстетичный, «взрослый» editorial look — без визуального шума, с сильной типографикой и спокойной иерархией. shadcn выбран как оптимальный для Next App Router (контроль кода компонентов, dark mode, экосистема).

---

## 9. Контентные возможности (зависят от стека)

| Возможность                          | Реализация (ориентир)                                                                         |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| Drafts / Preview / Scheduled publish | Payload drafts + preview URL; schedule = query-time (`publishedAt <= now`, ADR-003) — не cron |
| Share / Copy link                    | UI на деталях article/note для гостей (`ShareActions`)                                        |
| Search                               | Postgres (`ILIKE` / `tsvector`) — без Meilisearch/Algolia                                     |
| Related posts                        | По tags/categories                                                                            |
| Reading time / TOC                   | Вычисление на publish/render                                                                  |
| Code highlighting                    | Shiki dual-theme в Lexical JSX pipeline (`CodeBlock` + `PayloadRichText`)                     |
| RSS / Sitemap / OG / JSON-LD         | Next route handlers + Metadata API                                                            |
| Versioning / rollback                | **Не используем в v1**                                                                        |
| Audit log CMS                        | **Не используем в v1** (один admin)                                                           |

**Стержневые collections (v1):** Users, Media, Categories, Tags, Articles, Notes, Pages.

---

## 10. Безопасность

| Технология / практика        | Назначение                                                                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **HTTPS** (Vercel)           | Транспорт                                                                                                                         |
| **Security headers**         | Next `headers()` + phased CSP (`src/security/headers.ts`); HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy             |
| **Rate limiting**            | **Removed** из продукта (исторически шаг 074 / ADR-006, superseded ADR-007)                                                       |
| **Cloudflare Turnstile**     | **Removed** из продукта (исторически шаг 075, superseded ADR-007)                                                                 |
| **Dependabot**               | Автоматические PR по зависимостям (`npm` + Actions); политика — [`security/supply-chain.md`](./security/supply-chain.md)          |
| **Secret scanning** (GitHub) | Утечки ключей в git + push protection; включение в Settings, процедура — [`security/supply-chain.md`](./security/supply-chain.md) |
| **Env secrets**              | Vercel Environment Variables + GitHub Actions Secrets                                                                             |
| **Password hashing**         | Встроенный механизм Payload (не изобретаем свой)                                                                                  |
| **Cookie consent**           | Лёгкий banner под Privacy/Terms + Analytics                                                                                       |

WAF: использовать бесплатные возможности Vercel/Cloudflare там, где подключается без платного плана.

---

## 11. Observability и аналитика

| Технология                                       | Назначение                                                           |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| **Vercel Logs**                                  | Runtime logs production/preview                                      |
| **Vercel Analytics** (free tier)                 | Web analytics                                                        |
| **Sentry** (free tier, если подключение простое) | Error tracking; если overhead велик — отложить, оставить Vercel logs |
| **Structured logging**                           | Единый формат логов в server code (без тяжёлого стека на старте)     |

OpenTelemetry full stack — не обязателен в v1.

---

## 12. Тестирование и качество кода

| Технология                             | Назначение                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **ESLint** (flat config)               | Lint TypeScript/React/Next через `eslint-config-next` + `eslint-config-prettier`; script `npm run lint` |
| **Prettier**                           | Форматирование (`.prettierrc.json`); script `npm run format`                                            |
| **Vitest**                             | Unit / component tests (`tests/unit/**`); CI-ready script `npm test` / `npm run test:unit`              |
| **Vitest (integration)**               | Payload/DB smoke в `tests/int/**`; script `npm run test:int` (нужна БД)                                 |
| **Testing Library** (по необходимости) | React component tests                                                                                   |
| **Typecheck** (`tsc --noEmit`)         | CI gate; script `npm run typecheck`                                                                     |

**Политика (что must / что не гоняем):** [`testing.md`](./testing.md).

---

## 13. CI/CD и релизный процесс

| Технология               | Назначение                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------ |
| **GitHub**               | Source of truth                                                                      |
| **GitHub Actions**       | CI на каждый PR: lint, format:check, typecheck, unit                                 |
| **Vercel**               | Deploy production + **Preview Deployments** на каждый PR                             |
| **Conventional Commits** | История коммитов; Commitlint + CI ([`commit-convention.md`](./commit-convention.md)) |
| **Changesets**           | Версионирование / changelog ([`versioning.md`](./versioning.md))                     |
| **Dependabot**           | Обновления зависимостей ([`security/supply-chain.md`](./security/supply-chain.md))   |
| **Environments**         | `local` · `preview` · `production`                                                   |

**CI skeleton (шаг 012):** [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — job `quality` на `pull_request` и `push` в `main`; Node из [`.nvmrc`](../.nvmrc) (`node-version-file`); gate: `npm ci` → `npm run ci` (lint + format:check + typecheck + unit). Playwright / e2e в pipeline — waived (**085** / **086** cancelled).

**Conventional Commits (шаг 093):** `@commitlint/config-conventional`; job `commitlint` на `pull_request` проверяет range base…head; канон — [`commit-convention.md`](./commit-convention.md); hint в [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md). Husky не используем.

**Changesets (шаг 094):** `@changesets/cli`; single-package `blog` (`private` + `privatePackages.version: true`); scripts `changeset` / `changeset:version` / `release` (bump + `CHANGELOG.md`, без npm publish); канон — [`versioning.md`](./versioning.md).

**Release policy (шаг 095):** `main` = Vercel Production; merge только через PR с зелёными `quality` + `commitlint`; bump/tag не блокер деплоя; канон — [`release-policy.md`](./release-policy.md).

**Branch protection (шаг 096):** Ruleset на `main` — PR-only, required checks `quality` + `commitlint`; чеклист UI — [`runbooks/branch-protection.md`](./runbooks/branch-protection.md).

**Neon:** один production project (без сложной ветвящейся schema-стратегии на старте). Preview шарит ту же БД; Neon branch per PR — по мере необходимости. Схема на Vercel: `npm run build:deploy` (migrate до `next build`) с `DATABASE_URL_UNPOOLED`; runtime — pooled `DATABASE_URL` (ADR-001; без cold-start `prodMigrations`).

---

## 14. Инфраструктура и внешние сервисы

| Сервис                   | Роль                                   | Тариф (ориентир) |
| ------------------------ | -------------------------------------- | ---------------- |
| **Vercel**               | App hosting, previews, analytics, logs | Hobby / Free     |
| **Neon**                 | PostgreSQL                             | Free             |
| **Cloudflare R2**        | Media storage                          | Free tier        |
| ~~Resend~~               | _(removed)_                            | —                |
| ~~Google OAuth~~         | _(removed)_                            | —                |
| ~~Cloudflare Turnstile~~ | _(removed)_                            | —                |
| ~~Upstash Redis~~        | _(removed)_                            | —                |
| **Sentry** (optional)    | Errors                                 | Free tier        |
| **Docker** (local)       | Postgres для разработки                | Local            |

---

## 15. Документация репозитория (целевой набор)

На старте создаются канонические файлы стека и роадмапа. Далее по роадмапу наращиваем:

| Документ                      | Назначение                                                                                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/tech-stack.md`          | Этот файл                                                                                                                                                                                                           |
| `docs/development-roadmap.md` | Инженерный роадмап до v1                                                                                                                                                                                            |
| `docs/testing.md`             | Политика тестов (must-cover, слои, review gate)                                                                                                                                                                     |
| `.env.example`                | Канон переменных окружения (плейсхолдеры, без секретов)                                                                                                                                                             |
| `docs/LOCAL_SETUP.md`         | Локальный запуск, env, Docker, seed                                                                                                                                                                                 |
| `docs/adr/`                   | Architecture Decision Records                                                                                                                                                                                       |
| `docs/security/`              | Access matrix, session hardening, supply-chain, threat model, [checklist](./security/checklist.md)                                                                                                                  |
| `docs/runbooks/`              | Vercel connect (**088**), Preview (**089**), [secrets matrix](./runbooks/secrets.md) (**092**), [branch protection](./runbooks/branch-protection.md) (**096**), R2 media, backup/restore Neon + R2, incident basics |
| `docs/release-policy.md`      | Как катим в production: `main` = prod, PR + required checks (**095**); enforce UI — [`runbooks/branch-protection.md`](./runbooks/branch-protection.md) (**096**)                                                    |
| `docs/content-model.md`       | Описание collections и полей                                                                                                                                                                                        |
| `README.md`                   | Точка входа в проект                                                                                                                                                                                                |
| Privacy / Terms pages         | Юридические страницы в продукте + краткие заметки в docs при необходимости                                                                                                                                          |

Язык документации: **русский**, с EN-терминами где принято (deploy, preview, access control, ISR и т.д.).

---

## 16. Явный out of scope (v1)

- Multi-tenant SaaS / несколько авторов-редакторов
- MFA / WebAuthn
- Платный контент, подписки, донаты
- Meilisearch / Algolia
- Upload видео в R2 (только YouTube)
- Content versioning / rollback UI
- Полноценный CMS audit log
- Custom domain / R2 custom CDN (после go-live)
- Отдельный Nest/Express API или monorepo packages
- Marketing newsletter

---

## 17. Критерий «стек готов»

Стек считается зафиксированным, когда:

1. Один Next.js + Payload app деплоится на Vercel.
2. Neon хранит схему и данные; R2 — медиа.
3. Только admin входит в `/admin` и пишет контент; гости читают без аккаунтов.
4. CI (lint/typecheck/test) и Preview Deployments зелёные.
5. Публичный сайт отдаёт uk/ru/en контент с SEO-артефактами и share на деталях.

Детальная последовательность шагов — в [`development-roadmap.md`](./development-roadmap.md).
