# Локальный запуск

Повторяемый onboarding: с нуля поднять app, Postgres и первый admin без устных пояснений.

## Предпосылки

| Инструмент | Версия / заметка                                  |
| ---------- | ------------------------------------------------- |
| Node.js    | `^24` (см. `engines` в `package.json`)            |
| npm        | `>=10`                                            |
| Docker     | Docker Desktop или Docker Engine + Compose plugin |

Проверка:

```bash
node -v
npm -v
docker compose version
```

## 1. Clone и зависимости

```bash
git clone <repo-url> blog
cd blog
npm ci
```

Если `package-lock.json` ещё нет или вы сознательно обновляете дерево зависимостей — `npm install`.

## 2. Переменные окружения

```bash
cp .env.example .env
```

Заполните минимум для локального старта:

| Переменная               | Назначение                                                          |
| ------------------------ | ------------------------------------------------------------------- |
| `DATABASE_URL`           | Postgres (значение по умолчанию совпадает с Docker Compose)         |
| `PAYLOAD_SECRET`         | Длинная случайная строка для сессий/токенов Payload                 |
| `PREVIEW_SECRET`         | Секрет кнопки Preview в admin (draftMode); длинная случайная строка |
| `NEXT_PUBLIC_SERVER_URL` | Публичный origin app, обычно `http://localhost:3000`                |

Остальные ключи в `.env.example` (R2, Resend, Google OAuth, Turnstile, `ADMIN_*`) для минимального локального старта можно оставить пустыми или как в примере. Реальные секреты не коммитьте. Без `PREVIEW_SECRET` кнопка Preview в admin скрыта (URL не генерируется).

### Auth email (verify / password reset)

