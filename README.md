# blog

[![CI](https://github.com/PlatenPrime/blog/actions/workflows/ci.yml/badge.svg)](https://github.com/PlatenPrime/blog/actions/workflows/ci.yml)

Monorepo-практикум: **NestJS API** + **TanStack Start** (SSR/SEO) + **Nx**. План шагов и состояние трека — [`docs/development-roadmap.md`](docs/development-roadmap.md). Этот README — runbook: что в репо, как поднять обе части за минуту, какие порты, какие команды и куда идти дальше.

## Stack

| Слой                 | Технология                                                                        | Где живёт                                                      |
| -------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Backend API          | NestJS 11 + Express 5 + dotenv                                                    | [`apps/api/`](apps/api/)                                       |
| Public web (SSR/SEO) | TanStack Start (Vite 8 + Nitro), React 19, Tailwind 4                             | [`apps/web/`](apps/web/)                                       |
| Shared contracts     | TypeScript типы/DTO, переиспользуемые API↔web                                     | [`libs/shared-contracts/`](libs/shared-contracts/)             |
| Локальная инфра      | PostgreSQL 16 (`postgres:16-alpine`) + healthcheck + named volume                 | [`docker-compose.yml`](docker-compose.yml)                     |
| Monorepo             | npm workspaces + Nx 22 (target defaults, cache, граф)                             | [`package.json`](package.json), [`nx.json`](nx.json)           |
| Quality              | ESLint flat config 9, Prettier 3, EditorConfig, Husky 9 + `tests-first` precommit | [`eslint.config.mjs`](eslint.config.mjs), [`.husky/`](.husky/) |

## Prerequisites

- **Node.js** `20.18.0` (зафиксирован в [`.nvmrc`](.nvmrc) и [`.node-version`](.node-version)) — `nvm`/`fnm` подхватят автоматически.
- **npm** ≥ `10` (см. `engines` в [`package.json`](package.json)).
- **Docker** Engine 24+ с Compose v2 (`docker compose version` должен работать) — нужен только для локальной БД.

```bash
node -v && npm -v && docker compose version
```

## Quick start (60 seconds)

```bash
git clone <repo> && cd blog
nvm use                                      # Node 20.18.0
npm install
cp .env.example .env                         # backend + infra envs
cp apps/web/.env.example apps/web/.env       # web stub
npm run db:up                                # PostgreSQL в Docker
npm run start:dev                            # terminal 1 -> http://localhost:4000
npm run web:dev                              # terminal 2 -> http://localhost:3000
```

`cp .env.example .env` даёт работоспособный dev-конфиг «из коробки» — значения шаблона совпадают с дефолтами кода и compose. Подробнее: [lesson-017](docs/lessons/lesson-017-env-example-files.md).

## Project structure

```text
blog/
├── apps/
│   ├── api/                  # NestJS API (port 4000)
│   └── web/                  # TanStack Start SSR (port 3000)
├── libs/
│   └── shared-contracts/     # Общие типы/DTO, импорт как @blog/shared-contracts
├── docs/
│   ├── development-roadmap.md   # Источник истины по шагам
│   ├── LOCAL_SETUP.md           # Глубокий setup-гайд
│   ├── learning-path.md         # Карта фаз обучения
│   └── lessons/                 # lesson-NNN-*.md по каждому шагу
├── scripts/                  # validate-tests-first.mjs и пр.
├── docker-compose.yml        # service db (Postgres 16)
├── .env.example              # API + Postgres env-шаблон
├── nx.json                   # target defaults, named inputs
├── package.json              # npm workspaces + root npm-скрипты
└── tsconfig.base.json        # paths: @blog/shared-contracts
```

## Common commands (from repo root)

| Цель                        | npm-скрипт                 | Под капотом                                                     |
| --------------------------- | -------------------------- | --------------------------------------------------------------- |
| Полный CI parity (локально) | `npm run ci`               | tests-first → format → lint:ci → typecheck → build → test → e2e |
| Lint API+web без `--fix`    | `npm run lint:ci`          | `nx run api:lint:ci` → `nx run web:lint`                        |
| Установка зависимостей      | `npm install`              | npm workspaces (`apps/*`, `libs/*`)                             |
| Старт API (watch)           | `npm run start:dev`        | `npm run start:dev -w api` → `nest start --watch`               |
| Production-старт API        | `npm run start:prod`       | `npm run start:prod -w api`                                     |
| Unit-тесты API              | `npm run test`             | `nx run api:test`                                               |
| E2E-тесты API               | `npm run test:e2e`         | `nx run api:test:e2e`                                           |
| Lint API                    | `npm run lint`             | `nx run api:lint`                                               |
| Build API                   | `npm run build`            | `nx run api:build` (dependsOn `shared-contracts:build`)         |
| Dev-сервер web              | `npm run web:dev`          | `npm run dev -w web` → Vite на `:3000`                          |
| Build web                   | `npx nx run web:build`     | Vite + Nitro production-сборка                                  |
| Typecheck web               | `npx nx run web:typecheck` | `tsc --noEmit`                                                  |
| Поднять БД                  | `npm run db:up`            | `docker compose up -d db`                                       |
| Логи БД (follow)            | `npm run db:logs`          | `docker compose logs -f db`                                     |
| `psql` в контейнере         | `npm run db:psql`          | `docker compose exec db psql -U blog -d blog_dev`               |
| Остановить БД (volume жив)  | `npm run db:down`          | `docker compose down`                                           |
| Полный сброс БД             | `npm run db:reset`         | `docker compose down -v`                                        |
| Список Nx-проектов          | `npm run nx:show`          | `nx show projects` (`api`, `web`, `shared-contracts`)           |
| Граф проектов               | `npm run nx:graph`         | `nx graph`                                                      |
| Prettier (запись)           | `npm run format`           | prettier --write по фиксированному glob                         |
| Prettier (проверка)         | `npm run format:check`     | prettier --check (для CI и precommit)                           |

Эквивалентная explicit-форма для любой Nx-цели — `npx nx run <project>:<target>`.

## Ports & URLs

| Сервис     | URL / Host              | Источник                                                                                                  |
| ---------- | ----------------------- | --------------------------------------------------------------------------------------------------------- |
| API        | `http://localhost:4000` | [`apps/api/src/main.ts`](apps/api/src/main.ts) → `resolveInitialPort()` (auto-increment +1 до 20 попыток) |
| Web (SSR)  | `http://localhost:3000` | [`apps/web/package.json`](apps/web/package.json) → `vite dev --port 3000`                                 |
| PostgreSQL | `127.0.0.1:5432`        | [`docker-compose.yml`](docker-compose.yml) → `ports: 127.0.0.1:${POSTGRES_PORT:-5432}:5432`               |
| CORS allow | `http://localhost:3000` | [`apps/api/src/config/cors.config.ts`](apps/api/src/config/cors.config.ts) → `buildCorsOptions()`         |

## Environment

Переменные окружения коммитятся **только** как шаблоны; реальные `.env` в [`.gitignore`](.gitignore).

- [`.env.example`](.env.example) — корневой, `PORT` + `CORS_ORIGINS` для API и `POSTGRES_*` для compose. API подхватывает через dotenv в [`apps/api/src/main.ts`](apps/api/src/main.ts).
- [`apps/web/.env.example`](apps/web/.env.example) — отдельный, чтобы серверные секреты не попали в client-бандл через `import.meta.env`. Namespace: `VITE_PUBLIC_*` (виден браузеру) vs без префикса (server-only Nitro/SSR).
- Полная таблица переменных, дефолтов и потребителей — в [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md). Обоснование контракта — в [lesson-017](docs/lessons/lesson-017-env-example-files.md).

## Troubleshooting

| Симптом                                                      | Что делать                                                                                                                                                                   |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EADDRINUSE: 4000` при `npm run start:dev`                   | API сам инкрементит порт до `4019`. Чтобы зафиксировать: `PORT=4100 npm run start:dev`.                                                                                      |
| Браузер блокирует запросы по CORS                            | Расширь whitelist: `CORS_ORIGINS="http://localhost:3000,http://localhost:5173" npm run start:dev`. Логика — в [lesson-015](docs/lessons/lesson-015-cors-and-dev-origins.md). |
| `npm run db:up` — контейнер не healthy / `pg_isready` падает | `npm run db:logs` для деталей; при коррапте данных — `npm run db:reset` (удалит named volume `blog_pgdata`).                                                                 |
| `nest: command not found` или странные ошибки версий         | Несовпадение Node. Проверь: `node -v` против `.nvmrc` (`20.18.0`); переключись `nvm use` / `fnm use`.                                                                        |
| `npm run format:check` падает локально                       | Запусти `npm run format` (запись), потом коммить. Husky-precommit (`scripts/validate-tests-first.mjs`) ловит тесты, Prettier — отдельная цель.                               |

## Status

Текущий трек: **Track 0 — Workspace Foundation** (in progress). Последний завершённый шаг — **019: CI pipeline baseline**. Полный план и прогресс: [`docs/development-roadmap.md`](docs/development-roadmap.md).

## Documentation map

- [`docs/development-roadmap.md`](docs/development-roadmap.md) — источник истины по шагам (001-320).
- [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md) — детальный setup, env-таблицы, инфраструктура.
- [`docs/learning-path.md`](docs/learning-path.md) — карта фаз обучения (Phase 1-8).
- [`docs/lessons/`](docs/lessons/) — уроки `lesson-NNN-*.md`, по одному на шаг.
- [`docs/lesson-authoring-guide.md`](docs/lesson-authoring-guide.md) — правила оформления уроков.
- [`docs/README.md`](docs/README.md) — индекс документации.
