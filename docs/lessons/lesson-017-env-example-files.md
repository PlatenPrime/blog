# Lesson 017: `.env.example` files (12-factor config contract)

## Learning Goal

Закрепить дисциплину 12-factor «config in env»: в репозитории лежит **только шаблон** ожидаемых переменных окружения (`.env.example`), а сам `.env` с реальными значениями игнорируется. Шаблон одновременно служит **контрактом запуска** («что нужно задать, чтобы поднять систему») и **точкой синхронизации** между API ([`apps/api/src/main.ts`](../../apps/api/src/main.ts)), Docker Compose ([`docker-compose.yml`](../../docker-compose.yml)) и web ([`apps/web`](../../apps/web)).

## Implementation Scope

В скоупе шага:

- Новый корневой [`.env.example`](../../.env.example): секции API (`PORT`, `CORS_ORIGINS`) и PostgreSQL compose (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`). Значения совпадают с дефолтами в коде/compose, чтобы `cp .env.example .env` давал работоспособную dev-конфигурацию.
- Новый [`apps/web/.env.example`](../../apps/web/.env.example): documented stub без активных переменных, фиксирующий namespace `VITE_PUBLIC_*` (клиентский бандл) vs без префикса (Nitro/SSR server-only).
- Обновление [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md): подсекция `.env.example` workflow и сдвиг указателя «Next roadmap step» на 018.
- Этот урок и кросс-ссылки в индексах ([`docs/development-roadmap.md`](../development-roadmap.md), [`docs/learning-path.md`](../learning-path.md), [`docs/README.md`](../README.md)).

Намеренно **не** делаем в этом шаге:

- Не добавляем `DATABASE_URL`, `NODE_ENV`, `LOG_LEVEL`, `JWT_*` — этих ключей пока никто не читает; они появятся в Track 1/2 одновременно с потребляющим кодом и валидирующей схемой.
- Не добавляем `apps/api/.env.example` — API уже читает корневой `.env` через `dotenv` в [`apps/api/src/main.ts`](../../apps/api/src/main.ts) (строки 9-18). Per-app файл потребовал бы менять loader.
- Не подключаем `dotenv-cli`, `--env-file` в npm-скриптах и `@nestjs/config` — это step 033 (Config module + env validation, Track 1).
- Не правим `.prettierignore`: текущий `format` glob в [`package.json`](../../package.json) на `.env*` не таргетится; добавим, только если в step 022 (husky/lint-staged) появится глобальный prettier-проход.

## Dependencies

- Никаких новых npm-пакетов.
- Сохраняются: `dotenv@^17` (уже в [`apps/api/package.json`](../../apps/api/package.json)) и Docker Compose v2 (см. lesson 016).
- Переменные окружения (полный набор шага):

| Variable            | Default                 | Read by                                                                                                 |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `PORT`              | `4000`                  | [`apps/api/src/main.ts`](../../apps/api/src/main.ts) → `resolveInitialPort()`                           |
| `CORS_ORIGINS`      | `http://localhost:3000` | [`apps/api/src/config/cors.config.ts`](../../apps/api/src/config/cors.config.ts) → `buildCorsOptions()` |
| `POSTGRES_USER`     | `blog`                  | [`docker-compose.yml`](../../docker-compose.yml) → service `db`                                         |
| `POSTGRES_PASSWORD` | `blog`                  | [`docker-compose.yml`](../../docker-compose.yml) → service `db`                                         |
| `POSTGRES_DB`       | `blog_dev`              | [`docker-compose.yml`](../../docker-compose.yml) → service `db`                                         |
| `POSTGRES_PORT`     | `5432`                  | [`docker-compose.yml`](../../docker-compose.yml) → port mapping                                         |

## Step-by-Step Changes

1. **Создаём корневой [`.env.example`](../../.env.example).** Разбиваем на две секции с шапками-комментариями: `# ---- API (apps/api) ----` и `# ---- PostgreSQL (docker-compose.yml :: service db) ----`. Над каждой переменной — комментарий с конкретной ссылкой «Read by: путь -> функция», чтобы при чтении было видно, где именно ключ потребляется. Значения совпадают с дефолтами кода и compose — это превращает `cp .env.example .env` в «никаких ручных правок не нужно».
2. **Создаём [`apps/web/.env.example`](../../apps/web/.env.example) как stub.** Только комментарии: документируем разделение `VITE_PUBLIC_*` (виден браузеру) vs без префикса (server-only Nitro/SSR). Делается **отдельным файлом**, а не подсекцией корневого, чтобы случайный `POSTGRES_PASSWORD=...` из корневого `.env` физически не оказался в client-бандле через `import.meta.env`. Это даёт студенту тактильное напоминание: web и API — два разных namespace'а конфигов.
3. **Обновляем [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md).** В разделе «Environment variables» добавляем подсекцию `### .env.example` с workflow `cp .env.example .env` и ссылками на оба файла. В разделе «Local infrastructure (PostgreSQL)» уточняем, что `POSTGRES_*` переопределяются именно через **корневой** `.env`. Переводим указатель «Next roadmap step» с 017 на 018.
4. **Синхронизируем индексы.** [`docs/development-roadmap.md`](../development-roadmap.md): step 017 в Baseline Status и Completed Steps Snapshot. [`docs/learning-path.md`](../learning-path.md), [`docs/README.md`](../README.md): ссылка на этот урок.
5. **Verify.** Запускаем «docs check» из секции [Verification](#verification): файлы под git, `.env` всё ещё в gitignore, `cp .env.example .env && docker compose config` показывает резолвленные значения, regression-тесты API и web остаются зелёными.

## Code Example

Фрагмент корневого [`.env.example`](../../.env.example):

```bash
# ---- API (apps/api) ----
# Initial port for the NestJS API. Auto-increments if busy.
# Read by: apps/api/src/main.ts -> resolveInitialPort()
PORT=4000

# Comma-separated whitelist of allowed CORS origins.
# Read by: apps/api/src/config/cors.config.ts -> buildCorsOptions()
CORS_ORIGINS=http://localhost:3000

# ---- PostgreSQL (docker-compose.yml :: service db) ----
POSTGRES_USER=blog
POSTGRES_PASSWORD=blog
POSTGRES_DB=blog_dev
POSTGRES_PORT=5432
```

Однострочный workflow для нового разработчика:

```bash
cp .env.example .env          # backend + infra
cp apps/web/.env.example apps/web/.env   # web (пока без активных ключей)
npm run db:up                 # docker compose подхватит корневой .env
npm run start:dev             # API подхватит корневой .env через dotenv
```

## Context

К моменту шага 017 в репозитории уже:

- Включён CORS, у API в [`apps/api/src/main.ts`](../../apps/api/src/main.ts) висит `dotenv.config({ path: <root .env> })` (lesson 015).
- Поднимается PostgreSQL через [`docker-compose.yml`](../../docker-compose.yml) с дефолтами `${VAR:-default}` (lesson 016). Compose явно сказал, что **`.env.example` появится в step 017**.
- В обоих `.gitignore` (корневом и [`apps/web/.gitignore`](../../apps/web/.gitignore)) `.env` уже исключён.

Но у проекта нет ни одного коммитнутого артефакта, который бы говорил «вот полный список переменных, чтобы поднять систему». Студент, склонировавший репо, узнаёт о переменных только из текста [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md) — то есть документация и реальный набор могут разъехаться. `.env.example` закрывает эту дыру: это **исполнимый контракт** (можно `cp` и сразу запускать).

## Concept

**Принцип 12-factor «Config in environment».** Конфигурация (всё, что отличается между dev/staging/prod) живёт в переменных окружения, а не в коде и не в коммитах. Из этого вытекает:

- В репозитории — `.env.example` (без секретов, документирующий ключи).
- На машине — `.env` (с реальными значениями, gitignored).
- В CI/проде — переменные окружения раннера/контейнера/секрет-стора.

`.env.example` — это **схема** конфига до того, как мы введём настоящую валидацию через `@nestjs/config` + zod/joi в Track 1. Пока что «валидатор» — это глаза разработчика, который сравнивает таблицу из `LOCAL_SETUP.md` со списком `^[A-Z_]+=` в `.env.example`.

## Code Changes

- [`.env.example`](../../.env.example) — создан: корневой шаблон env с секциями API и Postgres, комментарии «Read by» на каждой переменной.
- [`apps/web/.env.example`](../../apps/web/.env.example) — создан: stub с описанием namespace `VITE_PUBLIC_*` vs server-only.
- [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md) — добавлена подсекция `.env.example` workflow; указатель «Next roadmap step» переведён на 018.
- [`docs/development-roadmap.md`](../development-roadmap.md) — step 017 в Baseline Status и Completed Steps Snapshot.
- [`docs/learning-path.md`](../learning-path.md), [`docs/README.md`](../README.md) — ссылка на `lesson-017-env-example-files.md`.
- `docs/lessons/lesson-017-env-example-files.md` — этот файл.

## Why This Matters

- **Контракт запуска в репозитории.** Новый разработчик/CI/студент видит **полный список** переменных без чтения исходников API и compose-файла.
- **Никаких сюрпризов в проде.** Если кто-то добавит `process.env.X` в код, но забудет про `.env.example`, расхождение моментально ловится PR-ревью и step 022 (husky/lint-staged) сможет это автоматизировать.
- **Защита границы web↔backend.** Отдельный `apps/web/.env.example` физически не даёт «протечь» серверным секретам (`POSTGRES_PASSWORD`, будущий `JWT_SECRET`) в клиентский бандл через `import.meta.env`.
- **Готовность к `@nestjs/config` (Track 1).** Когда появится zod-схема env, она будет валидировать **ровно тот же** список ключей, что и `.env.example` — расхождение поймает `npm run start:dev` фейлом старта.
- **Безопасность по умолчанию.** Дефолты в `.env.example` — это **только dev** значения (`blog`/`blog`/`blog_dev`). Любой prod-deploy обязан переопределить — это явно сказано в комментариях файла.

## Architecture Notes

- **Один корневой `.env.example`, не per-app для backend/infra.** API в [`apps/api/src/main.ts`](../../apps/api/src/main.ts) (строки 9-18) ищет `.env` именно в корне (`__dirname/../../../.env` после сборки в `dist/`, либо `process.cwd()/.env`). Compose тоже читает корень. Шаблон должен лежать там, где приложение его ожидает.
- **Отдельный `.env.example` для web.** TanStack Start под капотом — Vite + Nitro. Vite матчит `VITE_*` префикс и инжектит такие переменные в client-бандл. Объединять backend- и web-конфиг в одном `.env` — путь к утечкам секретов в JS, который скачивает браузер. Граница на уровне файлов — простой и наглядный guardrail.
- **Значения = дефолты кода/compose.** Альтернатива — пустые значения `PORT=`. Отвергнута: студент копирует и не может запустить, пока вручную не подставит то, что и так уже есть как дефолт. Coupling между шаблоном и кодом существует — но это **желательный** coupling: расхождение должно ловиться немедленно.
- **Комментарии «Read by» — это TDD-якорь для будущей валидации.** Когда в step 033 появится zod-схема, каждый комментарий «Read by: path -> function» превратится в очевидный ассерт «этот ключ используется именно в этой функции».
- **Web stub без переменных — осознанный YAGNI.** Альтернатива — добавить `VITE_PUBLIC_API_URL=http://localhost:4000` уже сейчас. Отвергнута: web ещё не ходит в API; ввод переменной создаст «мёртвый» ключ, который никто не читает, и снизит сигнальность шаблона. Добавим вместе с первым `fetch`-вызовом в Track 4.
- **`.env.example` в `format` glob — нет.** [`package.json`](../../package.json) `format` таргетит конкретные пути (`README.md`, `docs`, `apps/api`, ...). `.env.example` туда не входит и Prettier к нему не применяется — у dotenv-синтаксиса нет парсера в Prettier. Если когда-нибудь введём prettier-plugin-sh — добавим.

## Changed Files

| Файл                                                       | Действие                                                    |
| ---------------------------------------------------------- | ----------------------------------------------------------- |
| [`.env.example`](../../.env.example)                       | создан: корневой шаблон env (API + Postgres)                |
| [`apps/web/.env.example`](../../apps/web/.env.example)     | создан: stub с описанием `VITE_PUBLIC_*` vs server-only     |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                 | подсекция `.env.example`; указатель Next roadmap step → 018 |
| [`docs/development-roadmap.md`](../development-roadmap.md) | Step 017 в Baseline Status + Completed Steps Snapshot       |
| [`docs/learning-path.md`](../learning-path.md)             | ссылка на lesson-017 в Phase 1                              |
| [`docs/README.md`](../README.md)                           | step 017 в Completed Lessons                                |
| `docs/lessons/lesson-017-env-example-files.md`             | этот файл                                                   |

## Verification

С корня репозитория («docs check» из roadmap):

```bash
# 1. Оба шаблона трекаются git'ом
git ls-files .env.example apps/web/.env.example

# 2. Реальные .env по-прежнему игнорятся
git check-ignore -v .env apps/web/.env

# 3. Шаблон даёт работоспособный .env "из коробки"
cp .env.example .env
docker compose config            # значения резолвлены из .env, а не из ${VAR:-default}
npm run db:up
docker compose exec db pg_isready -U blog   # accepting connections
npm run db:down
rm .env                          # вернули чистое состояние

# 4. Regression: ничего из кода не сломалось
npx nx run api:test
npx nx run api:test:e2e
npx nx run web:build
npm run format:check
```

Доп. ручная сверка консистентности шаблона и документации:

```bash
grep -E '^[A-Z_]+=' .env.example | cut -d= -f1 | sort
# Ожидаемо: CORS_ORIGINS, PORT, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_PORT, POSTGRES_USER
```

Этот список должен совпадать с объединением таблиц переменных в [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md) (разделы Environment variables + Local infrastructure).

## TDD Sequence

Шаг — **docs/infra only**, рантайм-кода с поведением нет. Это явно разрешено Step Contract в [`docs/development-roadmap.md`](../development-roadmap.md) (п. 5):

> Если шаг по контракту не подразумевает тестируемое поведение (например, миграции структуры/инфраструктуры), явно указать причину и какие проверки выполняются вместо unit-тестов.

Эквивалент TDD-цикла:

- **Red.** До этого шага `test -f .env.example` фейлится; `cp .env.example .env` ругается «no such file». Студент не может однокомандно поднять окружение.
- **Green.** После создания файлов: `cp .env.example .env && docker compose config` показывает резолвленные значения (не `${VAR:-default}`-подстановку); `npm run db:up` + `npm run start:dev` стартуют с переменными из `.env`.
- **Refactor.** Дефолты в [`docker-compose.yml`](../../docker-compose.yml) остаются (`${VAR:-default}`) — compose работает и **без** `.env`. То есть шаблон не вводит обязательной зависимости от файла; это backward-compatibility с workflow из lesson 016.

Полноценные unit/integration тесты на env-валидацию приедут в step 033 (Track 1) вместе с `@nestjs/config` + zod-схемой.

## Definition of Done

- [ ] [`.env.example`](../../.env.example) создан, секции API + Postgres, значения совпадают с дефолтами кода/compose.
- [ ] [`apps/web/.env.example`](../../apps/web/.env.example) создан как stub с описанием `VITE_PUBLIC_*` vs server-only.
- [ ] Этот урок создан и включает все обязательные секции Sprint Lesson Contract.
- [ ] Step 017 присутствует в [`docs/development-roadmap.md`](../development-roadmap.md) (Baseline Status + Completed Steps Snapshot), [`docs/learning-path.md`](../learning-path.md), [`docs/README.md`](../README.md), [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md).
- [ ] `.env` и `apps/web/.env` остаются игнорируемыми (`git check-ignore -v` подтверждает).
- [ ] `cp .env.example .env && npm run db:up` поднимает БД с healthy статусом; после `rm .env` compose всё ещё работает (backward-compat).
- [ ] `npx nx run api:test`, `npx nx run api:test:e2e`, `npx nx run web:build`, `npm run format:check` зелёные.
- [ ] Указатель «Next roadmap step» в [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md) переведён на Step 018.

## What To Remember

- `.env.example` — это **исполнимый контракт запуска**: `cp` + старт = работающее dev-окружение.
- `.env` всегда в `.gitignore`; `.env.example` — всегда коммитится; секреты — никогда.
- Backend и web получают **разные** `.env*` файлы — это физический guardrail против утечек серверных переменных в client-бандл (`VITE_PUBLIC_*` vs server-only).
- Совпадение значений шаблона и дефолтов кода/compose — это фича, не баг: расхождение должно ловиться сразу.

## Verify

```bash
git ls-files .env.example apps/web/.env.example
git check-ignore -v .env apps/web/.env
cp .env.example .env
docker compose config
npm run db:up
docker compose exec db pg_isready -U blog
rm .env
npx nx run api:test
npx nx run api:test:e2e
npx nx run web:build
npm run format:check
```
