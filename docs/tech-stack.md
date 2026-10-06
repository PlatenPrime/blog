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

| Параметр | Решение |
| --- | --- |
| Тип продукта | Личный блог / персональный сайт автора |
| Контент | Короткие заметки (thoughts/notes) + развёрнутые статьи (articles) |
| Медиа | Изображения (WebP) + видео через YouTube embed |
| Локали | `uk`, `ru`, `en` |
| Авторы | Один admin/author; публичная регистрация читателей |
| Читатели | Аккаунт, закладки, комментарии (только для авторизованных) |
| Монетизация | Нет (открытый контент) |
| Хостинг v1 | `*.vercel.app`, custom domain позже |

---

## 2. Runtime и язык

| Технология | Назначение |
| --- | --- |
| **Node.js 24 (Active LTS)** | Runtime приложения. Pin major — [`.nvmrc`](../.nvmrc) (`24`); `engines.node` в `package.json` — `^24.0.0`. CI (шаг 012) обязан брать версию через `node-version-file: '.nvmrc'` |
| **TypeScript** | Строгая типизация app + Payload collections + shared types |
| **npm** (`>=10`) | Package manager (workspaces не используем: один Next app); `engines.npm` в `package.json` |

---

## 3. Приложение и CMS

| Технология | Назначение |
| --- | --- |
| **Next.js (App Router)** | Публичный сайт (SSR/ISR), API routes, единый deploy unit |
| **React** | UI публичного сайта и admin shell Payload |
| **Payload CMS v3** | Headless CMS + admin UI на `/admin`, Local API, access control |
| **Lexical** (Payload rich text) | Редактор тела статей и заметок |
| **Payload Local API / REST** | Чтение/запись контента из Next Server Components и route handlers |

Один репозиторий, **один Next.js application**: website + Payload admin в одном процессе/деплое (без отдельного Nest API и без monorepo-пакетов на старте).

---

## 4. Данные и ORM

| Технология | Назначение |
| --- | --- |
| **Neon PostgreSQL** (Free tier) | Production/preview БД: users, контент, комментарии, закладки, схемы |
| **`@payloadcms/db-postgres`** | Локальная разработка и универсальный Postgres-адаптер |
| **`@payloadcms/db-vercel-postgres`** | Оптимизированный адаптер для Vercel + Neon |
| **Drizzle ORM** (через Payload DB adapter) | Схема и migrations; **отдельный ORM-слой не вводим** |
| **Payload migrations** | Версионирование схемы для production (`src/migrations/`) |

**Почему так (лимиты Free):** личный блог с ISR/кэшем публичных страниц почти не нагружает БД. Текст и метаданные укладываются в Neon Free (~0.5 GB); тяжёлые байты живут в R2. Redis и второй ORM на v1 не нужны — они увеличивают стоимость и cold start.

**Локально:** Docker Postgres (или Neon local connection) для быстрых schema push в dev. Выбор адаптера — `src/db/adapter.ts` (`db-postgres` по умолчанию, `db-vercel-postgres` при `VERCEL`).

**Политика схемы:** dev — Drizzle push; prod/preview/CI — только migrations. Детали — [`docs/adr/001-migrations-policy.md`](./adr/001-migrations-policy.md).

---

## 5. Медиа и хранилище

| Технология | Назначение |
| --- | --- |
| **Cloudflare R2** | Object storage для изображений (S3-compatible API, бесплатный egress в типичных сценариях) |
| **`@payloadcms/storage-s3`** (или актуальный R2/S3 plugin Payload) | Интеграция upload Media → R2 |
| **WebP pipeline** | Конвертация/отдача загружаемых изображений в WebP |
| **YouTube embeds** | Видео только по ссылке (Lexical block / field), без upload видео в R2 |
| **CDN / custom domain для R2** | Опционально после v1; на старте достаточно публичного R2 URL |

Upload медиа — **только admin**. Читатели не загружают файлы.

---

## 6. Аутентификация и авторизация

