# Lesson 055: Track 1 acceptance checklist

## Learning Goal

Зафиксировать **единый чеклист приёмки Track 1** (шаги 033–054): команды и документы, которые команда прогоняет перед переходом к **Track 2 — Auth and Identity**.

## Implementation Scope

- Создать [`docs/track-1-acceptance-checklist.md`](../track-1-acceptance-checklist.md) с группами: prerequisites, build/test, config, health, errors, request context/logs, observability, API surface, lifecycle, CI parity, manual smoke, documentation, sign-off.
- Связать чеклист с уроками 033–054, health/shutdown smoke scripts и roadmap.

Не делаем: автоматизацию «галочек» в CI; это человеческий gate.

## Dependencies

- Track 0 closed ([`track-0-acceptance-checklist.md`](../track-0-acceptance-checklist.md)).
- Шаги 033–054 (platform API surface).

## Step-by-Step Changes

1. Добавить markdown-файл чеклиста в `docs/`.
2. Добавить ссылку в корневой `README.md` и [`docs/README.md`](../README.md).
3. Обновить roadmap / learning-path / `LOCAL_SETUP` / storytelling / этот урок.

## Context

Track 1 охватывает config, health, errors, logging, tracing, metrics, versioning и shutdown. Без чеклиста легко пропустить readiness с Postgres, contract-тесты ошибок или `shutdown:smoke`.

## Concept

**Definition of Done на уровне трека** — надстройка над per-step DoD отдельных уроков 033–054.

## Changed Files

| File                                                                                                      | Action  |
| --------------------------------------------------------------------------------------------------------- | ------- |
| [`docs/track-1-acceptance-checklist.md`](../track-1-acceptance-checklist.md)                              | created |
| [`docs/lessons/lesson-055-track-1-acceptance-checklist.md`](./lesson-055-track-1-acceptance-checklist.md) | created |
| [`docs/development-roadmap.md`](../development-roadmap.md)                                                | changed |
| [`docs/learning-path.md`](../learning-path.md)                                                            | changed |
| [`docs/README.md`](../README.md)                                                                          | changed |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                                                                | changed |
| [`docs/storytelling.md`](../storytelling.md)                                                              | changed |
| [`README.md`](../../README.md)                                                                            | changed |

## Verification

- `npm run format:check`.
- Пройти чеклист вручную хотя бы частично (например `shared-contracts:build` + `api:test` + `shutdown:smoke`).

## Definition of Done

- [x] Файл чеклиста доступен из README map.
- [x] Step 055 отражён в roadmap snapshot.
- [x] Storytelling и индексы синхронизированы.

## Verify

```bash
npm run format:check
npx nx run shared-contracts:build
npx nx run api:test
npx nx run api:build
npm run shutdown:smoke
```
