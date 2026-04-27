# Lesson 003: Nx init in the monorepo root

> **Обновление (шаг 005):** проект Nx теперь называется `api` и лежит в `apps/api/`. Исторически на шаге 003 проект назывался `app`; актуальные цели: `nx run api:*`.

## Learning Goal

Подключить **Nx** к существующему npm workspaces монорепо так, чтобы граф задач и целевые команды (`nx run api:build` и т.д.) работали **без переноса** Nest-приложения из `app/` (перенос в `apps/api` — отдельные шаги roadmap).

## Implementation Scope

- Выполнена команда инициализации: `npx nx@latest init --interactive=false --nxCloud=false`.
- В корне появились **`nx.json`**, зависимости **`nx`**, **`@nx/eslint`**, **`@nx/jest`** (версия **22.7.0** на момент шага).
- Плагины Nx подхватывают скрипты workspace-пакета **`api`** (проект в графе называется **`api`**).
- В [`.gitignore`](../../.gitignore) добавлены шаблоны для **экспорта графа** (`nx graph --file=...`) и каталога `static/`, чтобы случайно не закоммитить артефакты проверки.
- В корневой [`package.json`](../../package.json) добавлены удобные скрипты `nx`, `nx:show`, `nx:graph`, `nx:build`.

Не входит: перенос `app` → `apps/api`, `project.json`, Nx Cloud, унификация ESLint на корне (шаги **004–008**).

## Dependencies

- Уже установленный корневой npm workspace (шаг **001**).
- Сеть для `npx nx@latest init`.

## Step-by-Step Changes

1. Из корня репозитория: `npx nx@latest init --interactive=false --nxCloud=false`.
2. Убедиться, что `npx nx show projects` выводит **`api`**.
3. Проверить `npx nx run api:build`, `api:test`, `api:test:e2e`, `api:lint` (на шаге 003 имена были `app:*`).
4. (Опционально) Экспорт графа: `npx nx graph --file=nx-graph.html` — файлы не коммитим; при необходимости удалить и полагаться на `.gitignore`.
5. Добавить npm-скрипты-обёртки в корневой `package.json` для документации в README.

## Code Example

Проверка графа проектов:

```bash
npx nx show projects
```

Сборка через Nx (эквивалентно `npm run build -w api`, но с кэшем Nx при повторных запусках):

```bash
npx nx run api:build
```

## Context

До шага 003 команды шли через `npm run … -w <workspace>` без графа задач Nx. Nx даёт единый CLI и задел под кэш, `affected` и несколько приложений.

## Concept

**Nx** — оркестратор монорепо: знает проекты, зависимости между ними и цели (`build`, `test`, …). Режим **inference** подключает цели из `package.json` скриптов workspace-пакетов через плагины (`@nx/jest`, `@nx/eslint`).

## Code Changes

- См. таблицу **Changed Files**.

## Why This Matters

Без Nx сложнее масштабировать репозиторий на `apps/web`, `libs/*` и единый CI. Ранняя инициализация фиксирует «точку сборки» до крупных миграций каталогов.

## Architecture Notes

- **Почему без Nx Cloud на шаге 003**: минимум внешних сервисов; кэш можно включить позже (roadmap **020**).
- **Почему в корень добавлены `@nx/eslint` и `@nx/jest`**: авто-рекомендация `nx init` для уже существующих eslint/jest в пакете API. Унификация версий ESLint между корнем и пакетом API — отдельное решение (возможен дрейф: корень тянет eslint 8.x для плагинов Nx, пакет API остаётся на eslint 9 — см. `npm audit` / последующие шаги).
- **Trade-off**: корневые `devDependencies` раздуваются; зато `nx run api:*` работает из коробки.

## Changed Files

| Файл                                                            | Действие                                    |
| --------------------------------------------------------------- | ------------------------------------------- |
| [`nx.json`](../../nx.json)                                      | создан                                      |
| [`package.json`](../../package.json)                            | изменён — `devDependencies`, скрипты `nx:*` |
| [`package-lock.json`](../../package-lock.json)                  | изменён — lock после `nx init`              |
| [`.gitignore`](../../.gitignore)                                | изменён — игнор экспорта `nx graph`         |
| [`docs/development-roadmap.md`](../development-roadmap.md)      | обновлён — baseline, выполненные шаги       |
| [`docs/README.md`](../README.md)                                | обновлён — прогресс, Nx команды             |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                      | обновлён — раздел про Nx                    |
| [`docs/learning-path.md`](../learning-path.md)                  | обновлён — ссылка на урок 003               |
| [`README.md`](../../README.md)                                  | обновлён — команды Nx                       |
| [`docs/lessons/lesson-003-nx-init.md`](./lesson-003-nx-init.md) | создан (этот файл)                          |

## Verification

```bash
npx nx --version
npx nx show projects
npx nx run api:build
npx nx run api:test
npx nx run api:test:e2e
npm run test
npm run build
```

Ожидаемо:

- `nx show projects` содержит **`api`**.
- Все цели завершаются успешно; существующие корневые `npm run test` / `build` остаются зелёными.

Экспорт графа (опционально, файлы не коммитить):

```bash
npx nx graph --file=nx-graph.html
```

## Definition of Done

- [ ] В корне есть `nx.json` и зависимость `nx`.
- [ ] `npx nx show projects` показывает проект `api`.
- [ ] `npx nx run api:build` и `npm run build` с корня успешны.
- [ ] Урок и roadmap обновлены.

## What To Remember

- Имя Nx-проекта совпадает с **`name`** в [`apps/api/package.json`](../../apps/api/package.json) (`api`).
- `nx init` — не переносит папки; только инфраструктура графа.
- Артефакты `nx graph --file=...` не храним в git.

## Verify

```bash
npx nx show projects && npx nx run api:build && npm run test
```

## Homework

Выполните `npx nx graph` (интерактивный просмотр) или экспорт с `--file=` и убедитесь, что в графе одна нода `api`; опишите в комментарии к коммиту, какие цели (`build`, `test`, …) вы видите на рёбрах/панели (для будущего сравнения после появления `web`).
