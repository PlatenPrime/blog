# Lesson 028: Threat model stub

## Learning Goal

Добавить **заготовку threat model** в репозиторий: зафиксировать границы доверия, активы и заготовки под STRIDE **до** появления auth/CMS, чтобы Track 7 не начинался с пустого листа.

## Implementation Scope

В скоупе шага:

- Создать [`docs/security/threat-model-stub.md`](../security/threat-model-stub.md) (англоязычный stub: assets, trust boundaries, adversary classes, STRIDE prompts, out-of-scope).
- Синхронизировать индексы roadmap / learning-path / `docs/README` / `LOCAL_SETUP` / корневой `README` (см. [Changed Files](#changed-files)).

Намеренно **не** делаем:

- Не проводим формальный risk scoring, не подключаем внешние security scanners в CI.
- Не меняем код API/web.

## Dependencies

- Контекст стека: [ADR-000](../adr/000-nx-and-tanstack-start.md).
- Порты и env: [`LOCAL_SETUP.md`](../LOCAL_SETUP.md).

## Step-by-Step Changes

1. Создать каталог `docs/security/` и файл `threat-model-stub.md` по структуре Status / System in scope / Trust boundaries / Adversaries / STRIDE table / Out of scope / References.
2. Добавить ссылку в корневой `README.md` (Documentation map) и при необходимости в [`docs/README.md`](../README.md).
3. Обновить [`development-roadmap.md`](../development-roadmap.md) (baseline + Completed Steps Snapshot).
4. Создать этот урок.

## Code Example

Фрагмент trust boundary (упрощённо):

```text
Browser --> apps/web --> apps/api --> PostgreSQL
```

## Context

Track 0 закрывает инфраструктуру и документацию; угрозы уже существуют (CORS, секреты, CI tokens), но полный threat model откладывался. Stub даёт общий язык для уроков по security позже.

## Concept

**Threat modeling** — явное описание того, что защищаем и от кого; STRIDE — мнемоника категорий угроз. Stub ≠ полный анализ.

## Code Changes

- Новый markdown в `docs/security/`.

## Why This Matters

Без заготовки команда обсуждает security точечно и несогласованно. Один файл-якорь снижает риск забыть целые классы угроз при проектировании auth и публикаций.

## Architecture Notes

- Документ **намеренно** на английском: совместимость с внешними security review и общепринятыми терминами.
- Расширение модели привязываем к Track 7 в roadmap.

## Changed Files

| File                                                                                | Action  |
| ----------------------------------------------------------------------------------- | ------- |
| [`docs/security/threat-model-stub.md`](../security/threat-model-stub.md)            | created |
| [`docs/lessons/lesson-028-threat-model-stub.md`](./lesson-028-threat-model-stub.md) | created |
| [`docs/development-roadmap.md`](../development-roadmap.md)                          | changed |
| [`docs/learning-path.md`](../learning-path.md)                                      | changed |
| [`docs/README.md`](../README.md)                                                    | changed |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                                          | changed |
| [`README.md`](../../README.md)                                                      | changed |

## Verification

- `npm run format:check`.
- Файл `docs/security/threat-model-stub.md` существует; ссылки из README открываются относительно корня репо.

## TDD Sequence

Не применимо (документация).

## Definition of Done

- [x] Stub threat model добавлен.
- [x] Индексы отражают завершение Step 028.

## What To Remember

- Stub должен оставаться коротким и честным про «TBD».
- Расширение модели = отдельные шаги / уроки, не бесконечное раздувание одного файла.

## Verify

```bash
npm run format:check
```