| Режим     | Условие                                | Поведение                                                                            |
| --------- | -------------------------------------- | ------------------------------------------------------------------------------------ |
| Local     | `RESEND_API_KEY` пустой                | Console adapter — HTML письма в лог `npm run dev`                                    |
| Prod-like | `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | [`@payloadcms/email-resend`](https://www.npmjs.com/package/@payloadcms/email-resend) |

После регистрации откройте `/uk/verify?token=…` из лога (или письма Resend). Без verify логин reader’а отклоняется.

### Google OAuth (optional)

См. [`google-oauth-setup.md`](./google-oauth-setup.md). Без `GOOGLE_CLIENT_ID` кнопка на `/uk/login` скрыта.

Канон имён переменных — [`.env.example`](../.env.example).

## 3. Postgres (Docker)

```bash
docker compose up -d
docker compose ps
```

Сервис `postgres` должен быть `healthy`. Подробности credentials, остановки и сброса volume — [`local-postgres.md`](./local-postgres.md).

## 4. Миграции

На чистой локальной БД примените схему явно:

```bash
npm run migrate:status
npm run migrate
```

В development Payload также может подтягивать схему через Drizzle push. Для проверки «с нуля» и для shared/prod используйте migrate. Политика — [`adr/001-migrations-policy.md`](./adr/001-migrations-policy.md).

## 5. Запуск приложения

```bash
npm run dev
```

Ожидаемо:

- сайт: [http://localhost:3000/uk](http://localhost:3000/uk) (`/` редиректит на `/uk`, ADR-004)
- admin: [http://localhost:3000/admin](http://localhost:3000/admin)

Production-like локально: `npm run build` затем `npm start`.

## 6. Admin bootstrap

Рекомендуемый путь (шаг **040**): seed из env после migrate.

В `.env` задайте реальные значения (не оставляйте password `replace-me` из `.env.example`):

| Переменная       | Назначение                           |
| ---------------- | ------------------------------------ |
| `ADMIN_EMAIL`    | Email первого admin                  |
| `ADMIN_PASSWORD` | Пароль (не placeholder `replace-me`) |

```bash
npm run migrate
npm run seed:admin
```

Ожидание: лог `seed:admin — created admin …` при первой чистой БД. Повторный запуск — `skip` (уже есть admin или тот же email). Hook Users выставляет `_verified: true` для admin.

Fallback без seed: первый заход на `/admin` → форма create-first-user (тоже получит `role: admin`).

Роли (`admin` | `reader`): только `admin` проходит в `/admin`. Публичная регистрация: `/uk/register` → verify email → `/uk/login`. Reader на `/admin` получает отказ.

Полезные URL: `/uk/login`, `/uk/register`, `/uk/forgot-password`, `/uk/reset-password`, `/uk/verify`, `/uk/logout`. Те же пути с префиксом `/ru` или `/en`. Голые `/login` и `/` редиректят на default locale `uk`. Матрица доступа — [`security/access-matrix.md`](./security/access-matrix.md).

Unit helpers: `npm test` → `tests/unit/adminSeed.test.ts`.

### Admin UX smoke checklist (шаг 033)

Цель: один admin создаёт Article за короткий путь кликов; сайдбар сгруппирован и подписан (не «сырой» slug-scaffold).

Предусловия: `docker compose up -d`, `.env`, `npm run migrate`, `npm run dev`, admin из §6.

| #   | Действие                                                                  | Ожидание                                                                                                                             |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Открыть [http://localhost:3000/admin](http://localhost:3000/admin), войти | Dashboard; title вкладки с суффиксом `— Blog Admin`                                                                                  |
| 2   | Посмотреть левый сайдбар                                                  | Группы **Content / Taxonomy / Community / System** (или RU: Контент / Таксономия / Сообщество / Система — зависит от языка admin UI) |
| 3   | Content → **Articles** (Статьи) → Create New                              | Форма edit; description коллекции видна                                                                                              |
| 4   | Заполнить `title`, `body` (Lexical)                                       | Slug подставится из title (hook)                                                                                                     |
| 5   | Save Draft                                                                | Документ в `_status: draft`                                                                                                          |
| 6   | Publish                                                                   | `_status: published`; запись в списке Articles с колонками title / slug / status / publishedAt                                       |

Бюджет кликов (после login): **сайдбар Articles → Create → title/body → Save Draft → Publish** ≈ 5–6 осознанных действий. Lexical images / YouTube — шаг **034**; preview URL — **035**.

## 7. Seed (placeholder)

| Что             | Сейчас                                                    | Позже                 |
| --------------- | --------------------------------------------------------- | --------------------- |
| Admin user      | `npm run seed:admin` (`ADMIN_*`) или UI create-first-user | —                     |
| Контент / faker | Пустая БД                                                 | Track 12 (ops & seed) |

Для onboarding: migrate → `seed:admin` → `npm run dev` → `/admin` с `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## 8. Media (локальный disk или R2)

В `/admin` → **Media** можно загрузить изображение (JPEG / PNG / WebP / GIF). Поле `alt` обязательно.

| Параметр | Значение                                                                   |
| -------- | -------------------------------------------------------------------------- |
| Локально | Если `R2_*` пустые → папка `media/` в корне репо (gitignored)              |
| R2       | Если заданы все `R2_*` → Cloudflare R2 через `@payloadcms/storage-s3`      |
| MIME in  | `image/jpeg`, `image/png`, `image/webp`, `image/gif`                       |
| Хранение | На upload оригинал конвертируется в **WebP** (`formatOptions`, quality 80) |
| Max size | 5 MiB (`MEDIA_MAX_FILE_SIZE` в `src/collections/mediaLimits.ts`)           |

Env (уже в `.env.example`): `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_PUBLIC_URL`, опционально `R2_REGION=auto`.

Проверка без R2: Media + JPEG/PNG + `alt` → в `media/` файл `.webp`, в admin `mimeType: image/webp`.  
Проверка с R2: см. runbook [`runbooks/r2-media.md`](./runbooks/r2-media.md); объект в bucket тоже WebP.  
GIF → WebP: анимация не гарантируется.

**Access (шаг 039):** create/update/delete Media — только `admin`. Reader/anonymous upload через API → отказ.  
Unit (без БД): `npm test` → `tests/unit/mediaAccess.test.ts`.  
Int (нужен Postgres: `docker compose up -d`): `npm run test:int` → `tests/int/media.int.spec.ts`.

