# Lesson 018: Root README + API/web runbook

## Learning Goal

Превратить корневой [`README.md`](../../README.md) и per-app README в **runbook**: документ, по которому новый разработчик (или CI/студент) поднимает обе части системы за одну минуту, не залезая в исходники. Параллельно — закрепить архитектурный приём «documentation as a pyramid»: README (TL;DR + быстрый старт) ⟶ [`LOCAL_SETUP.md`](../LOCAL_SETUP.md) (deep setup) ⟶ [`lessons/`](.) (narrative с trade-offs).

## Implementation Scope

В скоупе шага:

- Полная переработка корневого [`README.md`](../../README.md) под 11-секционный runbook: Title, Stack, Prerequisites, Quick start (60 sec), Project structure, Common commands, Ports & URLs, Environment, Troubleshooting, Status, Documentation map.
- Полная замена [`apps/api/README.md`](../../apps/api/README.md): убран generic Nest-маркетинг (логотип, badges, Discord, Mau, License). Внутри — per-app runbook (Run from root через Nx/npm-w, Environment, Database, See also).
- Полная замена [`apps/web/README.md`](../../apps/web/README.md): сокращены upstream-куски (server functions / API routes / data loaders — это уровень upstream docs). Внутри — per-app runbook (Run from root, Environment с namespace `VITE_PUBLIC_*` vs server-only, Routing, Styling/Testing/Linting, See also).
- Этот урок + кросс-ссылки в индексах ([`docs/development-roadmap.md`](../development-roadmap.md), [`docs/learning-path.md`](../learning-path.md), [`docs/README.md`](../README.md)).
- Сдвиг указателя «Next roadmap step» в [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md) с 018 на 019.

Намеренно **не** делаем в этом шаге:

- Не добавляем CI status-badges в README — CI pipeline появится в step 019; добавлять «битый» бейдж бессмысленно.
- Не пишем ADR-секцию «зачем Nx + TanStack» в README — она оформлена в step 027 как [ADR-000](../adr/000-nx-and-tanstack-start.md) (см. [lesson-027](./lesson-027-adr-000-nx-tanstack-start.md)) и линкуется из корневого README / `docs/adr`.
- Не трогаем содержательно [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md) (кроме указателя на следующий шаг). LOCAL_SETUP — это источник истины для env-таблиц и инфраструктурных команд, и его контракт мы только-что зафиксировали в [lesson-017](./lesson-017-env-example-files.md).
- Не дублируем таблицы переменных окружения в README — README только **ссылается** на [`.env.example`](../../.env.example) и `LOCAL_SETUP.md`. Дубликат — это будущий drift.
- Не добавляем `apps/web/.env.example`-таблицу переменных — там пока только stub-комментарии (см. lesson-017).
- Не пишем тесты на ссылки в markdown (markdown-link-check / lychee) — это инфраструктурный шаг, который рациональнее делать вместе с CI в step 019.

## Dependencies

- Никаких новых npm-пакетов.
- Никаких новых переменных окружения.
- Все три README попадают в существующий Prettier `format`-glob (см. [`package.json`](../../package.json) → `scripts.format`/`format:check`): `README.md`, папка `apps/api` (включая её `README.md`), и явный путь `"apps/web/README.md"`.

## Step-by-Step Changes

