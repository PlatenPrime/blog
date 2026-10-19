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

| Переменная               | Назначение                                                  |
| ------------------------ | ----------------------------------------------------------- |
| `DATABASE_URL`           | Postgres (значение по умолчанию совпадает с Docker Compose) |
| `PAYLOAD_SECRET`         | Длинная случайная строка для сессий/токенов Payload         |
| `NEXT_PUBLIC_SERVER_URL` | Публичный origin app, обычно `http://localhost:3000`        |

Остальные ключи в `.env.example` (R2, Resend, Google OAuth, Turnstile, `ADMIN_*`) для минимального локального старта можно оставить пустыми или как в примере. Реальные секреты не коммитьте.

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

- сайт: [http://localhost:3000](http://localhost:3000)
- admin: [http://localhost:3000/admin](http://localhost:3000/admin)

Production-like локально: `npm run build` затем `npm start`.

## 6. Admin bootstrap

Пока нет seed-скрипта (roadmap **040**): первый пользователь создаётся через Payload UI при первом заходе на `/admin` (форма create-first-user). Hook в Users выставляет ему `role: admin` автоматически.

Роли (`admin` | `reader`): только `admin` проходит в `/admin`. Чтобы проверить stub access — создайте второго user с `role: reader` и попробуйте войти им на `/admin` (ожидается отказ).

Переменные `ADMIN_EMAIL` и `ADMIN_PASSWORD` в `.env` зарезервированы под будущий bootstrap; сейчас они **не** создают пользователя автоматически.

## 7. Seed (placeholder)

| Что             | Сейчас             | Позже                           |
| --------------- | ------------------ | ------------------------------- |
| Admin user      | Вручную в `/admin` | Seed по `ADMIN_*` (шаг **040**) |
| Контент / faker | Пустая БД          | Track 12 (ops & seed)           |

Для текущего onboarding достаточно пустой БД после migrate и одного admin из UI.

## 8. Media (локальный disk)

В `/admin` → **Media** можно загрузить изображение (JPEG / PNG / WebP / GIF). Поле `alt` обязательно.

| Параметр  | Значение                                                                |
| --------- | ----------------------------------------------------------------------- |
| Хранилище | Локальная папка `media/` в корне репо (в `.gitignore`, не коммитится)   |
| MIME      | Только `image/jpeg`, `image/png`, `image/webp`, `image/gif`             |
| Max size  | 5 MiB (`MEDIA_MAX_FILE_SIZE` в `src/collections/mediaLimits.ts`)        |
| R2        | Позже (roadmap **037**); env `R2_*` пока не нужны для локального upload |

Проверка: создать Media с картинкой и `alt` → файл появляется в `media/`, запись видна в admin.

## 9. Categories и Tags (таксономия)

В `/admin` доступны коллекции **Categories** и **Tags**. Поля `title` и `slug` **локализованы** (`uk` / `ru` / `en`; default locale — `uk`, fallback включён).

| Параметр | Значение                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------- |
| Write    | Только `admin` (create / update / delete)                                                                 |
| Read     | Публичный (`read: true`) — для будущего browse                                                            |
| Slug     | Уникален **в пределах локали**; если пуст при сохранении — генерируется из `title` (`src/lib/slugify.ts`) |

Проверка:

1. Войдите в `/admin` как admin.
2. **Categories** → Create: заполните `title` (например «Інженерія»), оставьте `slug` пустым → Save. Ожидание: slug вроде `inzheneriya`.
3. Переключите locale в admin на `en`, задайте English title/slug → Save.
4. То же для **Tags**.
5. Reader (если создан) не должен иметь write-доступ к этим коллекциям.

Relation к Articles/Notes — шаги **018** / **019**. Unit-тесты slugify — **024**.

## 10. Articles

В `/admin` доступна коллекция **Articles** (развёрнутые статьи).

| Параметр | Значение                                                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Write    | Только `admin` (create / update / delete)                                                                                                                                                         |
| Read     | Admin — все документы (включая drafts); иначе только `_status: published`                                                                                                                         |
| Поля     | `title` / `slug` (localized, slug auto из title), Lexical `body` (localized), `heroImage` → Media, `categories` / `tags`, `publishedAt`, группа `seo` (`metaTitle`, `metaDescription`, `ogImage`) |
| Drafts   | `versions.drafts` — Save Draft / Publish в admin                                                                                                                                                  |
| Локали   | `uk` / `ru` / `en` (как у Categories/Tags)                                                                                                                                                        |

Проверка:

1. Войдите в `/admin` как admin.
2. При необходимости создайте Category/Tag и загрузите Media (hero).
3. **Articles** → Create: заполните `title`, оставьте `slug` пустым, наберите `body` → **Save Draft**. Ожидание: документ в статусе draft, slug заполнен.
4. Переключите locale (`en` / `ru`), задайте локализованные поля → Save.
5. **Publish** ту же статью; при желании задайте `publishedAt` и SEO.
6. Reader / anonymous не должны видеть drafts через API (`read` фильтрует `_status`); write — только admin.

Публичные роуты статьи — шаг **051**. Preview URL — **035**. Unit для `publishedOrAdmin` / slugify — **024**. Notes — **019**.

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
