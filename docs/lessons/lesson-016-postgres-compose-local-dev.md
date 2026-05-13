# Lesson 016: PostgreSQL compose for local dev

## Learning Goal

Поднять локальную инфраструктуру PostgreSQL через `docker compose` так, чтобы любой разработчик одной командой получал детерминированную БД (фиксированный мажор, явные креды, healthcheck, персистентный volume). Закрепить 12-factor приём: подключаемый ресурс (БД) живёт **снаружи** приложения, конфигурируется через ENV и не зависит от того, что установлено в системе.

## Implementation Scope

В скоупе шага:

- Новый [`docker-compose.yml`](../../docker-compose.yml) в корне репо с единственным сервисом `db` на базе `postgres:16-alpine`.
- Healthcheck `pg_isready`, именованный volume `blog_pgdata`, bind порта только на loopback (`127.0.0.1:5432`).
- Дефолтные значения ENV в самом compose через синтаксис `${VAR:-default}` — `docker compose up -d` работает «из коробки» без `.env`.
- Удобные npm-скрипты в [`package.json`](../../package.json): `db:up`, `db:down`, `db:reset`, `db:logs`, `db:psql`.

Намеренно **не** делаем в этом шаге:

- `.env.example` файлы — это step 017.
- ORM/драйверы БД (`pg`, `typeorm`, `prisma`), `@nestjs/config` интеграция и `DATABASE_URL` парсер — это Track 1.
- Init-скрипты в `docker-entrypoint-initdb.d/`, миграции, seed-данные — это Track 3.
- pgAdmin/Adminer/Redis/queue-сервисы — за пределами шага (отложено в Tracks 6-7).
- Изменения в `apps/api/src/**` или `apps/web/**` — прикладной интеграции с БД пока нет.

## Dependencies

- Docker Engine **24+** или Docker Desktop с включённой compose v2 (`docker compose ...`, не `docker-compose ...`).
- Свободный порт `5432` на хосте (либо переопределить через `POSTGRES_PORT`).
- Node.js `>=22.12.0` (см. [`package.json`](../../package.json) `engines`) — только чтобы npm-скрипты `db:*` корректно резолвились.
- Никаких новых npm-зависимостей в этом шаге.

Переменные окружения (с дефолтами в [`docker-compose.yml`](../../docker-compose.yml)):

| Variable            | Default    | Назначение                                     |
| ------------------- | ---------- | ---------------------------------------------- |
| `POSTGRES_USER`     | `blog`     | Имя суперпользователя БД, создаваемого образом |
| `POSTGRES_PASSWORD` | `blog`     | Пароль суперпользователя (dev-only)            |
| `POSTGRES_DB`       | `blog_dev` | База, создаваемая при первом запуске           |
| `POSTGRES_PORT`     | `5432`     | Host-side порт mapping'а                       |

## Step-by-Step Changes

