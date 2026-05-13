# Lesson 029: Health smoke script

## Learning Goal

Добавить **минимальный smoke-check** для уже запущенных dev-серверов API и web: один npm-скрипт, который проверяет `GET /` на ожидаемые маркеры в теле ответа, с обходным путём через `curl` для тех, кто предпочитает CLI без Node-логики.

## Implementation Scope

- Создать [`scripts/health-smoke.mjs`](../../scripts/health-smoke.mjs) (Node 22 `fetch`, таймаут 8s, `SKIP_WEB=1` для только API).
- Добавить npm-скрипт `health:smoke` в корневой [`package.json`](../../package.json).
- Документировать эквивалентные `curl` команды в этом уроке.

Не делаем: отдельный `/health` Nest module (появится в Track 1); не поднимаем серверы из скрипта.

## Dependencies

- API отдаёт `Hello World` на `GET /` (см. e2e в `apps/api/test`).
- Web главная содержит строку `TanStack` (см. `apps/web/src/routes/index.tsx`).

## Step-by-Step Changes

1. Добавить `scripts/health-smoke.mjs`.
2. `npm pkg set scripts.health:smoke="node scripts/health-smoke.mjs"` (или эквивалентная правка `package.json`).
3. Обновить индексы и этот урок.

## Code Example

```bash
# Терминал 1: API
npm run start:dev

# Терминал 2: web
npm run web:dev

# Терминал 3
npm run health:smoke
```

Эквивалент вручную (`curl`):

```bash
curl -fsS "http://127.0.0.1:4000/" | findstr /i "Hello"
curl -fsS "http://127.0.0.1:3000/" | findstr /i "TanStack"
```

(На Unix замените `findstr` на `grep`.)

## Context

CI уже гоняет тесты, но разработчику нужен быстрый сигнал «оба сервиса живы» после локальных изменений. Скрипт не заменяет e2e, а дополняет ручной прогон.

## Concept

**Smoke test** — узкий набор проверок «система вообще отвечает». Здесь он намеренно привязан к **текущему** публичному контенту корня.

## Changed Files

| File                                                                                    | Action  |
| --------------------------------------------------------------------------------------- | ------- |
| [`scripts/health-smoke.mjs`](../../scripts/health-smoke.mjs)                            | created |
| [`package.json`](../../package.json)                                                    | changed |
| [`docs/lessons/lesson-029-health-smoke-script.md`](./lesson-029-health-smoke-script.md) | created |
| [`docs/development-roadmap.md`](../development-roadmap.md)                              | changed |
| [`docs/learning-path.md`](../learning-path.md)                                          | changed |
| [`docs/README.md`](../README.md)                                                        | changed |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                                              | changed |
| [`README.md`](../../README.md)                                                          | changed |

## Verification

1. Поднять `npm run start:dev` и `npm run web:dev` (и при необходимости БД — не требуется для этого smoke).
2. `npm run health:smoke` → exit code `0`, в stdout строки `api: OK` и `web: OK`.
3. `npm run format:check`.

## TDD Sequence

Не применимо; поведение скрипта проверяется ручным запуском.

## Definition of Done

- [x] Скрипт и npm-команда существуют.
- [x] Документация описывает env-переопределения базовых URL.

## What To Remember

- Маркеры в теле страницы **хрупкие** — при смене копирайта обновить скрипт или перейти на `/health` в будущем.

## Verify

```bash
npm run health:smoke
```
