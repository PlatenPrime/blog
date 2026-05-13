# Lesson 030: Track 0 acceptance checklist

## Learning Goal

Зафиксировать **единый чеклист приёмки Track 0** (шаги 001–032): команды и документы, которые команда прогоняет перед переходом к **Track 1 — Platform Core**.

## Implementation Scope

- Создать [`docs/track-0-acceptance-checklist.md`](../track-0-acceptance-checklist.md) с группами: toolchain, build/lint/test, infra/env, CI parity, docs/governance, manual smoke, sign-off.
- Связать чеклист с ADR, threat stub, health smoke и roadmap.

Не делаем: автоматизацию «галочек» в CI; это человеческий gate.

## Dependencies

- Шаги 017 (`env`), 019–021 (CI), 027–029 (ADR + smoke).

## Step-by-Step Changes

1. Добавить markdown-файл чеклиста в `docs/`.
2. Добавить ссылку в корневой `README.md` (Documentation map).
3. Обновить roadmap / learning-path / `docs/README` / `LOCAL_SETUP` / этот урок.

## Context

Track 0 большой; без чеклиста легко «почти закрыть» трек с пропущенным `npm run ci` или несогласованным snapshot.

## Concept

**Definition of Done на уровне трека** — надстройка над per-step DoD отдельных уроков.

## Changed Files

| File                                                                                                      | Action  |
| --------------------------------------------------------------------------------------------------------- | ------- |
| [`docs/track-0-acceptance-checklist.md`](../track-0-acceptance-checklist.md)                              | created |
| [`docs/lessons/lesson-030-track-0-acceptance-checklist.md`](./lesson-030-track-0-acceptance-checklist.md) | created |
| [`docs/development-roadmap.md`](../development-roadmap.md)                                                | changed |
| [`docs/learning-path.md`](../learning-path.md)                                                            | changed |
| [`docs/README.md`](../README.md)                                                                          | changed |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                                                                | changed |
| [`README.md`](../../README.md)                                                                            | changed |

## Verification

- `npm run format:check`.
- Пройти чеклист вручную хотя бы частично (например toolchain + `nx show projects`).

## Definition of Done

- [x] Файл чеклиста доступен из README map.
- [x] Step 030 отражён в roadmap snapshot.

## Verify

```bash
npm run format:check
```
