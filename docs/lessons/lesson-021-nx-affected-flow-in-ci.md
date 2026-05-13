# Lesson 021: Nx affected flow in CI

## Learning Goal

Перевести CI с полного прогона Nx target-ов на `nx affected`, чтобы запускать `lint`, `typecheck`, `build`, `test` и `test:e2e` только для затронутых проектов в диапазоне `base..head`, сохранив качество проверок и совместимость с кешем из шага 020.

## Implementation Scope

В скоупе шага:

- [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml): вычисление `NX_BASE`/`NX_HEAD` и переход на `npx nx affected -t ...`.
- Этот урок и синхронизация индексов: [`docs/README.md`](../README.md), [`docs/learning-path.md`](../learning-path.md), [`docs/development-roadmap.md`](../development-roadmap.md), [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md).

Намеренно **не** делаем в этом шаге:

- Nx Cloud / remote cache (вне текущего трека foundation).
- Полную смену корневого `npm run ci` на affected-логику (локальный full-run остаётся полезным baseline).
- Сложную матрицу OS/Node и split-by-job стратегию (резервные шаги 031+).

## Dependencies

- Nx `22.7.0` и существующая структура проектов (`api`, `web`, `shared-contracts`).
- GitHub Actions workflow `CI` из предыдущих шагов.
- Полный git history в runner (`fetch-depth: 0`) + `git fetch` remote refs.
- Кеш `.nx/cache` из шага 020.

## Step-by-Step Changes

1. Добавлен шаг `Resolve Nx affected range`, который вычисляет `NX_BASE`/`NX_HEAD`:
   - `pull_request` -> `NX_BASE=origin/${{ github.base_ref }}`;
   - `push` -> `NX_BASE=${{ github.event.before }}` (если валиден), fallback `HEAD~1`;
   - `NX_HEAD=${{ github.sha }}`.
2. Полные Nx-команды в CI заменены на affected-эквиваленты:
   - `nx affected -t lint`
   - `nx affected -t typecheck`
   - `nx affected -t build`
   - `nx affected -t test`
   - `nx affected -t test:e2e`
3. Tests-first gate и `format:check` сохранены как обязательные шаги до affected targets.
4. Обновлены lesson-индексы и roadmap-state для отметки завершения шага 021.

## Verification

Этот шаг инфраструктурный. Unit-тест на YAML не добавляется; проверка идёт через команды и CI logs.

1. `npm run format:check` -> exit 0.
2. Локальный smoke affected-flow (пример):
   - `npx nx affected -t lint --base=HEAD~1 --head=HEAD`
   - `npx nx affected -t typecheck --base=HEAD~1 --head=HEAD`
3. После push/PR открыть GitHub Actions -> workflow `CI`:
   - шаг `Resolve Nx affected range` показывает выбранный диапазон;
   - affected-шаги выполняются только для затронутых проектов;
   - незатронутые проекты пропускаются/кешируются.

## Changed Files

| File                                                                                          | Action  |
| --------------------------------------------------------------------------------------------- | ------- |
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)                                  | changed |
| [`docs/lessons/lesson-021-nx-affected-flow-in-ci.md`](./lesson-021-nx-affected-flow-in-ci.md) | created |
| [`docs/README.md`](../README.md)                                                              | changed |
| [`docs/learning-path.md`](../learning-path.md)                                                | changed |
| [`docs/development-roadmap.md`](../development-roadmap.md)                                    | changed |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                                                    | changed |

## Architecture Notes

`affected` и cache работают на разных слоях:

- `affected` уменьшает множество задач (какие проекты вообще запускать).
- Nx cache уменьшает стоимость задач внутри выбранного множества.

Именно комбинация шагов 020+021 даёт наилучший CI feedback loop без потери quality gate.

## Definition of Done

- [x] CI вычисляет `NX_BASE`/`NX_HEAD` для PR и push.
- [x] Nx targets в CI запускаются через `nx affected`.
- [x] Tests-first и форматирование остаются обязательными перед affected-targets.
- [x] Lesson 021 добавлен в docs-индексы.
- [x] Roadmap/LOCAL_SETUP переведены на следующий шаг 022.

## Code Example

```yaml
- name: Resolve Nx affected range
  shell: bash
  run: |
    if [[ "${{ github.event_name }}" == "pull_request" ]]; then
      NX_BASE="origin/${{ github.base_ref }}"
    elif [[ -n "${{ github.event.before }}" && "${{ github.event.before }}" != "0000000000000000000000000000000000000000" ]]; then
      NX_BASE="${{ github.event.before }}"
    else
      NX_BASE="$(git rev-parse HEAD~1)"
    fi
    echo "NX_BASE=$NX_BASE" >> "$GITHUB_ENV"
    echo "NX_HEAD=${{ github.sha }}" >> "$GITHUB_ENV"
```

## Why This Matters

Монорепо растёт, и полный CI прогон по каждому push быстро становится дорогим. `nx affected` делает pipeline масштабируемым: меняем только то, что затронуто изменениями, при этом сохраняя те же стандарты качества.
