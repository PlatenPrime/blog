# Lesson 026: Optional VS Code recommendations

## Learning Goal

Зафиксировать безопасные workspace-рекомендации для VS Code, чтобы новым участникам было проще подключить одинаковый tooling (lint/format/Nx/Docker/docs) без принудительных персональных настроек.

Establish safe, optional VS Code workspace recommendations so contributors can enable consistent tooling (lint/format/Nx/Docker/docs) without enforcing personal editor preferences.

## Implementation Scope

В скоупе шага:

- Добавить `.vscode/extensions.json` с рекомендациями расширений под текущий стек репозитория.
- Добавить `.vscode/settings.json` только с нейтральными workspace-правилами форматирования/чистоты файлов.
- Синхронизировать индексные документы для фиксации completion Step 026.

Намеренно **не** делаем в этом шаге:

- Обязательные IDE-policy проверки в CI.
- Персональные или OS-специфичные editor-настройки.
- Изменения бизнес-логики API/web приложений.

## Dependencies

- [development-roadmap.md](../development-roadmap.md) как source of truth по шагам.
- VS Code workspace conventions (`.vscode/*` в корне репозитория).
- Текущие quality tools: Nx, ESLint, Prettier, Docker, markdown authoring.

## Step-by-Step Changes

1. Создать `.vscode/extensions.json` и добавить рекомендации расширений под текущий stack.
2. Создать `.vscode/settings.json` с безопасными workspace defaults (`formatOnSave`, финальная новая строка, trim trailing whitespace).
3. Обновить roadmap/lesson-индексы (`docs/README.md`, `docs/learning-path.md`, `docs/LOCAL_SETUP.md`) под completion шага 026.
4. Проверить ссылочную консистентность по `Step 026` и `lesson-026`.

## Code Example

```json
{
  "recommendations": ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"]
}
```

## Context

После шага 025 репозиторий стабилизировал `.gitignore` и workspace hygiene, но onboarding still depended on implicit IDE setup. Optional VS Code recommendations reduce setup friction and improve consistency for docs/code contributors.

## Concept

Editor recommendations should be explicit but non-blocking: repository can suggest tooling through `.vscode/*`, while every developer still controls their user-level preferences.

## Code Changes

- Добавлен [`/.vscode/extensions.json`](../../.vscode/extensions.json) с набором рекомендованных расширений.
- Добавлен [`/.vscode/settings.json`](../../.vscode/settings.json) с нейтральными workspace-defaults.
- Обновлены index/roadmap документы для фиксации completion Step 026.

## Why This Matters

Явные рекомендации для IDE уменьшают расхождения между окружениями разработчиков, ускоряют onboarding и снижают долю “локальных” проблем форматирования/линтинга в PR.

## Architecture Notes

- **Optional-by-design.** Рекомендации не блокируют разработку и не вмешиваются в user-level settings.
- **Workspace consistency.** Нормы форматирования и file hygiene задаются на уровне репозитория.
- **Incremental docs contract.** Каждый шаг roadmap остается трассируемым через lesson + индексные документы.

## Changed Files

| File                                                                                                            | Action  |
| --------------------------------------------------------------------------------------------------------------- | ------- |
| [`docs/lessons/lesson-026-optional-vscode-recommendations.md`](./lesson-026-optional-vscode-recommendations.md) | created |
| [`.vscode/extensions.json`](../../.vscode/extensions.json)                                                      | created |
| [`.vscode/settings.json`](../../.vscode/settings.json)                                                          | created |
| [`docs/development-roadmap.md`](../development-roadmap.md)                                                      | changed |
| [`docs/README.md`](../README.md)                                                                                | changed |
| [`docs/learning-path.md`](../learning-path.md)                                                                  | changed |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                                                                      | changed |

## Verification

1. Проверить наличие файлов:
   - `.vscode/extensions.json`
   - `.vscode/settings.json`
   - `docs/lessons/lesson-026-optional-vscode-recommendations.md`
2. Проверить, что `docs/development-roadmap.md` отражает completion шага 026.
3. Проверить, что в `docs/README.md` и `docs/learning-path.md` появился Step 026.
4. Проверить, что `docs/LOCAL_SETUP.md` указывает следующий шаг `027`.

## TDD Sequence

Шаг инфраструктурно-документационный: runtime behavior приложений не меняется, поэтому unit-level Red/Green/Refactor не применяется.

- Red equivalent: неявный и разнородный IDE setup между разработчиками.
- Green: workspace recommendations зафиксированы и docs синхронизированы.
- Refactor: в будущем можно добавить IDE policy validation, если это станет требованием команды.

## Definition of Done

- [x] В репозитории присутствуют `.vscode/extensions.json` и `.vscode/settings.json`.
- [x] Step 026 добавлен в lesson-индексы и roadmap snapshot.
- [x] `docs/LOCAL_SETUP.md` указывает следующий шаг `027`.
- [x] Поиск по `Step 026`/`lesson-026` подтверждает ссылочную консистентность.

## What To Remember

- Workspace-рекомендации должны быть optional, а не принудительными.
- Репозиторий хранит только нейтральные и командно-полезные IDE defaults.
- Каждый завершенный шаг roadmap требует синхронизации lesson-индексов.

## Verify

```bash
rg "Step 026|lesson-026-optional-vscode-recommendations" docs
```