| Технология | Назначение |
| --- | --- |
| **Payload Auth** | Единая модель Users + sessions/cookies, лучше всего стыкуется с admin и Local API |
| **Roles** | `admin` (единственный автор/админ), `reader` (читатель: закладки, комментарии) |
| **Email + password** | Регистрация/логин читателей; admin создаётся seed/bootstrap |
| **Google OAuth** | Социальный вход (только Google; GitHub/Apple — out of scope) |
| **Email verification** | Подтверждение почты при регистрации |
| **Password reset** | Сброс пароля по письму |
| **Access Control (Payload)** | Admin panel, drafts/preview, CRUD комментариев/закладок |
| **MFA (TOTP)** | Out of scope v1 (заложено «позже») |

Предпочтение: **не** плодить гибрид Auth.js + Payload без нужды. Auth читателей и admin — через Payload Users с разными ролями и UI (публичные `/login` vs `/admin`).

---

## 7. Email

| Технология | Назначение |
| --- | --- |
| **Resend** | Транзакционные письма: verification + password reset |
| **Локально** | Ethereal / Mailpit / лог в console — на выбор в LOCAL_SETUP; в prod только Resend |

Newsletter / marketing mail — out of scope.

---

## 8. UI, дизайн-система, i18n

| Технология | Назначение |
| --- | --- |
| **Tailwind CSS** | Utility-first стили |
| **shadcn/ui** (Radix primitives) | Компонентная база: формы, dialog, dropdown, tabs и т.д. |
| **next-themes** | Light + **обязательный Dark** mode |
| **Lucide** (или аналог из shadcn) | Иконки |
| **next-intl** (или эквивалент App Router i18n) | Маршрутизация и словари UI: `uk` / `ru` / `en` |
| **Payload localization** | Локализованные поля контента (title, body, slug и т.д.) |

**Дизайн-принцип:** элегантный, аккуратный, эстетичный, «взрослый» editorial look — без визуального шума, с сильной типографикой и спокойной иерархией. shadcn выбран как оптимальный для Next App Router (контроль кода компонентов, dark mode, экосистема).

---

## 9. Контентные возможности (зависят от стека)

| Возможность | Реализация (ориентир) |
| --- | --- |
| Drafts / Preview / Scheduled publish | Payload drafts + preview URL + `publishedAt` / schedule job или cron-safe publish field |
| Comments | Collection + auth-only create; moderation hooks по необходимости |
| Bookmarks | Collection `bookmarks` (user ↔ post/note) |
| Search | Postgres (`ILIKE` / `tsvector`) — без Meilisearch/Algolia |
| Related posts | По tags/categories |
| Reading time / TOC | Вычисление на publish/render |
| Code highlighting | Shiki или rehype/highlight в Lexical→HTML pipeline |
| RSS / Sitemap / OG / JSON-LD | Next route handlers + Metadata API |
| Versioning / rollback | **Не используем в v1** |
| Audit log CMS | **Не используем в v1** (один admin) |

**Стержневые collections (v1):** Users, Media, Categories, Tags, Articles, Notes, Pages, Comments, Bookmarks.

---

## 10. Безопасность

| Технология / практика | Назначение |
| --- | --- |
| **HTTPS** (Vercel) | Транспорт |
| **Security headers** | CSP (по мере возможности), HSTS, X-Frame-Options, Referrer-Policy и т.д. |
| **Rate limiting** | Auth, comments, password reset (Vercel / middleware / Upstash free или встроенные лимиты) |
| **Cloudflare Turnstile** (free) | Bot protection на login/register/comments |
| **Dependabot** | Автоматические PR по уязвимым зависимостям |
| **Secret scanning** (GitHub) | Утечки ключей в git |
| **Env secrets** | Vercel Environment Variables + GitHub Actions Secrets |
| **Password hashing** | Встроенный механизм Payload (не изобретаем свой) |
| **Cookie consent** | Лёгкий banner под Privacy/Terms + Analytics |

WAF: использовать бесплатные возможности Vercel/Cloudflare там, где подключается без платного плана.

---

## 11. Observability и аналитика

| Технология | Назначение |
| --- | --- |
| **Vercel Logs** | Runtime logs production/preview |
| **Vercel Analytics** (free tier) | Web analytics |
| **Sentry** (free tier, если подключение простое) | Error tracking; если overhead велик — отложить, оставить Vercel logs |
| **Structured logging** | Единый формат логов в server code (без тяжёлого стека на старте) |

