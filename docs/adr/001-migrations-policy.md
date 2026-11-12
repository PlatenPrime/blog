# ADR-001: Политика миграций Payload (dev push vs prod migrations)

- **Статус:** accepted
- **Дата:** 2026-10-06
- **Контекст:** шаг roadmap `009`; стек — [`tech-stack.md`](../tech-stack.md)

## Контекст

Payload + Postgres (Drizzle) умеет два режима синхронизации схемы:

1. **Drizzle `push`** — автоматический sync схемы при старте в development.
2. **Payload migrations** — версионированные SQL/TS файлы в репозитории.

Нужна явная политика: быстрый локальный цикл без ручных миграций на каждый чих, и безопасный prod/preview без опасного auto-push.

## Решение

| Окружение                                | Схема                                          |
| ---------------------------------------- | ---------------------------------------------- |
| Local / `NODE_ENV=development`           | `push: true` — Drizzle push при старте Payload |
| Prod, preview, CI, любой non-development | `push: false` — только `npm run migrate`       |

Реализация: [`src/db/adapter.ts`](../../src/db/adapter.ts) (`push` и `migrationDir` → `src/migrations/`).

### Workflow

1. В dev меняешь collections/fields → `npm run dev` (push применяет схему).
2. Перед shared/prod окружением: `npm run migrate:create <name>` → ревью файлов в `src/migrations/`.
3. На целевой БД: `npm run migrate` (статус: `npm run migrate:status`).

### Жёсткие правила

- **Не смешивать** push и migrate на одной долгоживущей БД без сброса. Если локальная БД «поехала» после push, а нужна чистая миграционная история: `docker compose down -v`, затем `up -d` и `npm run migrate`.
- **Prod без auto-push.** `push` включён только при `NODE_ENV === 'development'`.
- **`prodMigrations` в адаптере не подключаем.** На Vercel serverless автозапуск миграций при cold start замедляет init.
- **Migrate on deploy (шаг 090):** Vercel Build Command = `npm run build:deploy` (`migrate` → `build`). Runtime остаётся на pooled `DATABASE_URL`; CLI migrate на билде берёт `DATABASE_URL_UNPOOLED` через [`src/scripts/withDirectDatabaseUrl.ts`](../../src/scripts/withDirectDatabaseUrl.ts). Локальный `npm run build` миграции не гоняет.

### Scripts

| Script                   | Команда                                         |
| ------------------------ | ----------------------------------------------- |
| `npm run migrate`        | применить pending                               |
| `npm run migrate:create` | сгенерировать миграцию                          |
| `npm run migrate:status` | статус                                          |
| `npm run build:deploy`   | `migrate` + `build` (Vercel Production/Preview) |

## Последствия

- Пустая БД поднимается baseline-миграцией без запуска `next dev`.
- Dev остаётся быстрым; риск schema drift в Neon/Vercel снижается.
- Каждый Vercel deploy применяет pending migrations до `next build`; cold-start `prodMigrations` не используются.

## Ссылки

- [Payload Migrations](https://payloadcms.com/docs/database/migrations)
- [Payload Postgres](https://payloadcms.com/docs/database/postgres)
- [`docs/local-postgres.md`](../local-postgres.md)
