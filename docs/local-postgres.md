# Локальный Postgres (Docker Compose)

Быстрая локальная БД для разработки без обязательной зависимости от Neon.

## Предпосылки

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) или Docker Engine + Compose plugin

## Запуск

Из корня репозитория:

```bash
docker compose up -d
```

Остановка (данные в volume сохраняются):

```bash
docker compose down
```

Удаление контейнера **и** данных:

```bash
docker compose down -v
```

## Credentials

Совпадают с [`DATABASE_URL`](../.env.example):

| Параметр | Значение |
| --- | --- |
| User | `postgres` |
| Password | `postgres` |
| Database | `blog` |
| Host / port | `localhost:5432` |

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/blog
```

## Проверка

Статус и health:

```bash
docker compose ps
```

Сервис `postgres` должен быть `healthy`. Коннект теми же credentials:

```bash
docker compose exec postgres psql -U postgres -d blog -c 'select 1'
```

Ожидаемый результат: строка с `1`.

## Связь с Payload

Локально Payload использует `@payloadcms/db-postgres` и тот же `DATABASE_URL`. На Vercel заготовка выбирает `@payloadcms/db-vercel-postgres` (см. `src/db/adapter.ts`).

Перед `npm run dev`:

1. Поднимите Postgres: `docker compose up -d`
2. Убедитесь, что в `.env` заданы `DATABASE_URL` и `PAYLOAD_SECRET`

В **development** схема подтягивается через Drizzle push. Для shared/prod и для проверки «с нуля» используйте миграции (политика — [`docs/adr/001-migrations-policy.md`](./adr/001-migrations-policy.md)):

```bash
npm run migrate:status
npm run migrate
npm run migrate:create <name>
```

Если после push локальная БД разошлась с историей миграций — сбросьте volume и примените миграции заново:

```bash
docker compose down -v
docker compose up -d
npm run migrate
```
