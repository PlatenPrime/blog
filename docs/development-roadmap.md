# Development Roadmap

Инженерный роадмап личного блога до полноценного production v1.

**Стек:** Next.js + Payload CMS v3 на Vercel · Neon PostgreSQL · Cloudflare R2.  
**Канон технологий:** [`tech-stack.md`](./tech-stack.md).

## Как читать этот документ

| Поле шага | Смысл |
| --- | --- |
| **Цель** | Зачем шаг |
| **Deliverables** | Что появляется в репо / инфраструктуре |
| **Verify** | Как проверить |
| **DoD** | Definition of Done шага |

**Статусы шагов:** `todo` · `doing` · `done` · `blocked`.

**Baseline Status:** все шаги ниже — `todo` (старт с нуля после пустого репозитория).

**Правила ведения**

1. Один PR ≈ ровно один пронумерованный шаг роадмапа, с зелёным CI.
2. Документация обновляется в том же изменении, что и код шага.
3. Секреты не коммитятся; только `.env.example` + описание в LOCAL_SETUP.
4. Conventional Commits + Changesets с момента появления релизного трека.
5. Preview Deployment на каждый PR после подключения Vercel.

---

## Продуктовый DoD v1 (финиш роадмапа)

v1 считается завершённым, когда одновременно верно:

- [ ] Сайт на Vercel (`*.vercel.app`) в production
- [ ] Admin на `/admin`: один admin публикует Articles и Notes (draft / preview / schedule)
- [ ] Медиа: изображения в R2 (WebP); видео — YouTube embed
- [ ] Локали `uk` / `ru` / `en` для UI и контента
- [ ] Readers: register/login (email+password + Google), verify email, password reset (Resend)
- [ ] Comments и Bookmarks только для авторизованных
- [ ] SEO: RSS, sitemap, OG images, JSON-LD, TOC, reading time, related, code highlight
- [ ] Поиск по Postgres
- [ ] Dark + light theme, shadcn UI, аккуратный editorial дизайн
- [ ] Privacy, Terms, cookie consent
- [ ] CI: lint + typecheck + Vitest + Playwright; Dependabot; Preview Deploys
- [ ] Backups Neon (+ политика R2); логи Vercel; Vercel Analytics
- [ ] Seed + faker для локалки; документация LOCAL_SETUP / ADR / runbooks / security

---

# Track 0 — Foundation

Каркас репозитория, локальный запуск, базовое качество.

### 001 — Инициализация репозитория и README

- **Статус:** done
- **Цель:** Пустой wipe превратить в осознанную точку входа проекта.
- **Deliverables:** `README.md` (продукт, стек, ссылки на docs), `.gitignore`, лицензия при необходимости.
- **Verify:** README открывается; нет секретов в git.
- **DoD:** Новыйклонер понимает, что это за проект и куда смотреть дальше.

### 002 — Scaffold Next.js + Payload CMS v3

- **Статус:** done
- **Цель:** Один app: website + `/admin`.
- **Deliverables:** Next.js App Router project; Payload config; `/admin` поднимается; TypeScript strict.
- **Verify:** `npm run dev` → сайт и admin открываются локально.
- **DoD:** Базовый hello Payload+Next без лишних шаблонов-маркетинга (чистим boilerplate под наш продукт).

### 003 — Node LTS, npm, engines, editorconfig

- **Статус:** done
- **Цель:** Зафиксировать runtime.
- **Deliverables:** `engines` в `package.json`, `.nvmrc` или `volta`, `.editorconfig`.
- **Verify:** Документированная версия Node совпадает с CI.
- **DoD:** Один источник правды по версии Node.

### 004 — ESLint + Prettier

- **Статус:** done
- **Цель:** Единый стиль кода.
- **Deliverables:** ESLint flat config (Next + TS), Prettier, npm scripts `lint` / `format`.
- **Verify:** `npm run lint` проходит на scaffold.
- **DoD:** Lint gate готов к CI.

### 005 — Typecheck script

- **Статус:** done
- **Цель:** Отдельный CI-gate типов.
- **Deliverables:** `typecheck` script (`tsc --noEmit`).
- **Verify:** Script падает на заведомой ошибке типов.
- **DoD:** Typecheck в local workflow.

### 006 — Env contract (`.env.example`)

