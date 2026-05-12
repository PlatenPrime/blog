# Local Setup

This file is the local setup entry point after steps 001-009.

## Toolchain

- Node.js: recommended `20.18.0` (see `.nvmrc`, `.node-version`)
- npm: `>=10`

## Version check

```bash
node -v
npm -v
```

## Install dependencies

Run from repository root:

```bash
npm install
```

## Common root commands

```bash
npm run start:dev
npm run test
npm run test:e2e
npm run build
npm run lint
npm run format
npm run format:check
```

`npm run build`, `npm run test`, `npm run lint`, and `npm run test:e2e` invoke **Nx** targets on the `api` project (`nx run api:build`, and so on), so you get Nx caching and the same entry points future CI will use.

## TanStack Start (`apps/web`)

The `web` workspace is a TanStack Start app (Vite + Nitro). From repository root:

```bash
npm run web:dev
npx nx run web:build
```

## Nx commands

```bash
npm run nx:show
npm run nx:graph
```

Explicit target form (equivalent to the npm scripts above):

```bash
npx nx run api:build
npx nx run api:test
npx nx run api:lint
npx nx run api:test:e2e
npx nx run web:build
npx nx run web:typecheck
npx nx run shared-contracts:build
```

## Environment variables

The API reads environment variables at bootstrap (and from a root `.env` file if present, loaded by `dotenv` in [`apps/api/src/main.ts`](../apps/api/src/main.ts)).

| Variable       | Default                 | Purpose                                                                                                                                                                         |
| -------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`         | `4000`                  | Initial port for the NestJS API. If busy, it auto-increments up to 20 times.                                                                                                    |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated whitelist of allowed origins. Use `*` (alone or with others) to reflect any origin. **Note:** combining `*` with `credentials: true` will be banned in Track 2. |

The TanStack Start app (`apps/web`) listens on `http://localhost:3000` by default (see [`apps/web/package.json`](../apps/web/package.json) `scripts.dev`).

Example dev session (two terminals):

```bash
npm run start:dev           # API on http://localhost:4000
npm run web:dev             # web on http://localhost:3000
```

Override the CORS whitelist:

```bash
CORS_ORIGINS="http://localhost:3000,http://localhost:5173" npm run start:dev
```

## Local infrastructure (PostgreSQL)

Локальная БД поднимается в Docker через [`docker-compose.yml`](../docker-compose.yml) (сервис `db`, образ `postgres:16-alpine`, healthcheck `pg_isready`, named volume `nestjs_st_pgdata`, bind на `127.0.0.1:5432`).

Пререквизит: Docker Engine 24+ (или Docker Desktop) с compose v2 — проверить через `docker compose version`.

Команды (с корня репо):

```bash
npm run db:up          # запустить БД в фоне (docker compose up -d db)
npm run db:logs        # хвост логов сервиса db
npm run db:psql        # интерактивный psql внутри контейнера
npm run db:down        # остановить контейнер; volume сохраняется
npm run db:reset       # остановить и удалить volume (полный сброс)
```

Переменные (дефолты прописаны прямо в [`docker-compose.yml`](../docker-compose.yml) через `${VAR:-default}` — `npm run db:up` работает «из коробки» без `.env`):

| Variable            | Default         | Назначение                           |
| ------------------- | --------------- | ------------------------------------ |
| `POSTGRES_USER`     | `nestjs_st`     | Имя суперпользователя БД             |
| `POSTGRES_PASSWORD` | `nestjs_st`     | Пароль суперпользователя (dev-only)  |
| `POSTGRES_DB`       | `nestjs_st_dev` | База, создаваемая при первом запуске |
| `POSTGRES_PORT`     | `5432`          | Host-side порт mapping'а             |

Переопределить значения можно через переменные окружения сессии или через корневой `.env` — Docker Compose автоматически подхватит `.env` в `cwd`.

Quick smoke (после `npm run db:up`):

```bash
docker compose ps                                # ожидаем Status: healthy
docker compose exec db pg_isready -U nestjs_st   # accepting connections
npm run db:psql -- -c "select version();"        # PostgreSQL 16.x
```

## Next roadmap step

Step 017: add `.env.example` files — see [development-roadmap.md](./development-roadmap.md).