## 9. Categories и Tags (таксономия)

В `/admin` доступны коллекции **Categories** и **Tags**. Поля `title` и `slug` **локализованы** (`uk` / `ru` / `en`; default locale — `uk`, `fallback: true` — пустая локаль тянет `uk`).

| Параметр | Значение                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------- |
| Write    | Только `admin` (create / update / delete)                                                                 |
| Read     | Публичный (`read: true`) — для будущего browse                                                            |
| Slug     | Уникален **в пределах локали**; если пуст при сохранении — генерируется из `title` (`src/lib/slugify.ts`) |

Проверка:

1. Войдите в `/admin` как admin.
2. **Categories** → Create: заполните `title` (например «Інженерія»), оставьте `slug` пустым → Save. Ожидание: slug вроде `inzheneriya`.
3. Переключите locale в admin на `en`, задайте English title/slug → Save. То же для `ru`, если нужен перевод.
4. То же для **Tags**.
5. Reader (если создан) не должен иметь write-доступ к этим коллекциям.

Редактура (шаг **043**): переключатель locale в admin заполняет **ту же** запись, не создаёт вторую. Незаполненная локаль на сайте/preview отдаёт `uk` (Payload fallback), а не пустой заголовок.

Relation к Articles/Notes — шаги **018** / **019** (оба done). Unit-тесты slugify/access — **024** (done): `npm test`.

## 10. Articles

В `/admin` доступна коллекция **Articles** (развёрнутые статьи).

| Параметр | Значение                                                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Write    | Только `admin` (create / update / delete)                                                                                                                                                         |
| Read     | Admin — все; иначе published + `publishedAt` не в будущем (ADR-003)                                                                                                                               |
| Поля     | `title` / `slug` (localized, slug auto из title), Lexical `body` (localized), `heroImage` → Media, `categories` / `tags`, `publishedAt`, группа `seo` (`metaTitle`, `metaDescription`, `ogImage`) |
| Drafts   | `versions.drafts` — Save Draft / Publish в admin                                                                                                                                                  |
| Локали   | `uk` / `ru` / `en`; пустая локаль → fallback на `uk` (см. `content-model.md`, шаг **043**)                                                                                                        |

Проверка:

1. Войдите в `/admin` как admin.
2. При необходимости создайте Category/Tag и загрузите Media (hero).
3. **Articles** → Create в locale `uk`: заполните `title`, оставьте `slug` пустым, наберите `body` → **Save Draft**. Ожидание: документ в статусе draft, slug заполнен.
4. Переключите locale на `ru`, затем `en`: задайте свои `title` / `slug` / `body` (и SEO text) → Save на каждой локали. Обложка, categories/tags, `publishedAt` — общие.
5. **Publish** ту же статью; при желании задайте `publishedAt` и SEO.
6. Preview по префиксу: `/uk/dev/rich-text/article/<slug>`, `/ru/...`, `/en/...` — разные заголовки/тело при заполненных локалях.
7. Reader / anonymous не должны видеть drafts через API (`read` фильтрует `_status`); write — только admin.

### Lexical: image + YouTube (шаг 034)

В `body` доступны вставка изображения (Media) и блок **YouTube**.

1. В edit Article: в Lexical toolbar / slash menu → **Upload** (или Insert upload) → выберите/загрузите Media → Save.
2. Slash / Blocks → **YouTube** → вставьте URL вида `https://www.youtube.com/watch?v=…` или `https://youtu.be/…` → Save / Publish.
3. Невалидный URL (не YouTube) отклоняется валидатором поля.
4. Временный публичный smoke (до Track 5): откройте  
   `http://localhost:3000/uk/dev/rich-text/article/{slug}`  
   для **published** статьи — ожидайте картинку и iframe `youtube-nocookie`. Draft без preview mode → 404.

Unit sanitize: `npm test` → `tests/unit/youtube.test.ts`. Продуктовые article routes — **051**.