OpenTelemetry full stack — не обязателен в v1.

---

## 12. Тестирование и качество кода

| Технология | Назначение |
| --- | --- |
| **ESLint** (flat config) | Lint TypeScript/React/Next через `eslint-config-next` + `eslint-config-prettier`; script `npm run lint` |
| **Prettier** | Форматирование (`.prettierrc.json`); script `npm run format` |
| **Vitest** | Unit / component tests (`tests/unit/**`); CI-ready script `npm test` / `npm run test:unit` |
| **Vitest (integration)** | Payload/DB smoke в `tests/int/**`; script `npm run test:int` (нужна БД) |
| **Playwright** | E2E (`tests/e2e/**`): разметка, дизайн-критичные экраны, auth/comment/bookmark flows; `baseURL` `http://localhost:3000`, `webServer` поднимает `npm run dev`; scripts `npm run test:e2e` / `npm run test:e2e:install` (Chromium) |
| **Testing Library** (по необходимости) | React component tests |
| **Typecheck** (`tsc --noEmit`) | CI gate; script `npm run typecheck` |
| **axe / a11y smoke** | Базовая доступность в Playwright |

---

## 13. CI/CD и релизный процесс

| Технология | Назначение |
| --- | --- |
| **GitHub** | Source of truth |
| **GitHub Actions** | CI на каждый PR: lint, typecheck, unit, e2e (где применимо) |
| **Vercel** | Deploy production + **Preview Deployments** на каждый PR |
| **Conventional Commits** | История коммитов |
| **Changesets** | Версионирование / changelog релизов |
| **Dependabot** | Обновления зависимостей |
| **Environments** | `local` · `preview` · `production` |

**CI skeleton (шаг 012):** [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — job `quality` на `pull_request` и `push` в `main`; Node из [`.nvmrc`](../.nvmrc) (`node-version-file`); gate: `npm ci` → `npm run lint` → `npm run typecheck` → `npm test` (unit). E2E в pipeline — шаг 086.

**Neon:** один production project (без сложной ветвящейся schema-стратегии на старте). Preview app может шарить осторожно настроенный DB strategy (отдельная DB/branch — по мере необходимости; дефолт роадмапа — простой prod Neon + изолированные secrets).

---

## 14. Инфраструктура и внешние сервисы

| Сервис | Роль | Тариф (ориентир) |
| --- | --- | --- |
| **Vercel** | App hosting, previews, analytics, logs | Hobby / Free |
| **Neon** | PostgreSQL | Free |
| **Cloudflare R2** | Media storage | Free tier |
| **Resend** | Auth email | Free tier |
| **Google Cloud Console** | OAuth client (Google login) | Free |
| **Cloudflare Turnstile** | Bot protection | Free |
| **Sentry** (optional) | Errors | Free tier |
| **Docker** (local) | Postgres для разработки | Local |

---

## 15. Документация репозитория (целевой набор)

На старте создаются канонические файлы стека и роадмапа. Далее по роадмапу наращиваем:

| Документ | Назначение |
| --- | --- |
| `docs/tech-stack.md` | Этот файл |
| `docs/development-roadmap.md` | Инженерный роадмап до v1 |
| `.env.example` | Канон переменных окружения (плейсхолдеры, без секретов) |
| `docs/LOCAL_SETUP.md` | Локальный запуск, env, Docker, seed |
| `docs/adr/` | Architecture Decision Records |
| `docs/security/` | Threat model, security checklist |
| `docs/runbooks/` | Backup/restore Neon + R2, incident basics |
| `docs/content-model.md` | Описание collections и полей |
| `README.md` | Точка входа в проект |
| Privacy / Terms pages | Юридические страницы в продукте + краткие заметки в docs при необходимости |

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
3. Auth (email+password + Google) работает для readers; admin пишет контент в `/admin`.
4. CI (lint/typecheck/test) и Preview Deployments зелёные.
5. Публичный сайт отдаёт uk/ru/en контент с SEO-артефактами и reader-features.

Детальная последовательность шагов — в [`development-roadmap.md`](./development-roadmap.md).
