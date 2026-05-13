# Lesson 019: CI pipeline baseline (green CI)

## Learning Goal

Закрепить **единый контракт качества** между локальной разработкой и GitHub Actions: тот же Node, что в [`.nvmrc`](../../.nvmrc), те же проверки (tests-first gate, Prettier, ESLint без автофикса, typecheck и build для `api` и `web`, unit и e2e тесты API), воспроизводимые одной командой [`npm run ci`](../../package.json) с корня.

## Implementation Scope

В скоупе шага:

- Один workflow [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (`name: CI`), job `baseline`: checkout с `fetch-depth: 0`, `actions/setup-node` с `node-version-file: '.nvmrc'`, `npm ci`, `git fetch` для диапазона diff (как раньше для `ci:tests-first`), затем по цепочке: `ci:tests-first` → `format:check` → `lint:ci` → `nx run-many -t typecheck -p api -p web` → `nx run-many -t build -p api -p web` → `test` → `test:e2e`.
- Удаление прежнего `.github/workflows/tests-first-gate.yml`, чтобы не дублировать прогоны и не платить за три параллельных `npm ci` без кеша Nx (шаг 020).
- В [`apps/api/package.json`](../../apps/api/package.json): скрипт `lint:ci` — тот же glob, что у `lint`, но **без** `--fix`, с `--max-warnings=0`. Локальный `lint` с `--fix` сохраняем для DX.
- В корневом [`package.json`](../../package.json): `lint:ci` (`nx run api:lint:ci && nx run web:lint`), `ci` — зеркало шагов workflow.
- В [`apps/web/eslint.config.js`](../../apps/web/eslint.config.js): `ignores` для артефактов сборки (`.output/**`, `dist/**`), чтобы `web:lint` не сканировал сгенерированный JS после `web:build`.
- В [`.gitignore`](../../.gitignore): `.output`, чтобы Nitro/Vite output не попадал в коммиты.
- Приведение затронутых файлов к Prettier (если `format:check` уже падал до шага — иначе зелёный CI невозможен).
- Корневой [`README.md`](../../README.md): бейдж CI + строка в «Common commands» для `npm run ci` / `npm run lint:ci`, обновление блока Status.
- Этот урок + синхронизация [`docs/development-roadmap.md`](../development-roadmap.md), [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md) (next step → 020), [`docs/learning-path.md`](../learning-path.md), [`docs/README.md`](../README.md).

Намеренно **не** делаем в этом шаге:

- Remote Nx cache / Nx Cloud — step **020**.
- `nx affected` в CI — step **021**.
- Markdown link checker (lychee и т.п.) — отложено (см. [lesson-018](./lesson-018-root-readme-runbook.md)); рационально совместить с **031** или отдельным chore.
- Матрица ОС/версий Node — **031** (reserve).

## Dependencies

- GitHub Actions (`ubuntu-latest`), `actions/checkout@v6`, `actions/setup-node@v6`, кеш npm.
- Node и npm как в [`.nvmrc`](../../.nvmrc) и `engines` корневого [`package.json`](../../package.json).
- Без новых npm-пакетов.

## Step-by-Step Changes

1. **Заменить workflow.** Добавить `ci.yml` с одним job и полной цепочкой; удалить `tests-first-gate.yml`.
2. **Lint для CI.** `lint:ci` в `apps/api`; корневой `lint:ci` и `ci`.
3. **ESLint web.** Игнор `.output/**` и `dist/**`; `.gitignore` → `.output`.
4. **Prettier.** `npm run format` по репо, пока `npm run format:check` не зелёный.
5. **Документация.** README (бейдж, команды, Status), урок, индексы, roadmap baseline.
6. **Verify.** `npm run ci` локально; на GitHub — зелёный run workflow `CI`.

## Verification

Этот шаг — **инфраструктура**, а не новая бизнес-логика: отдельный unit-тест на YAML не вводим. Вместо этого:

1. `npm run format:check` — exit 0, сообщение о том, что все файлы в стиле Prettier.
2. `npm run lint:ci` — exit 0 для `api` и `web`.
3. `npm run ci` — полная цепочка до конца (включая `test` и `test:e2e`).
4. После push: в GitHub → Actions → workflow **CI** — успешное завершение job `baseline`.

## Changed Files

- [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — новый.
- `.github/workflows/tests-first-gate.yml` — удалён (заменён на `ci.yml`).
- [`package.json`](../../package.json) — `lint:ci`, `ci`.
- [`apps/api/package.json`](../../apps/api/package.json) — `lint:ci`.
- [`apps/web/eslint.config.js`](../../apps/web/eslint.config.js) — ignores для артефактов сборки.
- [`.gitignore`](../../.gitignore) — `.output`.
- Файлы, поправленные Prettier в рамках зелёного `format:check` (список см. `git diff --name-only`).
- [`README.md`](../../README.md) — бейдж, таблица команд, Status.
- [`docs/development-roadmap.md`](../development-roadmap.md), [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md), [`docs/learning-path.md`](../learning-path.md), [`docs/README.md`](../README.md).
- Этот файл [`lesson-019-ci-pipeline-baseline.md`](./lesson-019-ci-pipeline-baseline.md).

## Architecture Notes

**Один job, один `npm ci`.** Baseline проще отлаживать и дешевле по минутам, чем три изолированных job без общего Nx cache. Параллелизация и `affected` — следующие слои.

**Node из `.nvmrc`.** CI и README обещают одну версию; `setup-node` с `node-version-file` убирает дрейф относительно захардкоженного `22`.

**Lint без `--fix` в CI.** Автоисправление на раннере маскирует проблемы и не коммитится; для merge-request достаточно fail-fast с `--max-warnings=0` на API.

**Игнор `.output` в ESLint.** TanStack Start / Nitro кладут бандлы в `apps/web/.output`; без ignore ESLint с type-aware parser падает на JS вне `tsconfig`.

## Definition of Done

- [x] Workflow `CI` в GitHub Actions зелёный на default branch / PR.
- [x] `npm run ci` проходит локально на чистом `npm ci` (после установки зависимостей).
- [x] Roadmap и индексы отражают завершение step 019; `LOCAL_SETUP` указывает на step 020.
- [x] Урок 019 содержит все секции Sprint Lesson Contract.

## Code Example

Фрагмент корневого [`package.json`](../../package.json):

```json
"lint:ci": "nx run api:lint:ci && nx run web:lint",
"ci": "npm run ci:tests-first && npm run format:check && npm run lint:ci && nx run-many -t typecheck -p api -p web && nx run-many -t build -p api -p web && npm test && npm run test:e2e"
```

Бейдж в [`README.md`](../../README.md) (owner/repo подставлены под этот репозиторий; при форке заменить):

```md
[![CI](https://github.com/PlatenPrime/blog/actions/workflows/ci.yml/badge.svg)](https://github.com/PlatenPrime/blog/actions/workflows/ci.yml)
```

## Context

До шага 019 в репозитории уже были Husky + `ci:tests-first` и workflow только с тестами; не проверялись Prettier, lint web, typecheck/build web, версия Node в CI расходилась с `.nvmrc`. Step 019 выравнивает политику и даёт воспроизводимую «дверь качества» перед merge.

## Concept

**CI как контракт, а не украшение.** Pipeline должен быть подмножеством (или эквивалентом) того, что разработчик может запустить локально; иначе красный CI воспринимается как «шум», а зелёный — не гарантирует состояние репо.

## Code Changes

См. [Changed Files](#changed-files).

## Why This Matters

Без единого baseline регрессии в `apps/web` и форматировании проходят review; без выравнивания Node воспроизводимость страдает. Один зелёный workflow снижает стоимость сопровождения и готовит шаги 020–021 (кеш и affected).

## Pitfalls

- Запускать `web:lint` после `web:build` без ignore `.output` — получите ложные ошибки parser.
- Оставить старый workflow параллельно новому — двойные биллы и путаница в статусе.
- Добавлять в CI `api:lint` с `--fix` — непредсказуемое поведение на агентах.

## References

- [GitHub Actions: workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [actions/setup-node: node-version-file](https://github.com/actions/setup-node/blob/main/README.md)
- [lesson-009](./lesson-009-root-scripts-via-nx.md) — Nx-скрипты с корня
- [lesson-018](./lesson-018-root-readme-runbook.md) — отложенный CI badge до 019
