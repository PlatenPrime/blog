# Lesson 023: Lessons folder structure conventions

## Learning Goal

Зафиксировать единый стандарт структуры и именования файлов в `docs/lessons`, чтобы новые уроки добавлялись предсказуемо, проверялись быстро и не ломали навигацию в документации.

## Implementation Scope

В скоупе шага:

- Описать конвенции именования уроков (`lesson-NNN-kebab-case.md`) и назначение ключевых файлов.
- Задокументировать минимальный контракт содержимого урока (обязательные секции).
- Зафиксировать правила обновления индексов документации при добавлении нового урока.

Намеренно **не** делаем в этом шаге:

- Автоматическую генерацию уроков через CLI/скрипты.
- Линтер или CI-валидатор структуры уроков (может быть отдельным шагом).

## Dependencies

- [development-roadmap.md](../development-roadmap.md) как источник истины по шагам.
- [lesson-template.md](./lesson-template.md) как базовый шаблон контента.
- Markdown-редактор и git diff для ревью структуры.

## Step-by-Step Changes

1. Зафиксировать, что каждый урок хранится в `docs/lessons` и именуется строго как `lesson-NNN-topic.md`.
2. Описать, что `NNN` всегда трехзначный, совпадает с шагом roadmap и не переиспользуется.
3. Определить, что `topic` пишется в `kebab-case` и отражает цель шага, а не внутренние детали реализации.
4. Закрепить обязательные разделы урока на основе Step Contract из roadmap.
5. Указать, что после создания нового урока синхронно обновляются `docs/README.md`, `docs/learning-path.md` и `docs/LOCAL_SETUP.md` (если меняется next step).

## Code Example

```text
docs/lessons/
  lesson-template.md
  lesson-022-optional-husky-lint-staged-policy.md
  lesson-023-lessons-folder-structure-conventions.md
```

## Context

К шагу 022 в репозитории уже есть серия уроков, но правила структуры не были явно вынесены в отдельный шаг. Это повышает риск дрейфа формата при добавлении новых материалов.

## Concept

Единые соглашения по структуре документации снижают операционные издержки: любой участник команды быстрее понимает, где искать урок, как его назвать и какие индексы обновить.

## Code Changes

- Добавлен урок со структурными конвенциями для папки `docs/lessons`.
- Обновлены навигационные документы, чтобы шаг 023 был отмечен как завершенный.

## Why This Matters

Документация становится масштабируемой только при стабильных правилах. Конвенции для `docs/lessons` предотвращают рассинхрон roadmap и lesson-индексов и упрощают review новых шагов.

## Architecture Notes

- **Single source of truth.** Номер шага берется из `development-roadmap.md`, а не придумывается локально.
- **Predictable naming.** `lesson-NNN-kebab-case.md` обеспечивает сортировку, предсказуемые ссылки и простые grep/rg-проверки.
- **Synchronized indexes.** Индексные документы обновляются в том же PR, что и новый урок, чтобы не накапливать технический долг в навигации.

## Changed Files

| File                                                                                                                      | Action  |
| ------------------------------------------------------------------------------------------------------------------------- | ------- |
| [`docs/lessons/lesson-023-lessons-folder-structure-conventions.md`](./lesson-023-lessons-folder-structure-conventions.md) | created |
| [`docs/development-roadmap.md`](../development-roadmap.md)                                                                | changed |
| [`docs/README.md`](../README.md)                                                                                          | changed |
| [`docs/learning-path.md`](../learning-path.md)                                                                            | changed |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                                                                                | changed |

## Verification

1. Проверить наличие файла `docs/lessons/lesson-023-lessons-folder-structure-conventions.md`.
2. Проверить, что Step 023 добавлен в `docs/README.md` и `docs/learning-path.md`.
3. Проверить, что `docs/LOCAL_SETUP.md` указывает следующий шаг `024`.
4. Проверить, что в `docs/development-roadmap.md` есть отметка `Step 023 completed` в Baseline Status.

## TDD Sequence

Шаг документационный, runtime-поведение приложения не меняется, поэтому unit-level Red/Green/Refactor не применяется.

- Red equivalent: правила структуры уроков не были явно закреплены отдельным шагом.
- Green: добавлен урок с конвенциями и синхронизированы индексы.
- Refactor: в будущих шагах можно вынести проверку структуры в CI.

## Definition of Done

- [x] В `docs/lessons` есть урок `lesson-023-...` с формализованными конвенциями.
- [x] Название и номер шага синхронизированы с roadmap.
- [x] Индексы уроков (`README`, `learning-path`) обновлены.
- [x] `LOCAL_SETUP.md` переведен на следующий шаг `024`.

## What To Remember

- Номер урока всегда равен номеру шага в roadmap.
- Именование файлов должно оставаться предсказуемым (`lesson-NNN-kebab-case.md`).
- Любой новый урок требует синхронного обновления индексов документации.

## Verify

```bash
rg "Step 023|lesson-023-lessons-folder-structure-conventions" docs
```
