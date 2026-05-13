# Lesson 001: Root npm workspaces and orchestration scripts

> **Обновление (шаг 005):** рабочий пакет API теперь `apps/api` с именем `api`; команды `-w api` и пути к `dist` см. в [lesson-005](./lesson-005-nest-apps-api-migration.md). Ниже сохранён смысл урока для исторического контекста (`app/`).

## Learning Goal

Научиться связывать **несколько пакетов** в одном репозитории через **npm workspaces**, чтобы с корня запускать `build`, `test`, `start:dev` без `cd` в каталог пакета. Это основа перед переходом на **Nx** и второе приложение (`apps/web`).

## Implementation Scope

- Добавлен корневой [`package.json`](../../package.json) с полем `workspaces` (изначально `["app"]`, сейчас см. актуальный файл).
- Скрипты корня делегируют в workspace-пакет через `npm run <script> -w <имя_пакета>`.

## Dependencies

- **Node.js** >= 22.12 (задано в `engines`; локально проверьте `node -v`).
- Существующий пакет Nest (сейчас: [`apps/api/`](../../apps/api/)).

## Step-by-Step Changes

1. В корне репозитория создан `package.json` с `private: true` и `workspaces`.
2. В `scripts` добавлены обёртки: `build`, `start`, `start:dev`, `start:prod`, `lint`, `test`, `test:e2e`, `format`.
3. После `npm install` в корне зависимости workspace-пакета поднимаются в корневой `node_modules` (hoist); **`package-lock.json` только в корне** — удалён вложенный lockfile у пакета, чтобы не расходиться с workspaces.

## Architecture Notes

- **Почему workspaces до Nx**: даёт единую точку входа и lockfile на весь монорепо; Nx позже добавит граф задач и кэш, не ломая модель пакетов.
- **Trade-off**: пока один workspace-пакет, выгода — в дисциплине корня и готовности к добавлению `apps/*`.

## Changed Files

| Файл                                                                                    | Действие                                        |
| --------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [`package.json`](../../package.json)                                                    | создан                                          |
| [`docs/development-roadmap.md`](../development-roadmap.md)                              | создан (master roadmap)                         |
| [`docs/lessons/lesson-001-root-npm-workspaces.md`](./lesson-001-root-npm-workspaces.md) | создан (этот урок)                              |
| [`docs/README.md`](../README.md)                                                        | обновлён — ссылка на roadmap                    |
| [`docs/learning-path.md`](../learning-path.md)                                          | обновлён — связь с roadmap                      |
| [`docs/lesson-authoring-guide.md`](../lesson-authoring-guide.md)                        | обновлён — контракт спринта                     |
| [`docs/lessons/lesson-template.md`](./lesson-template.md)                               | обновлён — секции спринта                       |
| [`README.md`](../../README.md)                                                          | создан — быстрый старт с корня                  |
| (исторически) `app/package-lock.json`                                                   | удалён — единый lockfile в корне при workspaces |

## Verification

Из **корня** репозитория (не из каталога пакета):

```bash
npm install
npm run test
npm run test:e2e
npm run build
```

Ожидаемо: тесты и сборка проходят так же, как при запуске из каталога пакета.

Проверка dev-сервера (опционально):

```bash
npm run start:dev
```

Ожидаемо: приложение слушает порт по умолчанию Nest (3000), `GET /` возвращает приветствие.

## Definition of Done

- [ ] `npm install` выполняется из корня без ошибок.
- [ ] `npm run test` из корня — зелёный.
- [ ] `npm run build` из корня — артефакт в `apps/api/dist`.
- [ ] Документация ссылается на шаг 001 в [development-roadmap.md](../development-roadmap.md).

## Context

До урока Nest жил только в отдельном каталоге пакета без корневого оркестратора.

## Concept

**npm workspaces** — механизм npm для монорепо: несколько `package.json` под одним lockfile и общим `node_modules` (с hoisting).

## Code Changes

- Корневой `package.json`: единая точка входа для CI и разработчика.

## Why This Matters

Без корневого workspace следующий шаг (Nx + второе приложение) усложняет onboarding и CI. Один контракт «запускай всё из корня» снижает ошибки.

## What To Remember

- Workspaces требуют **одного** lockfile на корень при типичной настройке.
- `-w <name>` — явное указание пакета для npm run.
- `engines` фиксирует ожидания к Node для команды и CI.

## Homework

Добавьте скрипт `"dev": "npm run start:dev -w api"` в корневой `package.json` и задокументируйте его в README корня (создайте при отсутствии).