1. **Переписываем корневой [`README.md`](../../README.md).** Все 11 секций. Quick start даёт однозначную последовательность: `nvm use → npm install → cp .env.example .env → cp apps/web/.env.example apps/web/.env → npm run db:up → npm run start:dev → npm run web:dev`. В таблице «Common commands» помечено, какие команды идут через Nx (`build`/`test`/`test:e2e`/`lint`), а какие напрямую через `npm -w` (`start`/`start:dev`/`start:prod`/`web:dev`). Это снимает путаницу — она существует, потому что в [`package.json`](../../package.json) скрипты неоднородные.
2. **Переписываем [`apps/api/README.md`](../../apps/api/README.md).** Удаляем 99 строк маркетингового NestJS-стартера. Добавляем три коротких блока: «Run (preferred — from repo root)», «Run (workspace-local, отладка)», «Environment» с точечной ссылкой на [`src/main.ts`](../../apps/api/src/main.ts) (строки 9-18 — dotenv loader) и [`src/config/cors.config.ts`](../../apps/api/src/config/cors.config.ts). Секция «Database» отсылает к compose с корня. Секция «See also» — обратные ссылки на root README, roadmap, релевантные уроки (005, 013, 015, 016, 017).
3. **Переписываем [`apps/web/README.md`](../../apps/web/README.md).** Удаляем upstream-куски (server functions / API routes / Data Fetching / Layout пример) — их место в [tanstack.com/start](https://tanstack.com/start), а не в нашем runbook'е. Оставляем то, что **специфично для нашего monorepo**: Run from root через Nx, Vite namespace contract (`VITE_PUBLIC_*` vs server-only — это критический guardrail безопасности), file-based routing (один абзац), одно предложение про Styling/Testing/Linting, See also (уроки 010-014, 017).
4. **Создаём этот урок.** Используем [lesson-template.md](./lesson-template.md) как каркас; добавляем все обязательные секции Sprint Lesson Contract из [lesson-authoring-guide.md](../lesson-authoring-guide.md).
5. **Синхронизируем индексы.** [`docs/development-roadmap.md`](../development-roadmap.md): добавляем «Step 018 completed» в Baseline Status и ссылку на этот файл в Completed Steps Snapshot. [`docs/learning-path.md`](../learning-path.md): Step 018 в Phase 1. [`docs/README.md`](../README.md): Step 018 в Completed Lessons. [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md): «Next roadmap step» → 019.
6. **Verify.** Прогоняем секцию [Verification](#verification): Prettier-проход, Nx-тесты API, build web, смоук Quick start через `db:up → pg_isready → db:down`.

## Code Example

Фрагмент новой таблицы «Common commands» из корневого [`README.md`](../../README.md), который показывает, что часть скриптов проходит через Nx, а часть — через `npm -w`:

```md
| Цель              | npm-скрипт             | Под капотом                                             |
| ----------------- | ---------------------- | ------------------------------------------------------- |
| Старт API (watch) | `npm run start:dev`    | `npm run start:dev -w api` → `nest start --watch`       |
| Unit-тесты API    | `npm run test`         | `nx run api:test`                                       |
| Build API         | `npm run build`        | `nx run api:build` (dependsOn `shared-contracts:build`) |
| Dev-сервер web    | `npm run web:dev`      | `npm run dev -w web` → Vite на `:3000`                  |
| Build web         | `npx nx run web:build` | Vite + Nitro production-сборка                          |
```

И из per-app [`apps/api/README.md`](../../apps/api/README.md) — то же различение «через что идёт команда»:

```md
npm run start:dev # npm -w api run start:dev -> nest start --watch
npm run test # nx run api:test -> vitest run
```

## Context

К моменту шага 018 в репозитории уже:

- Собран monorepo: [`apps/api`](../../apps/api/) (NestJS 11, lesson 005), [`apps/web`](../../apps/web/) (TanStack Start, lesson 010), [`libs/shared-contracts`](../../libs/shared-contracts/) (lesson 012-014).
- Поднят quality-стек: ESLint flat (lesson 007), Prettier (lesson 008), npm-скрипты через Nx (lesson 009), `web:typecheck` (lesson 011).
- Поднимается PostgreSQL через [`docker-compose.yml`](../../docker-compose.yml) (lesson 016).
- Зафиксирован контракт `.env.example` (lesson 017).

Но сам [`README.md`](../../README.md) на момент 018 — это 24 строки, написанные где-то после шага 010, который не знает ни про БД, ни про `.env.example`. Студент, склонировавший репо, видит только «есть API и web, читай LOCAL_SETUP», но не получает однокомандный «git clone + следуй runbook → работает». Аналогично, per-app README — это вообще нетронутые upstream-стартеры (Nest и TanStack Start), они дают информацию **про фреймворки**, а не про **наш monorepo**.

## Concept

**Documentation as a pyramid.** Любая нетривиальная репа имеет три уровня документации, и смешивать их — антипаттерн:

```
          ┌────────────────────────────┐
          │  README.md  (top-of-funnel)│   ← «что это, как запустить за 60 сек, куда читать дальше»
          └─────────────┬──────────────┘
                        │
          ┌─────────────┴──────────────┐
          │  LOCAL_SETUP.md / runbooks │   ← глубокие env-таблицы, инфра, troubleshooting
          └─────────────┬──────────────┘
                        │
          ┌─────────────┴──────────────┐
          │  lessons/*.md  (narrative) │   ← «почему именно так», trade-offs, ADR
          └────────────────────────────┘
```

- Каждый слой имеет уникальную аудиторию (новичок / разработчик / архитектор-студент) и уникальный «вопрос», на который он отвечает.
- Дублирование контента между слоями — это **гарантированный drift**: один обновили, другой забыли. Поэтому README **ссылается** на LOCAL_SETUP вместо копирования таблицы env-переменных.

**Per-app README ≠ upstream-маркетинг.** README workspace'а — это контракт workspace'а, а не реклама фреймворка. У него ровно три задачи:

1. Сказать, что это за app в нашем monorepo (роль, имя в Nx-графе).
2. Показать команды запуска **с правильного entry point** — с корня через Nx (для CI/кеширования).
3. Показать workspace-local команды как escape hatch для отладки.

Всё остальное (как работает TanStack Router, как писать `createServerFn`) — это upstream-документация, и её надо линковать, а не копировать.

## Code Changes

- [`README.md`](../../README.md) — переписан целиком: 11 секций runbook'а; добавлены таблицы Stack/Commands/Ports/Troubleshooting; удалены устаревшие минимальные команды.
- [`apps/api/README.md`](../../apps/api/README.md) — переписан целиком: удалён generic NestJS-маркетинг (логотип, badges, Discord, Mau); добавлены Run from root / workspace-local / Environment с точечными ссылками на [`src/main.ts`](../../apps/api/src/main.ts) и [`src/config/cors.config.ts`](../../apps/api/src/config/cors.config.ts) / Database / See also.
- [`apps/web/README.md`](../../apps/web/README.md) — переписан целиком: удалены upstream-куски (server functions / API routes / Layout example / Data Fetching); добавлены Run from root / workspace-local / Environment с namespace-контрактом / Routing (одна ссылка на upstream) / Styling-Testing-Linting / See also.
- [`docs/development-roadmap.md`](../development-roadmap.md) — Step 018 в Baseline Status + ссылка в Completed Steps Snapshot.
- [`docs/learning-path.md`](../learning-path.md) — Step 018 в Phase 1.
- [`docs/README.md`](../README.md) — Step 018 в Completed Lessons.
- [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md) — указатель «Next roadmap step» переведён на 019.
- `docs/lessons/lesson-018-root-readme-runbook.md` — этот файл.

## Why This Matters

- **README как single source of truth для онбординга.** До шага 018 первое впечатление от репо — «небольшой стартер с одной командой `start:dev`». После — полноценный fullstack-runbook с явными портами, env, Docker, troubleshooting. Это меняет дискурс разговора с любым новым контрибьютором.
- **Чёткое разделение «через Nx» vs «через `npm -w`».** В нашем [`package.json`](../../package.json) скрипты неоднородные: `start:dev` идёт напрямую (Nest CLI владеет watch'ем), а `test`/`build`/`lint` идут через Nx (нужен кеш и `dependsOn`). Без явной таблицы в README студент рано или поздно спросит «а почему `npm run start:dev` не кешируется?» — мы заранее отвечаем.
- **Safety guardrail для web env.** Явный блок про `VITE_PUBLIC_*` vs server-only в [`apps/web/README.md`](../../apps/web/README.md) — это первая линия защиты против будущей утечки `JWT_SECRET` в client-бандл. Когда в Track 2 появятся серверные секреты, этот блок будет уже на месте.
- **Заготовка под CI.** Когда в step 019 появится pipeline, в README уже есть слот «Status» — туда добавится бейдж без структурных правок.
- **Backward-compat для существующих ссылок.** Все ранее коммитнутые ссылки на `docs/lessons/lesson-NNN-*.md`, на [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md), на [`docs/README.md`](../README.md) остаются валидными — README ничего не переименовывает, только добавляет внешний слой.

## Architecture Notes

- **README не дублирует roadmap.** Альтернатива — встроить таблицу шагов в root README (популярная практика). Отвергнута: roadmap — это «живой» документ (обновляется каждый шаг), а README в идеале меняется редко. Дубль таблиц гарантирует drift между Baseline Status и Completed Lessons. Поэтому в README — только короткий блок «Status» + ссылка.
- **README не дублирует env-таблицы.** Альтернатива — повторить таблицу `PORT` / `CORS_ORIGINS` / `POSTGRES_*` в README для удобства. Отвергнута по тому же drift-аргументу: источник истины — [`.env.example`](../../.env.example) (исполнимый контракт) + [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md) (таблица для людей). README только ссылается.
- **Per-app README — короткие (≤80 строк).** Альтернатива — большие подробные README в каждом app. Отвергнута: дублирует root README и LOCAL_SETUP, плюс upstream-документация уже исчерпывающая. Roли разделены: per-app говорит только то, что не сказано выше — имя в Nx-графе, точечные ссылки на код, escape hatch команды.
- **Документация Tailwind/Vitest/ESLint — одна строка каждое.** Альтернатива — пересказать конфигурацию. Отвергнута: конфиги живут в коде ([`apps/web/vite.config.ts`](../../apps/web/vite.config.ts), [`eslint.config.mjs`](../../eslint.config.mjs)), их назначение очевидно из имени файла. README не учебник.
- **Команды форматируются с выравниванием по 80+ колонкам в кодоблоках.** Markdown-таблицы и code-fences специально написаны так, чтобы Prettier (без overrides — см. [`.prettierrc`](../../.prettierrc)) не переформатировал их. Если в будущем добавим `prose-wrap: "always"` — пройдёмся отдельным шагом.
- **Quick start — это команды, а не текст.** Альтернатива — сначала длинный абзац, потом команды. Отвергнута: 60-секундный runbook должен начинаться с команд, объяснения — после. Это паттерн «show, then tell» для онбординга.

## Changed Files

| Файл                                                       | Действие                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| [`README.md`](../../README.md)                             | переписан как полноценный runbook (11 секций)                 |
| [`apps/api/README.md`](../../apps/api/README.md)           | переписан как per-app runbook (удалён generic Nest-маркетинг) |
| [`apps/web/README.md`](../../apps/web/README.md)           | переписан как per-app runbook (удалены upstream-куски)        |
| [`docs/development-roadmap.md`](../development-roadmap.md) | Step 018 в Baseline Status + Completed Steps Snapshot         |
| [`docs/learning-path.md`](../learning-path.md)             | ссылка на lesson-018 в Phase 1                                |
| [`docs/README.md`](../README.md)                           | Step 018 в Completed Lessons                                  |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                 | указатель Next roadmap step → 019                             |
| `docs/lessons/lesson-018-root-readme-runbook.md`           | этот файл                                                     |

## Verification

С корня репозитория («review» из roadmap):

```bash
# 1. Все три README трекаются и читаются как markdown
git ls-files README.md apps/api/README.md apps/web/README.md
git diff --stat README.md apps/api/README.md apps/web/README.md docs/

# 2. Quick start из README действительно работает
nvm use
npm install
cp .env.example .env
npm run db:up
docker compose exec db pg_isready -U blog   # accepting connections
npm run db:down
rm .env

# 3. Regression - ничего не сломано
npx nx run api:test
npx nx run api:test:e2e
npx nx run web:build
npx nx run web:typecheck

# 4. Prettier проходит по всем трём README (они в format glob)
npm run format:check

# 5. Markdown-ссылки на существующие файлы (ручная сверка)
grep -E '\]\(([^)]+)\)' README.md apps/api/README.md apps/web/README.md
```

Доп. ручная проверка консистентности README ↔ `package.json`:

```bash
# В таблице "Common commands" должны быть только реально существующие скрипты
node -e "console.log(Object.keys(require('./package.json').scripts).sort().join('\n'))"
```

## TDD Sequence

Шаг — **docs only**, рантайм-кода с поведением нет. Это явно разрешено п. 5 Step Contract в [`docs/development-roadmap.md`](../development-roadmap.md):

> Если шаг по контракту не подразумевает тестируемое поведение (например, миграции структуры/инфраструктуры), явно указать причину и какие проверки выполняются вместо unit-тестов.

Эквивалент TDD-цикла:

- **Red.** До шага: `wc -l README.md` ≈ 24 строки; в README нет упоминания `db:up`, `web:dev`, `.env.example`, портов 3000/5432, troubleshooting. Студент после `git clone` не имеет однокомандного пути к работающему dev-окружению.
- **Green.** После шага: Quick start даёт исполнимую последовательность; per-app README указывают, как запускать каждый app через канонический entry point (Nx с корня); все ссылки в README ведут на существующие файлы.
- **Refactor.** Per-app README ужаты до ≤80 строк, дублирующий с root README/LOCAL_SETUP контент удалён; форматирование стабильно проходит `npm run format:check` без правок.

Полноценные тесты на ссылки в markdown (markdown-link-check / lychee) подключим в step 019 (CI baseline), когда они будут запускаться в pipeline.

## Definition of Done

- [ ] [`README.md`](../../README.md) переписан и содержит все 11 секций: Title, Stack, Prerequisites, Quick start, Project structure, Common commands, Ports & URLs, Environment, Troubleshooting, Status, Documentation map.
- [ ] [`apps/api/README.md`](../../apps/api/README.md) переписан: нет generic Nest-маркетинга; есть Run from root / workspace-local / Environment (со ссылками на код) / Database / See also.
- [ ] [`apps/web/README.md`](../../apps/web/README.md) переписан: нет крупных upstream-кусков; есть Run from root / workspace-local / Environment с namespace-контрактом / Routing / Styling-Testing-Linting / See also.
- [ ] Этот урок создан и включает все обязательные секции Sprint Lesson Contract.
- [ ] Step 018 присутствует в [`docs/development-roadmap.md`](../development-roadmap.md) (Baseline Status + Completed Steps Snapshot), [`docs/learning-path.md`](../learning-path.md), [`docs/README.md`](../README.md).
- [ ] Указатель «Next roadmap step» в [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md) переведён на 019.
- [ ] `npm run format:check`, `npx nx run api:test`, `npx nx run api:test:e2e`, `npx nx run web:build`, `npx nx run web:typecheck` — зелёные.
- [ ] Все markdown-ссылки в новых README ведут на существующие файлы (ручная сверка).

## What To Remember

- README — это **top-of-funnel runbook**, а не учебник. Quick start — это команды, объяснения — после.
- Документация — пирамида: README → LOCAL_SETUP → lessons. Каждый слой имеет уникальную аудиторию; дублирование между слоями = гарантированный drift.
- Per-app README говорит только то, что специфично для **нашего** monorepo: имя в Nx-графе, run-команды с правильного entry point, escape hatch для отладки. Upstream-доку — ссылаем, не копируем.
- В нашем [`package.json`](../../package.json) скрипты неоднородные: `build`/`test`/`lint` идут через Nx, `start:dev`/`web:dev` — через `npm -w`. README обязан это явно показывать.

## Verify

```bash
git ls-files README.md apps/api/README.md apps/web/README.md
npm run format:check
npx nx run api:test
npx nx run api:test:e2e
npx nx run web:build
npx nx run web:typecheck
cp .env.example .env
npm run db:up
docker compose exec db pg_isready -U blog
npm run db:down
rm .env
```