### Draft Preview (шаг 035)

Редакционный цикл draft → Preview без публикации.

Предусловия: `PREVIEW_SECRET` в `.env` (см. `.env.example`), admin залогинен в `/admin` (та же сессия/cookies).

1. Создайте Article (или Note / Page) → **Save Draft** (не Publish).
2. В edit view нажмите **Preview** — откроется `/next/preview?...` → redirect на `/dev/rich-text/article/{slug}` (или note/page), затем proxy добавит default locale: `/uk/dev/rich-text/...`.
3. Ожидание: баннер «Draft preview», контент черновика, `Status: draft`.
4. Incognito / без cookies admin: тот же `/uk/dev/rich-text/article/{slug}` → **404** (draft не публичный).
5. `/next/preview` с неверным `previewSecret` или без admin session → **403**.
6. `/next/exit-preview` → выход из draftMode, redirect на `/`, затем на `/uk`.

Unit allowlist: `npm test` → `tests/unit/previewPaths.test.ts`.

### Scheduled publish (шаг 036)

Отложенная видимость без cron (ADR-003): Publish + будущий `publishedAt` → скрыто для anonymous до наступления времени.

1. Article → Publish, в sidebar `publishedAt` поставьте **завтра** (или +1 час) → Save.
2. Incognito / без admin: `http://localhost:3000/uk/dev/rich-text/article/{slug}` → **404**; `GET /api/articles` не возвращает этот doc.
3. В admin тот же документ виден; Preview (035) тоже показывает.
4. Смените `publishedAt` на прошлое (или очистите и Publish снова — hook проставит `now`) → публичный URL / API отдают документ.
5. Publish без `publishedAt`: после сохранения поле заполнено текущим временем.

Unit: `npm test` → visibility / `publishedOrAdmin` / `applyPublishedAtOnPublish`.

## 11. Notes

В `/admin` доступна коллекция **Notes** (короткие мысли, отдельный формат от Articles).

| Параметр | Значение                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Write    | Только `admin` (create / update / delete)                                                                                                                          |
| Read     | Admin — все; иначе published + `publishedAt` не в будущем (ADR-003)                                                                                                |
| Поля     | `title` / `slug` (localized, slug auto из title), Lexical `body` (localized, short-form), `categories` / `tags`, `publishedAt`, группа `seo` — **без** `heroImage` |
| Drafts   | `versions.drafts` — Save Draft / Publish в admin                                                                                                                   |
| API      | Collection slug `notes` → REST `/api/notes` (отдельно от `/api/articles`)                                                                                          |
| Локали   | `uk` / `ru` / `en`                                                                                                                                                 |

Проверка:

1. Войдите в `/admin` как admin.
2. **Notes** → Create: заполните `title`, оставьте `slug` пустым, короткий `body` → **Save Draft**. Ожидание: draft, slug заполнен.
3. **Publish** ту же заметку; при желании — `publishedAt`, categories/tags, SEO (`ogImage` вместо cover).
4. Сравните API: `GET /api/notes` и `GET /api/articles` — разные коллекции; draft note не виден anonymous.
5. Write — только admin.

Публичные роуты notes — шаг **052**. Draft Preview (кнопка в admin) — § выше (шаг **035**). Unit access/slugify — **024** (done).

## 12. Pages

В `/admin` доступна коллекция **Pages** (статические страницы: About, Privacy, Terms и т.п.).

| Параметр | Значение                                                                                                                                            |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Write    | Только `admin` (create / update / delete)                                                                                                           |
| Read     | Admin — все; иначе published + `publishedAt` не в будущем (ADR-003)                                                                                 |
| Поля     | `title` / `slug` (localized, slug auto из title), Lexical `body` (localized), `publishedAt`, группа `seo` — **без** categories / tags / `heroImage` |
| Drafts   | `versions.drafts` — Save Draft / Publish в admin                                                                                                    |
| API      | Collection slug `pages` → REST `/api/pages`                                                                                                         |
| Локали   | `uk` / `ru` / `en`                                                                                                                                  |