- **Статус:** done
- **Цель:** Все переменные окружения описаны до появления сервисов.
- **Deliverables:** `.env.example` с `DATABASE_URL`, `PAYLOAD_SECRET`, R2/*, Resend, Google OAuth, `NEXT_PUBLIC_*`.
- **Verify:** Нет реальных секретов; комментарии понятны.
- **DoD:** Можно заполнить env по примеру без чтения кода.

### 007 — Local Postgres (Docker Compose)

- **Статус:** done
- **Цель:** Быстрая локальная БД.
- **Deliverables:** `docker-compose.yml` (Postgres), инструкция в docs.
- **Verify:** Контейнер healthy; Payload коннектится.
- **DoD:** Dev не зависит от Neon обязательно.

### 008 — Payload DB adapter (Postgres + Drizzle)

- **Статус:** done
- **Цель:** Подключить официальный Postgres adapter.
- **Deliverables:** `@payloadcms/db-postgres` (local); заготовка под `@payloadcms/db-vercel-postgres` в prod.
- **Verify:** Admin создаёт запись Users; таблицы появляются.
- **DoD:** Схема идёт через Payload, отдельный ORM не подключён.

### 009 — Migrations policy

- **Статус:** done
- **Цель:** Dev push vs prod migrations.
- **Deliverables:** Документ ADR + scripts migrate; prod без опасного auto-push.
- **Verify:** Миграция применяется чисто на пустой БД.
- **DoD:** Политика миграций записана и исполнима.

### 010 — Vitest bootstrap

- **Статус:** done
- **Цель:** Unit-тестовый раннер с первого кода домена.
- **Deliverables:** Vitest config, пример smoke-теста, `npm test`.
- **Verify:** Тест зелёный в CI-ready script.
- **DoD:** Можно писать unit-тесты сразу.

### 011 — Playwright bootstrap

- **Статус:** done
- **Цель:** E2E каркас (дизайн, разметка, взаимодействия).
- **Deliverables:** Playwright config, smoke «home loads», npm scripts.
- **Verify:** Локальный e2e проходит против `dev`/`start`.
- **DoD:** Готово к росту сценариев.

### 012 — GitHub Actions CI skeleton

- **Статус:** done
- **Цель:** PR не мержится без базовых проверок.
- **Deliverables:** Workflow: install, lint, typecheck, unit tests.
- **Verify:** PR запускает workflow; failing lint ломает check.
- **DoD:** Минимальный quality gate жив.

### 013 — LOCAL_SETUP.md

- **Статус:** done
- **Цель:** Повторяемый локальный запуск.
- **Deliverables:** `docs/LOCAL_SETUP.md` (Node, Docker, env, migrate, seed placeholder, admin bootstrap).
- **Verify:** Следование документу с нуля поднимает app.
- **DoD:** Onboarding без устных пояснений.

### 014 — ADR-000: выбор стека

- **Статус:** done
- **Цель:** Зафиксировать архитектурные решения.
- **Deliverables:** `docs/adr/000-payload-next-neon-r2.md`.
- **Verify:** ADR ссылается на tech-stack и отвечает «почему не отдельный API».
- **DoD:** Решение нельзя «забыть» через месяц.

---

# Track 1 — Content model (данные)

Стержневая модель без полного UI.

### 015 — Users collection + roles

- **Статус:** todo
- **Цель:** `admin` и `reader`.
- **Deliverables:** Users auth-enabled; role field; access control stubs.
- **Verify:** Admin входит в `/admin`; reader — нет.
- **DoD:** Роли различаются на уровне Payload access.

### 016 — Media collection

- **Статус:** todo
- **Цель:** Файлы как first-class entity (пока local disk ok до R2).
- **Deliverables:** Media collection, mime/size limits для images.
- **Verify:** Upload image в admin.
- **DoD:** Медиа привязывается к постам позже без переделки модели.

### 017 — Categories + Tags

- **Статус:** todo
- **Цель:** Таксономия ленты.
- **Deliverables:** Collections + localized titles/slugs.
- **Verify:** CRUD в admin.
- **DoD:** Готовы relation fields для Articles/Notes.

### 018 — Articles collection

- **Статус:** todo
- **Цель:** Развёрнутые статьи.
- **Deliverables:** title, slug, Lexical body, hero image, categories/tags, SEO fields, status/drafts, `publishedAt`, localization uk/ru/en.
- **Verify:** Создать draft и published article в admin.
- **DoD:** Модель статьи покрывает v1 product needs.

### 019 — Notes collection (короткие мысли)

- **Статус:** todo
- **Цель:** Короткий формат, отдельный от Articles.
- **Deliverables:** Аналогичные поля, упрощённый body; отличимый type в API/URL.
- **Verify:** Note создаётся и отличается от Article в запросах.
- **DoD:** Два формата контента формализованы.

### 020 — Pages collection

- **Статус:** todo
- **Цель:** About, Privacy, Terms, Contact-like static pages.
- **Deliverables:** Pages с Lexical/SEO; slugs.
- **Verify:** Page `about` сохраняется.
- **DoD:** Юридические и about страницы не хардкодятся навсегда в JSX без CMS-пути (CMS preferred).

### 021 — Comments collection

- **Статус:** todo
- **Цель:** Комментарии к Article/Note.
- **Deliverables:** relation content + author user; body; createdAt; soft moderation field (approved/hidden) optional.
- **Verify:** Reader-роль может создать comment через Local API в тесте; аноним — нет.
- **DoD:** Модель комментариев готова к UI.

### 022 — Bookmarks collection

- **Статус:** todo
- **Цель:** Закладки читателя.
- **Deliverables:** unique (user, content); access: только владелец.
- **Verify:** Дубликат закладки блокируется.
- **DoD:** Модель закладок готова к UI.

### 023 — content-model.md

- **Статус:** todo
- **Цель:** Человекочитаемая схема данных.
- **Deliverables:** `docs/content-model.md` со всеми collections и ключевыми полями.
- **Verify:** Совпадает с Payload config.
- **DoD:** Модель задокументирована.

### 024 — Unit tests для access helpers / slug rules

- **Статус:** todo
- **Цель:** Защитить инварианты модели.
- **Deliverables:** Vitest на slugify, role checks, bookmark uniqueness helpers.
- **Verify:** `npm test` green.
- **DoD:** Критичная логика покрыта до UI.

---

# Track 2 — Auth (серьёзная аутентификация)

### 025 — Email+password register/login (public)

- **Статус:** todo
- **Цель:** Публичные страницы auth для readers.
- **Deliverables:** `/[locale]/login`, `/register`, Payload auth integration, sessions/cookies.
- **Verify:** Reader регистрируется и логинится; admin panel недоступен.
- **DoD:** Credentials flow работает end-to-end локально.

### 026 — Email verification

- **Статус:** todo
- **Цель:** Почта привязана и подтверждена.
- **Deliverables:** verification token flow; блокировка чувствительных действий до verify (политика зафиксирована в ADR).
- **Verify:** Письмо уходит (dev transport); ссылка подтверждает аккаунт.
- **DoD:** Unverified пользователь явно обработан в UX.

### 027 — Password reset

- **Статус:** todo
- **Цель:** Сброс пароля по почте.
- **Deliverables:** request + reset pages; expiry tokens; rate limit hooks.
- **Verify:** Полный цикл reset меняет пароль; старый не работает.
- **DoD:** Reset безопасен и документирован.

### 028 — Resend integration (prod-ready adapter)

- **Статус:** todo
- **Цель:** Единый mail provider.
- **Deliverables:** Email adapter Resend; templates verification/reset; env vars.
- **Verify:** В staging/prod-like env письмо доходит; локально — fallback.
- **DoD:** Auth email не зависит от console.log в production.

### 029 — Google OAuth

- **Статус:** todo
- **Цель:** Вход через Google.
- **Deliverables:** OAuth app setup docs; callback; link/create reader user; ADR по account linking.
- **Verify:** Google login создаёт/логинит reader.
- **DoD:** Credentials + Google сосуществуют.

### 030 — Session security hardening

- **Статус:** todo
- **Цель:** Cookie flags, CSRF strategy, logout everywhere basics.
- **Deliverables:** Secure/HttpOnly/SameSite; logout; docs security note.
- **Verify:** Playwright: login → authenticated request → logout.
- **DoD:** Базовая session hygiene закрыта.

### 031 — Access control matrix

- **Статус:** todo
- **Цель:** Явные права admin vs reader vs anonymous.
- **Deliverables:** Таблица в `docs/security/access-matrix.md`; тесты access.
- **Verify:** Anonymous не пишет comments; reader не пишет Articles.
- **DoD:** Матрица совпадает с кодом.

### 032 — Auth Playwright suite

- **Статус:** todo
- **Цель:** Регрессия auth UI.
- **Deliverables:** E2E register/login/logout/reset happy paths + negative.
- **Verify:** Suite стабилен локально.
- **DoD:** Auth покрыт e2e.

---

# Track 3 — Admin CMS & media

### 033 — Admin UX cleanup под одного автора

- **Статус:** todo
- **Цель:** `/admin` удобен для ежедневной публикации.
- **Deliverables:** Навигация collections, labels RU/EN terms, defaults.
- **Verify:** Admin создаёт Article за < N кликов (smoke checklist).
- **DoD:** CMS не выглядит «сырым scaffold».

### 034 — Lexical: images + YouTube block

- **Статус:** todo
- **Цель:** Контент с картинками и видео-ссылками.
- **Deliverables:** Upload/insert image; YouTube embed block; sanitize.
- **Verify:** Статья с image + YouTube рендерится на публичке (после Track 5 — временный preview route ok).
- **DoD:** Оба медиа-формата поддерживаются в редакторе.

### 035 — Drafts + Preview

- **Статус:** todo
- **Цель:** Черновики и превью до публикации.
- **Deliverables:** Drafts enabled; preview URL с секретом/auth; undocumented URL protection.
- **Verify:** Draft не виден анонимам; preview виден admin.
- **DoD:** Редакционный цикл draft→preview работает.

### 036 — Scheduled publish

- **Статус:** todo
- **Цель:** Отложенная публикация.
- **Deliverables:** `publishedAt` / `_status` стратегия; механизм publish (cron/Vercel cron или query-time visibility).
- **Verify:** Будущая дата скрывает пост; после времени — показывает.
- **DoD:** Schedule предсказуем и задокументирован (ADR).

### 037 — Cloudflare R2 storage plugin

- **Статус:** todo
- **Цель:** Медиа в R2.
- **Deliverables:** S3-compatible Payload storage; bucket; credentials в env; LOCAL_SETUP + runbook.
- **Verify:** Upload в admin → объект в R2; публичный URL открывается.
- **DoD:** Локальный disk больше не нужен для prod media.

### 038 — WebP pipeline

- **Статус:** todo
- **Цель:** Все загружаемые изображения в WebP.
- **Deliverables:** Conversion on upload (sharp или Payload image sizes); отказ/конверт non-webp.
- **Verify:** PNG/JPEG upload сохраняется/отдаётся как WebP.
- **DoD:** Политика WebP enforced.

### 039 — Media access: admin-only upload

- **Статус:** todo
- **Цель:** Читатели не грузят файлы.
- **Deliverables:** Access control Media create/update/delete = admin.
- **Verify:** Reader API upload → 403.
- **DoD:** Граница upload закрыта тестом.

### 040 — Admin seed user

- **Статус:** todo
- **Цель:** Первый admin без ручного SQL.
- **Deliverables:** Bootstrap script / env `ADMIN_EMAIL`+`ADMIN_PASSWORD` seed.
- **Verify:** Чистая БД → один admin после seed.
- **DoD:** Onboarding admin воспроизводим.

---

# Track 4 — i18n

### 041 — Routing локалей uk/ru/en

- **Статус:** todo
- **Цель:** URL-структура с локалью.
- **Deliverables:** `next-intl` (или выбранный i18n) middleware; default locale policy (ADR).
- **Verify:** `/uk`, `/ru`, `/en` отдают UI.
- **DoD:** Локаль в URL стабильна.

### 042 — UI dictionaries

- **Статус:** todo
- **Цель:** Переводы chrome UI.
- **Deliverables:** JSON/TS dictionaries для nav, auth, errors, cookies.
- **Verify:** Переключение языка меняет UI strings.
- **DoD:** Нет «голого» hardcoded RU-only chrome.

### 043 — Payload localization контента

- **Статус:** todo
- **Цель:** Контент на трёх языках.
- **Deliverables:** Localized fields Articles/Notes/Pages/Categories/Tags; fallback policy.
- **Verify:** Одна сущность с uk+ru+en полями.
- **DoD:** Редактор заполняет локали осознанно.

### 044 — Language switcher

- **Статус:** todo
- **Цель:** UX переключения.
- **Deliverables:** Switcher в header; сохранение пути.
- **Verify:** Playwright переключает локаль на той же логической странице.
- **DoD:** Switcher доступен на ключевых страницах.

### 045 — i18n ADR + tests

- **Статус:** todo
- **Цель:** Зафиксировать fallback и missing translation behavior.
- **Deliverables:** ADR; unit tests fallback.
- **Verify:** Missing locale не роняет 500.
- **DoD:** Политика i18n явная.

---

# Track 5 — Public site (дизайн и страницы)

### 046 — Design tokens + shadcn init

- **Статус:** todo
- **Цель:** Элегантная база UI.
- **Deliverables:** Tailwind theme, CSS variables, shadcn components set, typography scale.
- **Verify:** Story/smoke page в light/dark выглядит цельно.
- **DoD:** Дизайн-система зафиксирована (короткий `docs/design-principles.md`).

### 047 — Dark / light theme

- **Статус:** todo
- **Цель:** Обязательная тёмная тема.
- **Deliverables:** `next-themes`, toggle, no FOUC strategy.
- **Verify:** Toggle сохраняет preference; оба режима читабельны.
- **DoD:** Theme — first-class UX.

### 048 — Layout: header / footer / nav

- **Статус:** todo
- **Цель:** Каркас всех публичных страниц.
- **Deliverables:** Locale-aware nav: лента, категории, notes, articles, about, auth links.
- **Verify:** Responsive + a11y landmarks.
- **DoD:** Единый chrome сайта.

### 049 — Home page

- **Статус:** todo
- **Цель:** Витрина автора.
- **Deliverables:** Hero с именем автора, последние статьи/заметки, сильная типографика (не «dashboard»).
- **Verify:** Playwright screenshot smoke; Lighthouse sanity optional.
- **DoD:** Первый viewport — одна композиция, brand = имя автора.

### 050 — Лента (mixed feed)

- **Статус:** todo
- **Цель:** Общая лента notes + articles.
- **Deliverables:** Pagination, type badges, dates.
- **Verify:** Published items видны; drafts нет.
- **DoD:** Лента — основной browsing mode.

### 051 — Articles list + detail

- **Статус:** todo
- **Цель:** Полноценные статьи.
- **Deliverables:** List/filter; detail с Lexical render, hero, meta.
- **Verify:** Slug route; 404 на unknown.
- **DoD:** Article reading UX готов (TOC/related — Track 7 добьют).

### 052 — Notes list + detail

- **Статус:** todo
- **Цель:** Короткие мысли отдельным разделом.
- **Deliverables:** `/notes` list + detail; визуально легче articles.
- **Verify:** Note не смешивается с article URL namespace.
- **DoD:** Два формата различимы в IA.

### 053 — Categories / tags browsing

- **Статус:** todo
- **Цель:** Навигация по структуре.
- **Deliverables:** Category pages; tag pages; filters.
- **Verify:** Фильтр сужает ленту корректно.
- **DoD:** Таксономия публично usable.

### 054 — About + Contact-ish page

- **Статус:** todo
- **Цель:** Страница автора из CMS Pages.
- **Deliverables:** Render Page by slug; optional simple contact mailto (без newsletter).
- **Verify:** Контент из Payload отображается.
- **DoD:** About не захардкожен навсегда без CMS.

### 055 — Empty / error / loading states

- **Статус:** todo
- **Цель:** Взрослый UX краевых случаев.
- **Deliverables:** 404, 500, empty feed, loading skeletons.
- **Verify:** Playwright 404 page.
- **DoD:** Нет «белого экрана» на типовых ошибках.

### 056 — Public site Playwright visual/interaction suite

- **Статус:** todo
- **Цель:** Регрессия разметки и кликов.
- **Deliverables:** E2E nav, theme toggle, open article/note.
- **Verify:** Suite green.
- **DoD:** Дизайн-критичные flows под контролем.

---

# Track 6 — Reader features

### 057 — Comments UI

- **Статус:** todo
- **Цель:** Комментирование авторизованными.
- **Deliverables:** List + form на Article/Note; login CTA для anonymous.
- **Verify:** Anonymous не отправит; reader отправит; видно на странице.
- **DoD:** Comments product-complete для v1.

### 058 — Comment moderation basics

- **Статус:** todo
- **Цель:** Admin может скрыть токсичное.
- **Deliverables:** Hide/approve в admin или flag; публичка уважает статус.
- **Verify:** Hidden comment не виден readers.
- **DoD:** Минимальный контроль без сложного workflow.

### 059 — Bookmarks UI

- **Статус:** todo
- **Цель:** Сохранение статей/заметок.
- **Deliverables:** Toggle bookmark; страница «Мои закладки».
- **Verify:** Toggle idempotent; список только свои.
- **DoD:** Bookmarks usable end-to-end.

### 060 — Reader account page (minimal)

- **Статус:** todo
- **Цель:** Профиль/безопасность базовая.
- **Deliverables:** Email display, logout, link reset password.
- **Verify:** Reader меняет сессию осознанно.
- **DoD:** Аккаунт не «дыра» без страницы.

### 061 — Reader features e2e + unit

- **Статус:** todo
- **Цель:** Регрессия.
- **Deliverables:** Playwright comments/bookmarks; Vitest access.
- **Verify:** Green CI.
- **DoD:** Reader track закрыт тестами.

---

# Track 7 — Discovery & SEO

### 062 — Reading time

- **Статус:** todo
- **Цель:** Meta для статей.
- **Deliverables:** Вычисление на save/render; отображение на UI.
- **Verify:** Unit test формулы; UI показывает значение.
- **DoD:** Reading time must-have закрыт.

### 063 — Table of contents

- **Статус:** todo
- **Цель:** Навигация по длинным статьям.
- **Deliverables:** TOC из heading nodes Lexical; anchor links.
- **Verify:** Клик скроллит к секции.
- **DoD:** TOC на articles (notes — по эвристике длины).

### 064 — Code highlighting

- **Статус:** todo
- **Цель:** Читаемые code blocks.
- **Deliverables:** Shiki (или выбранный highlighter) в render pipeline; dark/light themes.
- **Verify:** Fenced code в статье подсвечен.
- **DoD:** Code UX взрослый.

### 065 — Related content

- **Статус:** todo
- **Цель:** Удержание читателя.
- **Deliverables:** Related by tags/categories; блок в конце.
- **Verify:** Related не включает текущий пост; только published.
- **DoD:** Related must-have закрыт.

### 066 — Simple search (Postgres)

- **Статус:** todo
- **Цель:** Поиск без внешнего сервиса.
- **Deliverables:** Search page/API; `tsvector` или аккуратный `ILIKE`; locale-aware.
- **Verify:** Query находит title/body; пустой query UX ok.
- **DoD:** Поиск v1 достаточен.

### 067 — Sitemap

- **Статус:** todo
- **Цель:** Индексация.
- **Deliverables:** `sitemap.xml` (все локали + published URLs).
- **Verify:** XML валиден; drafts отсутствуют.
- **DoD:** Sitemap в production checklist.

### 068 — RSS feeds

- **Статус:** todo
- **Цель:** Подписка на обновления.
- **Deliverables:** RSS/Atom на articles, notes, optional all; per-locale strategy.
- **Verify:** Feed валиден; новые посты появляются.
- **DoD:** RSS must-have закрыт.

### 069 — Open Graph images

- **Статус:** todo
- **Цель:** Превью в соцсетях.
- **Deliverables:** OG image generation (Next Image Response) или static template + hero fallback.
- **Verify:** `og:image` meta присутствует; URL отдаёт image.
- **DoD:** OG must-have закрыт.

### 070 — JSON-LD structured data

- **Статус:** todo
- **Цель:** Rich results readiness.
- **Deliverables:** Article/Person/WebSite schema; locale-aware URLs.
- **Verify:** JSON-LD валиден (smoke parser test).
- **DoD:** JSON-LD must-have закрыт.

### 071 — Metadata API completeness

- **Статус:** todo
- **Цель:** title/description/canonical на всех ключевых страницах.
- **Deliverables:** Per-page metadata; no duplicates titles.
- **Verify:** Spot-check Playwright meta tags.
- **DoD:** SEO foundation complete.

### 072 — SEO checklist doc

- **Статус:** todo
- **Цель:** Операционный чеклист.
- **Deliverables:** `docs/seo-checklist.md`.
- **Verify:** Пункты соответствуют факту в коде.
- **DoD:** SEO задокументирован.

---

# Track 8 — Security & abuse prevention

### 073 — Security headers

- **Статус:** todo
- **Цель:** Базовый hardening HTTP.
- **Deliverables:** Next headers / middleware: CSP (поэтапно), frame guard, referrer, permissions.
- **Verify:** securityheaders-like smoke; app не ломается.
- **DoD:** Headers включены в prod.

### 074 — Rate limiting (auth + comments + reset)

- **Статус:** todo
- **Цель:** Защита от brute force и spam.
- **Deliverables:** Limiter (Vercel KV/Upstash free или middleware strategy); ADR.
- **Verify:** Превышение лимита → 429.
- **DoD:** Чувствительные endpoints ограничены.

### 075 — Cloudflare Turnstile

- **Статус:** todo
- **Цель:** Bot protection free tier.
- **Deliverables:** Turnstile на register/login/comment; server verify.
- **Verify:** Без токена форма не проходит; с токеном — проходит.
- **DoD:** Bot shield на ключевых формах.

### 076 — Dependabot + secret scanning

- **Статус:** todo
- **Цель:** Supply-chain hygiene.
- **Deliverables:** Dependabot config; GitHub secret scanning enabled (doc); ignore policy.
- **Verify:** Dependabot PR появляется на тестовом bump или конфиг валиден.
- **DoD:** Автообновления уязвимостей включены.

### 077 — Threat model stub

- **Статус:** todo
- **Цель:** Осознанные риски.
- **Deliverables:** `docs/security/threat-model.md` (auth, XSS via Lexical, R2, comments spam).
- **Verify:** Контрмеры ссылаются на шаги Track 8.
- **DoD:** Threat model существует и актуален для v1.

### 078 — Security checklist

- **Статус:** todo
- **Цель:** Pre-launch gate.
- **Deliverables:** `docs/security/checklist.md`.
- **Verify:** Все must-пункты закрыты или явно waived.
- **DoD:** Security track формально закрыт.

---

# Track 9 — Legal, consent, email prod

### 079 — Privacy page

- **Статус:** todo
- **Цель:** Политика конфиденциальности.
- **Deliverables:** CMS Page + публичный route всех локалей (контент можно шаблонно «по приколу», но честно про cookies/analytics/auth).
- **Verify:** Страница доступна из footer.
- **DoD:** Privacy online.

### 080 — Terms page

- **Статус:** todo
- **Цель:** Условия использования.
- **Deliverables:** Аналогично Privacy.
- **Verify:** Footer link.
- **DoD:** Terms online.

### 081 — Cookie consent banner

- **Статус:** todo
- **Цель:** Согласие под Analytics/cookies.
- **Deliverables:** Лёгкий banner; persist choice; Analytics грузится по политике.
- **Verify:** До согласия analytics не стреляет (если так решено); отказ уважается.
- **DoD:** Consent UX есть.

### 082 — Resend production verification

- **Статус:** todo
- **Цель:** Письма в real prod.
- **Deliverables:** Domain/DNS notes (даже если пока onboarding domain Resend); runbook.
- **Verify:** Reset password на preview/prod получает письмо.
- **DoD:** Email path проверен вне localhost.

---

# Track 10 — Quality engineering

### 083 — Unit test policy

- **Статус:** todo
- **Цель:** Что обязательно покрываем.
- **Deliverables:** `docs/testing.md` (helpers, access, search, reading time, i18n fallback).
- **Verify:** Политика согласована с CI.
- **DoD:** Команда (ты+агент) знает минимальный coverage expectation.

### 084 — Expand Vitest suite

- **Статус:** todo
- **Цель:** Закрыть пробелы домена.
- **Deliverables:** Тесты на helpers, serializers, access, search query builder.
- **Verify:** Coverage критичных модулей без погони за %.
- **DoD:** Нет бизнес-логики «только в голове».

### 085 — Playwright design & a11y smoke

- **Статус:** todo
- **Цель:** Разметка и a11y.
- **Deliverables:** axe smoke на home/article/login; landmark checks.
- **Verify:** Critical a11y violations = fail.
- **DoD:** A11y floor установлен.

### 086 — CI: e2e in pipeline

- **Статус:** todo
- **Цель:** E2E на PR.
- **Deliverables:** GitHub Actions job Playwright (+ cache browsers); артефакты при fail.
- **Verify:** PR показывает e2e check.
- **DoD:** E2E — обязательный gate (или явный shard strategy).

### 087 — Test data factories

- **Статус:** todo
- **Цель:** Стабильные тесты.
- **Deliverables:** Factories для user/article/note/comment.
- **Verify:** E2E не зависят от ручного seed в UI.
- **DoD:** Тесты hermetic насколько возможно.

---

# Track 11 — CI/CD, versioning, environments

### 088 — Vercel project connect

- **Статус:** todo
- **Цель:** Deploy pipeline.
- **Deliverables:** Vercel ↔ GitHub; env production; build settings; docs.
- **Verify:** Push/PR создаёт deployment.
- **DoD:** Хостинг подключён.

### 089 — Preview Deployments на каждый PR

- **Статус:** todo
- **Цель:** Проверка дизайна и взаимодействий на URL.
- **Deliverables:** Preview env vars strategy; ограничения БД задокументированы.
- **Verify:** PR комментарий/UI со ссылкой на preview.
- **DoD:** Preview must-have включён.

### 090 — Production Neon

- **Статус:** todo
- **Цель:** Одна prod БД без лишней сложности.
- **Deliverables:** Neon project; `DATABASE_URL` в Vercel; migrations on deploy strategy.
- **Verify:** Prod admin логинится; данные пишутся.
- **DoD:** Neon prod жив.

### 091 — Vercel Postgres adapter in prod

- **Статус:** todo
- **Цель:** Оптимальный DB driver path на Vercel.
- **Deliverables:** `@payloadcms/db-vercel-postgres` в prod config.
- **Verify:** Serverless functions стабильно коннектятся.
- **DoD:** Prod DB adapter корректный.

### 092 — Secrets matrix doc

- **Статус:** todo
- **Цель:** Где какой секрет лежит.
- **Deliverables:** `docs/runbooks/secrets.md` (Vercel + GitHub Actions).
- **Verify:** Все ключи из `.env.example` размечены.
- **DoD:** Секреты управляемы.

### 093 — Conventional Commits

- **Статус:** todo
- **Цель:** Чистая история.
- **Deliverables:** Commitlint или documented convention + PR template hint.
- **Verify:** Плохой commit message ловится (hook или CI).
- **DoD:** Convention enforced.

### 094 — Changesets

- **Статус:** todo
- **Цель:** Версии и changelog.
- **Deliverables:** Changesets setup; release script; `CHANGELOG.md` policy.
- **Verify:** changeset file → version bump flow documented.
- **DoD:** Релизы не «из головы».

### 095 — Release policy

- **Статус:** todo
- **Цель:** Как катим в production.
- **Deliverables:** `docs/release-policy.md` (main = prod, PR checks required).
- **Verify:** Согласовано с branch protection notes.
- **DoD:** Релизный процесс явный.

### 096 — Branch protection notes

- **Статус:** todo
- **Цель:** Защита main.
- **Deliverables:** Doc checklist: required checks, no direct push (насколько GitHub free позволяет).
- **Verify:** Список шагов для ручной настройки GitHub.
- **DoD:** Защита main описана и выполнима.

---

# Track 12 — Ops, backups, observability, seed

### 097 — Vercel Analytics

- **Статус:** todo
- **Цель:** Продуктовая аналитика.
- **Deliverables:** Analytics package; consent-aware load; docs.
- **Verify:** События видны в Vercel dashboard на prod.
- **DoD:** Analytics подключена.

### 098 — Logging baseline

- **Статус:** todo
- **Цель:** Диагностика без тяжёлого стека.
- **Deliverables:** Consistent `console`/logger wrapper; request id optional; что смотреть в Vercel Logs — в runbook.
- **Verify:** Ошибка auth/comment видна в logs.
- **DoD:** Logs usable.

### 099 — Optional Sentry (free)

- **Статус:** todo
- **Цель:** Errors если подключается легко.
- **Deliverables:** Sentry Next SDK **или** явный ADR «waive until needed» с критериями включения.
- **Verify:** Test error появляется в Sentry **или** waive задокументирован.
- **DoD:** Решение по Sentry зафиксировано (не серое пятно).

### 100 — Neon backup policy

- **Статус:** todo
- **Цель:** Подстраховка данных.
- **Deliverables:** `docs/runbooks/backup-neon.md` (pit/export/snapshot по возможностям Free; периодичность; restore drill).
- **Verify:** Хотя бы один restore drill на копии.
- **DoD:** Backup не «потом когда-нибудь».

### 101 — R2 backup / retention notes

- **Статус:** todo
- **Цель:** Медиа не потерять молча.
- **Deliverables:** `docs/runbooks/backup-r2.md` (versioning если доступно, периодический sync/export strategy).
- **Verify:** Процедура воспроизводима.
- **DoD:** R2 risk accepted осознанно с планом.

### 102 — Seed + faker

- **Статус:** todo
- **Цель:** Богатая локалка.
- **Deliverables:** Seed script: admin, readers, categories, tags, articles, notes, comments, bookmarks; faker; npm script.
- **Verify:** Чистая БД → seed → сайт полон контента.
- **DoD:** Demo data воспроизводимы.

### 103 — Ops runbook index

- **Статус:** todo
- **Цель:** Одна точка входа в ops docs.
- **Deliverables:** `docs/runbooks/README.md`.
- **Verify:** Ссылки живые.
- **DoD:** Ops docs навигируемы.

---

# Track 13 — Performance & launch polish

### 104 — Caching / ISR strategy

- **Статус:** todo
- **Цель:** Быстрые публичные страницы, меньше давления на Neon.
- **Deliverables:** ADR cache tags/revalidate; on-demand revalidation при publish.
- **Verify:** Published update отражается после revalidate; TTFB приемлем на preview.
- **DoD:** Кеш-стратегия явная.

### 105 — Image performance

- **Статус:** todo
- **Цель:** Быстрые картинки.
- **Deliverables:** next/image или R2 URLs + sizes; lazy loading.
- **Verify:** LCP hero не катастрофический на article page.
- **DoD:** Медиа не убивает UX.

### 106 — Bundle / route performance pass

- **Статус:** todo
- **Цель:** Убрать лишний JS на публичке.
- **Deliverables:** Audit heavy client components; dynamic import where needed.
- **Verify:** Нет очевидных гигантов на home.
- **DoD:** Performance pass отмечен в checklist.

### 107 — Content readiness for go-live

- **Статус:** todo
- **Цель:** Реальные страницы автора.
- **Deliverables:** About, Privacy, Terms заполнены; 1–2 starter articles/notes (или явный empty-state ок).
- **Verify:** Prod контент не «Lorem» на ключевых страницах (кроме осознанного demo).
- **DoD:** Сайт можно показывать людям.

### 108 — Production checklist

- **Статус:** todo
- **Цель:** Финальный gate.
- **Deliverables:** `docs/production-checklist.md` (env, OAuth redirect URIs, Resend, R2 public access, analytics, backups, CI green).
- **Verify:** Все пункты checked.
- **DoD:** Чеклист пройден.

### 109 — Go-live на `*.vercel.app`

- **Статус:** todo
- **Цель:** Публичный launch v1.
- **Deliverables:** Production deploy; smoke auth/content/comments; запись в README «Live URL».
- **Verify:** Внешний URL проходит smoke checklist.
- **DoD:** **v1 в production**.

### 110 — Post-launch notes (custom domain later)

- **Статус:** todo
- **Цель:** Не забыть следующий горизонт.
- **Deliverables:** `docs/post-v1.md` — custom domain, R2 CDN domain, MFA, audit log, search upgrade и т.д.
- **Verify:** Список не смешивается с открытыми v1 todo.
- **DoD:** Граница v1/v1.1 ясна.

---

# Track 14 — Documentation completeness (сквозной, можно параллелить)

Документация «чем больше, тем лучше» — отдельные явные шаги, чтобы не потерять.

### 111 — README deep pass

- **Статус:** todo
- **Цель:** README = карта проекта.
- **Deliverables:** Архитектура, quickstart, links to all docs, Live URL.
- **Verify:** Новый человек ориентируется за 5 минут.
- **DoD:** README полный.

### 112 — Architecture overview

- **Статус:** todo
- **Цель:** Картинка системы.
- **Deliverables:** `docs/architecture.md` (диаграммы Vercel/Neon/R2/Auth).
- **Verify:** Согласовано с tech-stack.
- **DoD:** Архитектура описана вне кода.

### 113 — ADR index

- **Статус:** todo
- **Цель:** Навигация по решениям.
- **Deliverables:** `docs/adr/README.md` + все ADR из треков.
- **Verify:** Нет «сиротских» решений только в чатах.
- **DoD:** ADR-практика жива.

### 114 — Glossary

- **Статус:** todo
- **Цель:** Article vs Note, reader vs admin, preview vs draft.
- **Deliverables:** `docs/glossary.md`.
- **Verify:** Термины совпадают с UI.
- **DoD:** Общий язык зафиксирован.

### 115 — Final docs audit

- **Статус:** todo
- **Цель:** Перед закрытием v1 сверить docs ↔ код.
- **Deliverables:** Список расхождений = 0 или tickets в post-v1.
- **Verify:** Аудит-чекбокс в production checklist.
- **DoD:** Документация не врёт.

---

## Сводная таблица треков

| Track | Тема | Шаги |
| --- | --- | --- |
| 0 | Foundation | 001–014 |
| 1 | Content model | 015–024 |
| 2 | Auth | 025–032 |
| 3 | Admin CMS & media | 033–040 |
| 4 | i18n | 041–045 |
| 5 | Public site | 046–056 |
| 6 | Reader features | 057–061 |
| 7 | Discovery & SEO | 062–072 |
| 8 | Security | 073–078 |
| 9 | Legal & email | 079–082 |
| 10 | Quality | 083–087 |
| 11 | CI/CD & envs | 088–096 |
| 12 | Ops & seed | 097–103 |
| 13 | Performance & launch | 104–110 |
| 14 | Documentation | 111–115 |

**Всего шагов v1:** 115.

---

## Порядок работы (рекомендуемая последовательность треков)

```text
0 Foundation
  → 1 Content model
    → 2 Auth ∥ 3 Admin/media (после Users/Media)
      → 4 i18n
        → 5 Public site
          → 6 Reader features
            → 7 SEO/discovery
              → 8 Security ∥ 9 Legal/email
                → 10 Quality (наращивать с Track 0, закрыть здесь)
                  → 11 CI/CD (Vercel можно поднять раньше с 088; полностью закрыть здесь)
                    → 12 Ops/seed
                      → 13 Launch
                        → 14 Docs audit
```

Track 14 можно заполнять параллельно с 0–13. Vercel Preview (088–089) имеет смысл включить сразу после стабильного build, не дожидаясь конца контента.

---

## Как обновлять статусы

После завершения шага:

1. Поставь `done` в заголовке шага.
2. Обнови **Baseline Status** вверху (номер следующего `todo`).
3. Если появился новый must-have — добавь шаг в конец трека с новым номером, не переписывая историю done-шагов без нужды.

---

## Вне роадмапа v1 (напоминание)

См. также out of scope в [`tech-stack.md`](./tech-stack.md): MFA, multi-author, платный контент, Meilisearch, upload видео в R2, CMS versioning, custom domain (после 110).
