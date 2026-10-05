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

На шаге 007 контейнер готов, но приложение ещё может использовать SQLite. Подключение Payload к этому Postgres — шаг **008** роадмапа (`@payloadcms/db-postgres`).