1. **Готовим compose-файл.** Создаём [`docker-compose.yml`](../../docker-compose.yml) в корне репо с одним сервисом `db`. Фиксируем мажорную версию (`postgres:16-alpine`) — образ alpine весит ~80 МБ против ~400 МБ у debian-варианта, `pg_isready` присутствует в обоих. Явное `name: blog` для compose-проекта делает имена volume/network не зависимыми от имени папки на диске.
2. **Healthcheck.** Прописываем `pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB` (двойной `$$` — чтобы Compose не подменил переменную на этапе парсинга и она дошла до shell внутри контейнера). `interval: 5s`, `retries: 5`, `start_period: 10s` — баланс между «не спамим pg_isready» и «быстро готово для `depends_on: service_healthy`» из будущих сервисов.
3. **Volume и порт.** Именованный `blog_pgdata` (с явным `name:` в секции `volumes`, чтобы имя не зависело от имени compose-проекта). Порт биндим на `127.0.0.1:${POSTGRES_PORT:-5432}:5432` — БД доступна только локальному хосту, а не всей подсети, даже если фаервол выключен.
4. **npm-скрипты.** В корневой [`package.json`](../../package.json) добавляем `db:up`, `db:down` (контейнер вниз, volume сохраняется), `db:reset` (`down -v` — данные удаляются), `db:logs`, `db:psql`. В `db:psql` явно зашиваем `-U blog -d blog_dev` без переменных среды — это даёт одинаковое поведение на Windows PowerShell, macOS и Linux (на Windows `$VAR` в строке скрипта npm не подставляется через cmd.exe).
5. **Документация.** Создаём этот урок и обновляем индексы: [`docs/development-roadmap.md`](../development-roadmap.md), [`docs/learning-path.md`](../learning-path.md), [`docs/README.md`](../README.md), [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md) (новая секция «Local infrastructure (PostgreSQL)» + перевод указателя `Next roadmap step` на 017).
6. **Verify.** Прогоняем `npm run db:up`, ждём `Healthy` в `docker compose ps`, дергаем `pg_isready` и `psql -c "select version();"`. Дополнительно — `npm run test` и `npx nx run api:test:e2e` остаются зелёными (мы не трогали прикладной код).

## Code Example