Проверка:

1. Войдите в `/admin` как admin.
2. **Pages** → Create: `title` = About (или любой), `slug` = `about` (или оставьте пустым для auto), наберите `body` → **Save Draft**. Ожидание: draft, slug заполнен.
3. **Publish** ту же страницу; при желании — `publishedAt`, SEO.
4. `GET /api/pages` — published pages видны; draft page не видна anonymous.
5. Write — только admin.

Публичный рендер page by slug — шаг **054**. Unit access/slugify — **024** (done).

## 13. Comments

В `/admin` доступна коллекция **Comments** (комментарии к Article или Note).

| Параметр        | Значение                                                                                                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create          | Любой authenticated (`reader` / `admin`); anonymous — отказ                                                                                                                 |
| Read            | Admin — все; иначе только `moderationStatus: approved`                                                                                                                      |
| Update / Delete | Только `admin` (модерация)                                                                                                                                                  |
| Поля            | `content` (polymorphic → `articles` \| `notes`), `author` (auto из session), `body` (textarea), `moderationStatus` (`approved` / `hidden`, default `approved`), `createdAt` |
| API             | Collection slug `comments` → REST `/api/comments`                                                                                                                           |

Проверка:

1. Войдите в `/admin` как admin (или создайте comment через Local API как reader — см. `npm run test:int`).
2. Убедитесь, что есть published Article или Note.
3. **Comments** → Create: выберите `content`, введите `body` → Save. `author` подставится из текущего пользователя; `moderationStatus` по умолчанию `approved`.
4. Anonymous create через API должен быть отклонён (интеграционный тест это фиксирует).

Публичный Comments UI — шаг **057**. Hide/approve в публичке — **058**. Unit для access helpers — **024** (done).

## 14. Bookmarks

В `/admin` доступна коллекция **Bookmarks** (закладки читателя на Article или Note).

| Параметр               | Значение                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| Create                 | Любой authenticated (`reader` / `admin`); anonymous — отказ                                          |
| Read / Update / Delete | Владелец документа (поле `user`) или `admin`                                                         |
| Поля                   | `user` (auto из session), `content` (polymorphic → `articles` \| `notes`), `createdAt` / `updatedAt` |
| Уникальность           | Пара `(user, content)` — повторный create отклоняется (409)                                          |
| API                    | Collection slug `bookmarks` → REST `/api/bookmarks`                                                  |

Проверка:

1. Войдите в `/admin` как admin (или создайте bookmark через Local API как reader — см. `npm run test:int`).
2. Убедитесь, что есть published Article или Note.
3. **Bookmarks** → Create: выберите `content` → Save. `user` подставится из текущего пользователя.
4. Повторное создание закладки тем же user на тот же content должно быть отклонено (интеграционный тест это фиксирует).
5. Anonymous create через API должен быть отклонён.

Публичный Bookmarks UI (toggle / «Мои закладки») — шаг **059**. Unit для uniqueness/access helpers — **024** (done).

## Полезные команды

```bash
npm run ci                 # lint + format:check + typecheck + unit tests (как в GitHub Actions)
npm run lint
npm run typecheck
npm test
npm run test:e2e:install   # один раз: браузеры Playwright
npm run test:e2e
```

Скрипты миграций: `migrate`, `migrate:create`, `migrate:status` (см. ADR выше).

## Troubleshooting

**Порт 5432 занят.** Остановите другой Postgres или смените mapping в `docker-compose.yml` и `DATABASE_URL`.

**Схема «поехала» после push / migrate.** Сбросьте volume и примените миграции заново:

```bash
docker compose down -v
docker compose up -d
npm run migrate
```

**Payload / сессии ломаются после смены секрета.** Задайте стабильный длинный `PAYLOAD_SECRET` в `.env` и перезапустите `npm run dev`.

**Контейнер не healthy.** `docker compose logs postgres` и проверка из [`local-postgres.md`](./local-postgres.md).
