# Lesson 032: ADR process for deviations (reserve)

## Learning Goal

Оформить **политику смены архитектурных решений** отдельным ADR, чтобы отклонения от [ADR-000](../adr/000-nx-and-tanstack-start.md) не затирали историю и оставались аудируемыми.

## Implementation Scope

- Создать [`docs/adr/001-process-for-architectural-deviations.md`](../adr/001-process-for-architectural-deviations.md).
- Обновить [`docs/adr/README.md`](../adr/README.md) — строка индекса для **001**.
- Закрыть Track 0 в narrative (README Status → шаг **032**, следующий трек — **033**).

Не делаем: реальное архитектурное отклонение от Nx/TanStack (это будущий ADR с новым номером при необходимости).

## Dependencies

- [ADR-000](../adr/000-nx-and-tanstack-start.md), [lesson-027](./lesson-027-adr-000-nx-tanstack-start.md).

## Step-by-Step Changes

1. Авторинг ADR-001 (Status, Context, Decision, Consequences, References).
2. Индекс ADR + roadmap + learning-path + `docs/README` + `LOCAL_SETUP` + корневой README.

## Context

Roadmap явно резервирует шаг 032 под обновления ADR при отклонениях; даже если отклонений ещё не было, **процесс** должен быть задокументирован заранее.

## Concept

**Superseding ADR** — новый документ, который отменяет или сужает старый, вместо редактирования прошлого «задним числом».

## Changed Files

| File                                                                                                         | Action  |
| ------------------------------------------------------------------------------------------------------------ | ------- |
| [`docs/adr/001-process-for-architectural-deviations.md`](../adr/001-process-for-architectural-deviations.md) | created |
| [`docs/adr/README.md`](../adr/README.md)                                                                     | changed |
| [`docs/lessons/lesson-032-adr-process-deviations.md`](./lesson-032-adr-process-deviations.md)                | created |
| [`docs/development-roadmap.md`](../development-roadmap.md)                                                   | changed |
| [`docs/learning-path.md`](../learning-path.md)                                                               | changed |
| [`docs/README.md`](../README.md)                                                                             | changed |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                                                                   | changed |
| [`README.md`](../../README.md)                                                                               | changed |

## Verification

- `npm run format:check`.
- Индекс ADR открывается и содержит строки **000** и **001**.

## Definition of Done

- [x] ADR-001 и обновлённый индекс.
- [x] Step 032 в snapshot; `LOCAL_SETUP` указывает на **033** / Track 1.

## Verify

```bash
npm run format:check
```
