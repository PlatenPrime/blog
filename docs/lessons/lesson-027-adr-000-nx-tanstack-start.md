# Lesson 027: ADR-000 — why Nx + TanStack Start

## Learning Goal

Зафиксировать **архитектурное решение уровня репозитория**: почему монорепо использует **Nx** поверх npm workspaces и **TanStack Start** для `apps/web`, в формате ADR, чтобы README и уроки не дублировали длинные обоснования и чтобы отклонения в будущем оформлялись отдельными ADR (roadmap step 032).

## Implementation Scope

В скоупе шага:

- Создать [`docs/adr/000-nx-and-tanstack-start.md`](../adr/000-nx-and-tanstack-start.md) (ADR-000) со структурой Status / Context / Decision / Consequences / Alternatives.
- Создать [`docs/adr/README.md`](../adr/README.md) — короткий индекс каталога ADR.
- Синхронизировать roadmap, learning-path, `docs/README.md`, `LOCAL_SETUP.md`, корневой `README.md`.
- Обновить [lesson-018](./lesson-018-root-readme-runbook.md): явная ссылка на ADR там, где ранее обещали step 027.

Намеренно **не** делаем в этом шаге:

- Не меняем код API/web и не добавляем runtime-поведение.
- Не переписываем весь README под архитектурный разбор — только точечные ссылки и статус трека.
- Не вводим автоматический markdown-link-check в CI.

## Dependencies

- Завершённые шаги 003–004, 009–014, 018–021 (контекст Nx, TanStack Start, CI cache/affected).
- [development-roadmap.md](../development-roadmap.md) как описание целевой системы.

## Step-by-Step Changes

1. Добавить `docs/adr/000-nx-and-tanstack-start.md` с принятым статусом и ссылками на уроки внедрения.
2. Добавить `docs/adr/README.md` с таблицей индекса ADR.
3. Создать этот урок (`lesson-027-…`).
4. Обновить `docs/development-roadmap.md`: Baseline Status (Step 027 completed), Completed Steps Snapshot (вставить недостающие 023, 026 и новую строку 027 в числовом порядке).
5. Обновить `docs/learning-path.md`, `docs/README.md`, `docs/LOCAL_SETUP.md` (следующий шаг → 028), корневой `README.md` (Documentation map + Status).
6. В `lesson-018` добавить прямую ссылку на ADR-000 в пункте про отложенное обоснование.

## Code Example

Фрагмент оглавления ADR (идея, не дословная копия файла):

```markdown
## Decision

1. Use Nx as the monorepo task runner…
2. Use TanStack Start for apps/web…
```

## Context

К [lesson-018](./lesson-018-root-readme-runbook.md) мы намеренно **не** помещали длинное «зачем Nx + TanStack Start» в README: это уровень **ADR**, а README остаётся runbook. К шагу 027 инфраструктура и CI уже опираются на Nx; `apps/web` уже собран как TanStack Start — осталось формализовать решение для читателей и для будущих отклонений.

## Concept

**Architecture Decision Record (ADR)** — короткий документ: контекст, решение, последствия и отвергнутые альтернативы. Он дополняет **уроки** (как мы делали пошагово) и **README** (как запустить), не заменяя их.

## Code Changes

- Новый каталог `docs/adr/` с ADR-000 и индексом.
- Обновления индексной документации и одной фразы в lesson-018.

## Why This Matters

Без канонического ADR обоснование размазывается по README и чатам и **расходится** с кодом. ADR даёт одну точку правды для вопросов «почему не Next.js», «почему не только turbo», «почему один web-app на public+admin».

## Architecture Notes

- **NestJS** как API остаётся в скоупе roadmap, но не пересматривается в ADR-000 (см. секцию Out of scope в ADR).
- **Отклонения** от выбранного стека оформляются новыми ADR и шагом 032 reserve.

## Changed Files

| File                                                                                                | Action  |
| --------------------------------------------------------------------------------------------------- | ------- |
| [`docs/adr/000-nx-and-tanstack-start.md`](../adr/000-nx-and-tanstack-start.md)                      | created |
| [`docs/adr/README.md`](../adr/README.md)                                                            | created |
| [`docs/lessons/lesson-027-adr-000-nx-tanstack-start.md`](./lesson-027-adr-000-nx-tanstack-start.md) | created |
| [`docs/development-roadmap.md`](../development-roadmap.md)                                          | changed |
| [`docs/learning-path.md`](../learning-path.md)                                                      | changed |
| [`docs/README.md`](../README.md)                                                                    | changed |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                                                          | changed |
| [`README.md`](../../README.md)                                                                      | changed |
| [`docs/lessons/lesson-018-root-readme-runbook.md`](./lesson-018-root-readme-runbook.md)             | changed |

## Verification

Шаг **документальный**: unit-тесты на поведение приложений не добавляем (нет изменяемого runtime-контракта).

1. `npm run format:check` — зелёный.
2. `rg "Step 027|lesson-027-adr-000|000-nx-and-tanstack-start" docs README.md` — ожидаемые вхождения в индексах и ссылках.

## TDD Sequence

Не применимо: нет нового проверяемого кода API/web. Эквивалент проверки — форматирование markdown и ссылочная согласованность индексов.

## Definition of Done

- [x] ADR-000 и `docs/adr/README.md` присутствуют.
- [x] Урок 027 создан; roadmap baseline и snapshot отражают Step 027 (snapshot пополнен шагами 023 и 026, если отсутствовали).
- [x] `docs/LOCAL_SETUP.md` указывает следующий шаг **028**.
- [x] Корневой `README.md` ссылается на ADR и показывает актуальный «последний завершённый шаг».
- [x] `lesson-018` содержит ссылку на ADR-000.

## What To Remember

- ADR отвечает на **why**, уроки — на **how**, README — на **how to run**.
- Одно решение — один номер; смена решения — новый ADR, а не silent edit истории.

## Verify

```bash
npm run format:check
rg "Step 027|lesson-027-adr-000|000-nx-and-tanstack-start" docs README.md
```
