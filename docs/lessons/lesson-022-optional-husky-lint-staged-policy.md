# Lesson 022: Optional husky/lint-staged policy

## Learning Goal

Усилить локальные quality gates до коммита и push: оставить tests-first policy, добавить `lint-staged` для форматирования/линта/staged-тестов и ввести быстрый pre-push guard на `nx affected`.

## Implementation Scope

В скоупе шага:

- Добавление `lint-staged` и npm-скриптов для pre-commit/pre-push flow.
- Обновление husky hooks: `pre-commit` и `pre-push`.
- Добавление скрипта `scripts/run-staged-tests.mjs` для запуска `nx affected -t test` по staged файлам.
- Документация шага в уроке, индексах и roadmap.

Намеренно **не** делаем в этом шаге:

- Блокирующий full CI перед push (`npm run ci`) - слишком дорого для локального цикла.
- Nx Cloud integration и cross-machine cache policy.
- Workflow-уровневые изменения GitHub Actions (это уже покрыто шагами 019-021).

## Dependencies

- Husky `^9.0.0` (уже подключен в репозитории).
- `lint-staged` `^16.4.0` (новая devDependency).
- Nx `22.7.0` для `nx affected` в локальных guard-командах.

## Step-by-Step Changes

1. Добавлен `lint-staged` и npm scripts:
   - `precommit:lint-staged`
   - `prepush:quick-check`
2. Добавлен конфиг `lint-staged`:
   - Prettier на staged source/docs/config файлах;
   - ESLint для `apps/api` и `apps/web`;
   - запуск `node scripts/run-staged-tests.mjs`.
3. Обновлен `.husky/pre-commit`: запускается `node scripts/husky-pre-commit.mjs` (tests-first + lint-staged через Node без `npm run`).
4. Добавлен `.husky/pre-push` с быстрым affected guard через `node scripts/husky-pre-push.mjs`.
5. Добавлен `scripts/run-staged-tests.mjs`, который берет staged файлы и запускает affected unit tests только для затронутого графа Nx.

## Code Example

```json
"precommit:lint-staged": "lint-staged --concurrent=false --relative",
"prepush:quick-check": "node scripts/husky-pre-push.mjs"
```

## Context

Шаги 019-021 уже выстроили CI baseline, кеш и affected flow на GitHub Actions. Следующий логичный слой - ранняя локальная защита до того, как изменения попадут в remote.

## Concept

`lint-staged` ускоряет feedback loop: вместо полного прогона по проекту проверяются только staged файлы и связанный с ними affected-graph тестов.

## Code Changes

- [`package.json`](../../package.json): scripts + `lint-staged` config + dependency.
- [`.husky/pre-commit`](../../.husky/pre-commit): вызывает [`scripts/husky-pre-commit.mjs`](../../scripts/husky-pre-commit.mjs).
- [`.husky/pre-push`](../../.husky/pre-push): вызывает [`scripts/husky-pre-push.mjs`](../../scripts/husky-pre-push.mjs).
- [`scripts/run-staged-tests.mjs`](../../scripts/run-staged-tests.mjs): запуск staged-aware `nx affected -t test`.

## Why This Matters

Большинство ошибок дешевле ловить до push. Локальные hooks снижают шум в PR/CI и закрепляют единый инженерный ритуал качества для монорепо.

## Architecture Notes

- **Разделение pre-commit и pre-push.** Pre-commit фокусируется на staged-контексте, pre-push - на легком регрессионном барьере.
- **Nx affected по staged files.** Этот подход минимизирует время проверки, сохраняя привязку к dependency graph.
- **Strict policy без full CI локально.** Полный gate остается в CI, локально используем быстрый фильтр.
- **Не использовать `npm run` внутри hook-скриптов.** В части окружений (JetBrains + Git через WSL relay, минимальные образы) npm может пытаться запустить `/bin/bash`; если bash недоступен, коммит падает с `execvpe(/bin/bash) failed`. Оркестрация через `node ...` обходит этот класс ошибок.

## Changed Files

| File                                                                                                                | Action  |
| ------------------------------------------------------------------------------------------------------------------- | ------- |
| [`package.json`](../../package.json)                                                                                | changed |
| [`.husky/pre-commit`](../../.husky/pre-commit)                                                                      | changed |
| [`.husky/pre-push`](../../.husky/pre-push)                                                                          | created |
| [`scripts/husky-pre-commit.mjs`](../../scripts/husky-pre-commit.mjs)                                                | created |
| [`scripts/husky-pre-push.mjs`](../../scripts/husky-pre-push.mjs)                                                    | created |
| [`scripts/run-staged-tests.mjs`](../../scripts/run-staged-tests.mjs)                                                | created |
| [`docs/lessons/lesson-022-optional-husky-lint-staged-policy.md`](./lesson-022-optional-husky-lint-staged-policy.md) | created |
| [`docs/README.md`](../README.md)                                                                                    | changed |
| [`docs/learning-path.md`](../learning-path.md)                                                                      | changed |
| [`docs/development-roadmap.md`](../development-roadmap.md)                                                          | changed |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                                                                          | changed |

## Verification

1. `npm run format:check` -> все файлы соответствуют Prettier.
2. `npm run precommit:tests-first` -> tests-first policy проходит/блокирует корректно.
3. `node scripts/husky-pre-commit.mjs` (при staged файлах) -> тот же оркестратор, что и в hook.
4. `node scripts/husky-pre-push.mjs` -> quick affected guard.

## TDD Sequence

Шаг инфраструктурный: runtime-контракт приложения не меняется, поэтому классический Red/Green/Refactor для unit-level поведения не применяется.

- Red equivalent: pre-commit запускал только tests-first, без авто-проверок formatting/lint/tests.
- Green: добавить `lint-staged` и pre-push quick gate.
- Refactor: вынести staged-тесты в отдельный скрипт для повторного использования и читаемости.

## Definition of Done

- [x] Husky pre-commit запускает tests-first + lint-staged.
- [x] В проекте есть pre-push quick-check для affected lint/test.
- [x] `lint-staged` покрывает форматирование, линт и staged-тесты.
- [x] Урок 022 добавлен в индексы и roadmap.
- [x] Next step в `LOCAL_SETUP.md` переведен на 023.

## What To Remember

- Hooks должны быть быстрыми, иначе команда начнет их обходить.
- `affected` + staged files хорошо масштабируются для monorepo.
- CI остается финальным источником истины, hooks - это ранний фильтр.

## Verify

```bash
npm run format:check
node scripts/husky-pre-commit.mjs
node scripts/husky-pre-push.mjs
```
