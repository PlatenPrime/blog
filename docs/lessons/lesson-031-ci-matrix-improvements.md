# Lesson 031: CI matrix improvements (reserve)

## Learning Goal

Усилить GitHub Actions workflow **concurrency** (отмена устаревших прогонов на той же ветке) и **matrix** по ОС (`ubuntu-latest`, `windows-latest`), с явным `defaults.run.shell: bash`, чтобы bash-ориентированные шаги (`git fetch`, Nx affected) вели себя одинаково на обоих раннерах.

## Implementation Scope

- Обновить [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml):
  - `concurrency.group` + `cancel-in-progress: true` на уровне workflow.
  - `strategy.matrix.os` и `runs-on: ${{ matrix.os }}`.
  - `defaults.run.shell: bash` на уровне job `baseline`.

Не делаем: дробление на matrix shards по проектам (отдельный шаг при необходимости); не добавляем macOS (дорого и редко ловит уникальные баги для этого стека).

## Dependencies

- Базовый workflow: [lesson-019](./lesson-019-ci-pipeline-baseline.md), affected: [lesson-021](./lesson-021-nx-affected-flow-in-ci.md).

## Step-by-Step Changes

1. Вставить блок `concurrency` сразу после триггеров `on:`.
2. Заменить единичный `runs-on: ubuntu-latest` на matrix + `runs-on: ${{ matrix.os }}`.
3. Добавить `defaults.run.shell: bash` под job.

## Context

Windows-разработчики — часть аудитории репозитория; ранняя проверка на `windows-latest` снижает сюрпризы с путями и shell. Concurrency экономит минуты Actions на быстрых push ветки.

## Architecture Notes

- **Trade-off:** CI время ≈ ×2 в худшем случае (два раннера), зато шире покрытие окружений.
- Кэш-ключ уже содержит `${{ runner.os }}` — коллизий между ОС нет.

## Changed Files

| File                                                                                          | Action  |
| --------------------------------------------------------------------------------------------- | ------- |
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)                                  | changed |
| [`docs/lessons/lesson-031-ci-matrix-improvements.md`](./lesson-031-ci-matrix-improvements.md) | created |
| [`docs/development-roadmap.md`](../development-roadmap.md)                                    | changed |
| [`docs/learning-path.md`](../learning-path.md)                                                | changed |
| [`docs/README.md`](../README.md)                                                              | changed |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                                                    | changed |
| [`README.md`](../../README.md)                                                                | changed |

## Verification

- Локально: `npm run ci` (как раньше).
- На GitHub: зелёный workflow на PR; оба runner-а проходят (после пуша).

## Definition of Done

- [x] `ci.yml` содержит concurrency + matrix + bash default.
- [x] Step 031 отражён в roadmap snapshot.

## Verify

Проверить YAML глазами и дождаться зелёного CI на ветке с этими изменениями.
