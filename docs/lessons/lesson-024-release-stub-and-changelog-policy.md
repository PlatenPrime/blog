# Lesson 024: Release stub and changelog policy

## Learning Goal

Зафиксировать единый, двуязычный (RU/EN) базовый процесс релизов: как вести `CHANGELOG`, как именовать git tags и как проверять готовность релиза без автоматизации пайплайна.

Establish a bilingual (RU/EN) baseline release process: how to maintain `CHANGELOG`, how to name git tags, and how to validate release readiness without pipeline automation.

## Implementation Scope

В скоупе шага:

- Добавить `CHANGELOG.md` как репозиторный stub с начальной структурой.
- Добавить `docs/release-policy.md` с правилами версионирования, тегирования и release checklist.
- Синхронизировать индексные документы, чтобы шаг 024 считался завершенным.

Намеренно **не** делаем в этом шаге:

- CI/CD automation для авто-публикации релизов.
- automatic version bump или release notes generation.
- Подключение `semantic-release`, `changesets` или аналогов.

## Dependencies

- [development-roadmap.md](../development-roadmap.md) как source of truth по шагам.
- Git tags в формате `vMAJOR.MINOR.PATCH`.
- Markdown-документация в `docs/`.

## Step-by-Step Changes

1. Создать `CHANGELOG.md` с минимальной структурой (`Unreleased` + policy notes).
2. Добавить `docs/release-policy.md` с RU/EN правилами: versioning, tags, checklist.
3. Привязать шаг 024 к lesson-index файлам (`README`, `learning-path`, `LOCAL_SETUP`, roadmap snapshot).
4. Проверить, что ссылки между документами консистентны и поиск по `Step 024` возвращает ожидаемые совпадения.

## Code Example

```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

## Context

К шагу 023 репозиторий уже стабилизировал базовые conventions для документации и CI, но не имел формальной release/changelog политики. Это создавало риск разнородного формата заметок к релизам и inconsistent tag naming.

## Concept

Release policy first: сначала фиксируем правила в документации, затем только при необходимости автоматизируем. Такой подход уменьшает риск преждевременной автоматизации неверного процесса.

## Code Changes

- Добавлен [`CHANGELOG.md`](../../CHANGELOG.md) как единая точка истории изменений.
- Добавлен [`docs/release-policy.md`](../release-policy.md) с двуязычными правилами релизов.
- Обновлены index/roadmap документы для фиксации завершения шага 024.

## Why This Matters

Единая release-политика делает изменения прозрачными для команды и упрощает подготовку к продуктовым этапам Track 8 (Delivery and Productization), где релизный процесс становится критическим.

## Architecture Notes

- **Documentation-first workflow.** Процесс релиза определяется текстовым контрактом до внедрения automation.
- **Tag/version contract.** Формат `vMAJOR.MINOR.PATCH` задает стабильную интеграцию с будущими release tools.
- **Incremental adoption.** Текущий шаг минимален и безопасен: меняется только docs layer.

## Changed Files

| File                                                                                                                | Action  |
| ------------------------------------------------------------------------------------------------------------------- | ------- |
| [`docs/lessons/lesson-024-release-stub-and-changelog-policy.md`](./lesson-024-release-stub-and-changelog-policy.md) | created |
| [`CHANGELOG.md`](../../CHANGELOG.md)                                                                                | created |
| [`docs/release-policy.md`](../release-policy.md)                                                                    | created |
| [`docs/development-roadmap.md`](../development-roadmap.md)                                                          | changed |
| [`docs/README.md`](../README.md)                                                                                    | changed |
| [`docs/learning-path.md`](../learning-path.md)                                                                      | changed |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                                                                          | changed |

## Verification

1. Проверить наличие файлов:
   - `CHANGELOG.md`
   - `docs/release-policy.md`
   - `docs/lessons/lesson-024-release-stub-and-changelog-policy.md`
2. Проверить, что в `docs/development-roadmap.md` есть отражение completion шага 024.
3. Проверить, что в `docs/README.md` и `docs/learning-path.md` появился Step 024.
4. Проверить, что в `docs/LOCAL_SETUP.md` следующий шаг сдвинут на `025`.

## TDD Sequence

Шаг документационный, runtime behavior не меняется, поэтому unit-level Red/Green/Refactor не применяется.

- Red equivalent: отсутствие формальной release/changelog политики.
- Green: добавлены policy/stub документы и синхронизированы индексы.
- Refactor: в будущих шагах возможно добавить automation без изменения policy-контракта.

## Definition of Done

- [x] В репозитории есть `CHANGELOG.md` со стартовой структурой.
- [x] В `docs/release-policy.md` зафиксирована двуязычная release/changelog policy.
- [x] Индексные документы синхронизированы и отражают completion Step 024.
- [x] `docs/LOCAL_SETUP.md` указывает следующий шаг `025`.

## What To Remember

- Сначала процесс, потом автоматизация.
- Один формат тегов (`vMAJOR.MINOR.PATCH`) на весь репозиторий.
- Changelog и release policy должны обновляться в том же PR, что и релизный scope.

## Verify

```bash
rg "Step 024|release-policy|lesson-024-release-stub-and-changelog-policy|CHANGELOG" docs CHANGELOG.md
```
