# Локальный запуск

Повторяемый onboarding: с нуля поднять app, Postgres и первый admin без устных пояснений.

## Предпосылки

| Инструмент | Версия / заметка |
| --- | --- |
| Node.js | `^24` (см. `engines` в `package.json`) |
| npm | `>=10` |
| Docker | Docker Desktop или Docker Engine + Compose plugin |

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

| Переменная | Назначение |
| --- | --- |
| `DATABASE_URL` | Postgres (значение по умолчанию совпадает с Docker Compose) |
| `PAYLOAD_SECRET` | Длинная случайная строка для сессий/токенов Payload |
| `NEXT_PUBLIC_SERVER_URL` | Публичный origin app, обычно `http://localhost:3000` |

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

Пока нет seed-скрипта (roadmap **040**): первый пользователь создаётся через Payload UI при первом заходе на `/admin` (форма create-first-user).

Переменные `ADMIN_EMAIL` и `ADMIN_PASSWORD` в `.env` зарезервированы под будущий bootstrap; сейчас они **не** создают пользователя автоматически.

## 7. Seed (placeholder)

| Что | Сейчас | Позже |
| --- | --- | --- |
| Admin user | Вручную в `/admin` | Seed по `ADMIN_*` (шаг **040**) |
| Контент / faker | Пустая БД | Track 12 (ops & seed) |

Для текущего onboarding достаточно пустой БД после migrate и одного admin из UI.

## Полезные команды

```bash
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