Минимальный [`docker-compose.yml`](../../docker-compose.yml) (фрагмент сервиса):

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: blog-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-blog}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-blog}
      POSTGRES_DB: ${POSTGRES_DB:-blog_dev}
    ports:
      - '127.0.0.1:${POSTGRES_PORT:-5432}:5432'
    volumes:
      - blog_pgdata:/var/lib/postgresql/data
    healthcheck:
      test:
        - CMD-SHELL
        - pg_isready -U "$${POSTGRES_USER}" -d "$${POSTGRES_DB}"
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s
```

Локальный жизненный цикл через npm:

```bash
npm run db:up          # запустить БД в фоне
npm run db:logs        # хвост логов
npm run db:psql        # интерактивный psql внутри контейнера
npm run db:down        # остановить (данные останутся в volume)
npm run db:reset       # остановить + удалить volume (полный сброс)
```

## Context

К моменту шага 016 в монорепо уже есть:

- NestJS API в `apps/api` (lesson 005) и TanStack Start в `apps/web` (lesson 010).
- Корневой Nx, ESLint, Prettier, TS path mapping (lessons 003-008).
- `libs/shared-contracts` подключена и в API (lesson 013), и в web (lesson 014).
- CORS включён, разведены dev-порты `API=4000` / `web=3000` (lesson 015), CORS-парсер сделан **чистой функцией от env**.

БД ещё нигде не используется. Track 1 (Platform Core, `@nestjs/config` + env-валидация) и Track 2 (Auth) будут полагаться на работающий PostgreSQL. Поднимать БД _вручную_ на каждой машине курса — лотерея версий и портов; нужна одна команда, дающая идентичный результат у всех.

## Concept

**Внешний подключаемый ресурс (12-factor).** БД — это **внешний ресурс**, заменяемый через ENV. Приложение не знает, что БД крутится в контейнере рядом — оно знает только `DATABASE_URL` (или `DB_HOST`/`DB_PORT`/...). `docker compose` здесь — это не про «контейнеризацию приложения», а про **детерминированную dev-инфраструктуру**: тот же мажор PostgreSQL, тот же набор пользователей, та же модель healthcheck'а у каждого, кто склонировал репо.

**Healthcheck как контракт.** `pg_isready` отвечает «принимает ли postmaster TCP-соединения». Это нужно не «для красоты в `docker ps`», а как условие `depends_on: condition: service_healthy` для будущих сервисов (миграции, API в compose). Без него «БД поднялась, но ещё не готова» — гонка, которая всплывает на каждой второй CI-сборке.

**Named volume vs bind mount.** `blog_pgdata` — именованный volume, который Docker сам кладёт под `/var/lib/docker/volumes/...`. Альтернатива (`./pgdata:/var/lib/postgresql/data`) с привязкой к папке репо плодит проблемы прав на Linux/Windows и попадает в git-статус. Named volume — стандарт для stateful-данных в dev.

## Code Changes

- [`docker-compose.yml`](../../docker-compose.yml) — создан: сервис `db` на `postgres:16-alpine`, healthcheck, named volume, loopback bind.
- [`package.json`](../../package.json) — добавлены скрипты `db:up`, `db:down`, `db:reset`, `db:logs`, `db:psql`.
- [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md) — секция Local infrastructure (PostgreSQL); указатель «Next roadmap step» переведён на 017.
- [`docs/development-roadmap.md`](../development-roadmap.md) — Step 016 отмечен completed в Baseline Status и Completed Steps Snapshot.
- [`docs/learning-path.md`](../learning-path.md), [`docs/README.md`](../README.md) — ссылки на lesson-016.
- `docs/lessons/lesson-016-postgres-compose-local-dev.md` — этот файл.

## Why This Matters

- **Одна команда — одинаковый Postgres у всех.** `npm run db:up` → у студента и у CI окружения одинаковый мажор, одни и те же creds, один и тот же сетевой контракт. Это база для воспроизводимых интеграционных тестов в Tracks 1-3.
- **Готов к docker-compose-оркестрации.** Healthcheck + named volume — это контракт, на который опираются `depends_on: condition: service_healthy` и `docker compose up --wait` в будущей CI-цепочке (Track 8).
- **12-factor дисциплина.** Параметры подключения уже сейчас читаются через ENV-переменные `POSTGRES_*` — в Track 1 эти же переменные подхватит NestJS-конфиг, без перепривязок.
- **Безопасность даже в dev.** Bind на `127.0.0.1` исключает случайный доступ из локальной подсети (например, в коворкинге).

## Architecture Notes

- **Compose-файл в корне, не в `infra/`.** Roadmap фиксирует verify-команду `docker compose up -d` (без флага `-f`). Когда сервисов станет 3+ (Redis, MailHog, OpenTelemetry collector), можно вынести в `infra/docker-compose.yml` и проксировать через npm-скрипты — без слома UX.
- **Имя сервиса `db`, не `postgres`.** Внутри compose-сети контейнеры будут резолвить БД по DNS-имени `db`, что естественно ложится на будущий `DB_HOST=db` в `.env.example`. Если поменять провайдер (PostgreSQL → CockroachDB или managed DB) — имя сервиса останется стабильным контрактом.
- **Дефолты в compose, а не в `.env`.** Сейчас compose работает «из коробки» без `.env`. В шаге 017 появится `.env.example` со ссылкой на эти же переменные. Compose автоматически подхватит локальный `.env` (если он окажется в корне) — это стандартный механизм docker compose.
- **`restart: unless-stopped`.** Удобно локально: после ребута машины БД сама поднимется. На prod-инстансах политика будет другой (manage'нутый Postgres / Kubernetes), но для dev — самое то.
- **Альтернативы, отвергнутые сейчас:**
  - `version: '3.x'` в compose-файле — устарел, compose v2 берёт спецификацию из формата сам.
  - bind mount `./pgdata:/var/lib/postgresql/data` — проблемы прав, лишний шум в `git status`.
  - root-пользователь без пароля — POLA нарушается; даже в dev сразу даём явные creds.
  - `latest`-тег образа — катастрофа воспроизводимости. Только pinned major.
- **Эскалация в Track 1.** Когда поднимем `@nestjs/config`, переменные `POSTGRES_*` будут провалидированы Zod/joi-схемой. Любое расхождение compose ↔ Nest-конфига должно ловиться e2e-тестом startup'а.

## Changed Files

| Файл                                                       | Действие                                                   |
| ---------------------------------------------------------- | ---------------------------------------------------------- |
| [`docker-compose.yml`](../../docker-compose.yml)           | создан: сервис `db` (postgres:16-alpine, healthcheck)      |
| [`package.json`](../../package.json)                       | добавлены `db:up`/`db:down`/`db:reset`/`db:logs`/`db:psql` |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                 | секция Local infrastructure (PostgreSQL), указатель → 017  |
| [`docs/development-roadmap.md`](../development-roadmap.md) | Step 016 в Baseline Status + Completed Steps Snapshot      |
| [`docs/learning-path.md`](../learning-path.md)             | ссылка на lesson-016 в Phase 1                             |
| [`docs/README.md`](../README.md)                           | Step 016 в Completed Lessons                               |
| `docs/lessons/lesson-016-postgres-compose-local-dev.md`    | этот файл                                                  |

## Verification

С корня репозитория:

```bash
npm run db:up
docker compose ps                               # State: running, Status: healthy
docker compose exec db pg_isready -U blog  # accepting connections
npm run db:psql -- -c "select version();"       # видим PostgreSQL 16.x
npm run db:down                                  # контейнер остановлен, volume сохранён
npm run db:up                                    # повторный старт — данные на месте
npm run db:reset                                 # волюм blog_pgdata удалён
```

Regression check (мы не трогали прикладной код):

```bash
npm run build
npm run test
npx nx run api:test:e2e
npx nx run web:build
```

Все таргеты должны остаться зелёными.

## TDD Sequence

Прикладного TS-кода в этом шаге нет → unit-тестов на Vitest не добавляем. Это явно разрешено **Step Contract** в [`docs/development-roadmap.md`](../development-roadmap.md) (п.5):

> Если шаг по контракту не подразумевает тестируемое поведение (например, миграции структуры/инфраструктуры), явно указать причину и какие проверки выполняются вместо unit-тестов.

Эквивалент unit-теста — детерминированная **инфраструктурная проверка** (см. блок Verification):

- Red аналог: до создания compose-файла команда `docker compose up -d` не находит сервис `db`.
- Green аналог: после создания compose-файла `docker compose ps` показывает `Health: healthy` через ≤ 30 секунд.
- Refactor: имя проекта (`name: blog`) и имя volume (`name: blog_pgdata`) вынесены явно, чтобы compose-id не зависел от имени папки — поведение не меняется, идентификаторы становятся стабильными.

Когда в Track 1 появится `@nestjs/config` и драйвер `pg`, на эти же `POSTGRES_*` переменные приедут полноценные интеграционные тесты (connection check, миграции up/down).

## Definition of Done

- [ ] `npm run db:up` запускает сервис `db`, и через ≤ 30 секунд `docker compose ps` показывает `Status: healthy`.
- [ ] `docker compose exec db pg_isready -U blog` → `accepting connections`.
- [ ] `npm run db:psql -- -c "select 1;"` возвращает `1`.
- [ ] `npm run db:down` останавливает контейнер; повторный `npm run db:up` поднимает БД с теми же данными (volume сохранён).
- [ ] `npm run db:reset` удаляет volume `blog_pgdata`.
- [ ] Step 016 присутствует в Baseline Status и Completed Steps Snapshot ([`docs/development-roadmap.md`](../development-roadmap.md)), в [`docs/learning-path.md`](../learning-path.md), [`docs/README.md`](../README.md), [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md).
- [ ] `npm run test` и `npx nx run api:test:e2e` остаются зелёными (regression check).

## What To Remember

- БД — это **внешний ресурс**, заменяемый через ENV; compose даёт детерминированный «склад», но не приложение.
- Healthcheck — это **контракт готовности**, а не косметика: на него опираются `depends_on: service_healthy` и `--wait` в CI.
- Named volume + bind на `127.0.0.1` + pinned major-тег — три обязательных пункта для любого dev-сервиса с состоянием.
- Креды dev-only внутри compose — нормально; **секреты** появятся только в `.env` и не коммитятся.

## Verify

```bash
npm run db:up
docker compose ps
docker compose exec db pg_isready -U blog
npm run db:psql -- -c "select version();"
npm run db:reset
```
