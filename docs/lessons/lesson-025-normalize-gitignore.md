# Lesson 025: Normalize .gitignore

## Learning Goal

Зафиксировать предсказуемую политику игнорирования локальных и кэш-артефактов, чтобы рабочее дерево оставалось чистым и в коммиты не попадали временные файлы окружения.

## Implementation Scope

В скоупе шага:

- Нормализовать корневой `.gitignore` по логическим секциям.
- Явно покрыть runtime/cache-артефакты Nx (`.nx/cache`, `.nx/workspace-data`).
- Синхронизировать lesson-индексы и roadmap под завершение шага 025.

Намеренно **не** делаем в этом шаге:

- Изменения бизнес-логики API/web приложений.
- Внедрение CI-валидации `.gitignore` (можно отдельным шагом).
- Массовую миграцию игноров в подпроектах при отсутствии необходимости.

## Dependencies

- [development-roadmap.md](../development-roadmap.md) как source of truth по шагам.
- Локальные Nx runtime-файлы (`.nx/workspace-data/*`, daemon logs/hash outputs).
- Базовые git-команды (`git status --short`) для smoke-проверки результата.

## Step-by-Step Changes

1. Привести `.gitignore` к секционной структуре: dependencies/env/build/logs/Nx/OS.
2. Добавить явные правила для типовых debug логов (`npm/yarn/pnpm`) и Nx runtime-data.
3. Сохранить существующие полезные исключения репозитория (например, `!.env.example`).
4. Обновить индексные docs-файлы, чтобы шаг 025 считался завершенным.
5. Проверить, что `git status` больше не показывает Nx runtime-мусор.

## Code Example

```bash
git status --short
```

## Context

После шага 024 в репозитории уже есть release/changelog policy, но в рабочем дереве оставался шум от локальных Nx runtime-файлов. Это повышает риск случайного коммита временных артефактов.

## Concept

`.gitignore` должен описывать только локально-генерируемые файлы и кэши, а не скрывать важные исходники. Нормализация секций делает правила читаемыми и безопасными при дальнейшем расширении.

## Code Changes

- Обновлен [`/.gitignore`](../../.gitignore): добавлены секции, унифицированы паттерны, усилено покрытие логов и локальных Nx-артефактов.
- Обновлены docs-индексы для фиксации completion Step 025.

## Why This Matters

Чистый `git status` ускоряет ежедневную разработку, снижает вероятность ошибочных коммитов и упрощает ревью, потому что в diff попадают только осознанные изменения.

## Architecture Notes

- **Workspace hygiene first.** Корневой `.gitignore` рассматривается как контракт developer experience.
- **Least surprise.** Правила сгруппированы по назначению, чтобы изменения можно было вносить безопасно.
- **Stable Nx workflow.** Локальные Nx cache/runtime artifacts игнорируются единообразно для всех участников.

## Changed Files

| File                                                                                    | Action  |
| --------------------------------------------------------------------------------------- | ------- |
| [`docs/lessons/lesson-025-normalize-gitignore.md`](./lesson-025-normalize-gitignore.md) | created |
| [`.gitignore`](../../.gitignore)                                                        | changed |
| [`docs/development-roadmap.md`](../development-roadmap.md)                              | changed |
| [`docs/README.md`](../README.md)                                                        | changed |
| [`docs/learning-path.md`](../learning-path.md)                                          | changed |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                                              | changed |

## Verification

1. Выполнить `git status --short` и убедиться, что Nx runtime-файлы не отображаются как untracked.
2. Проверить наличие урока `docs/lessons/lesson-025-normalize-gitignore.md`.
3. Проверить, что Step 025 добавлен в `docs/README.md` и `docs/learning-path.md`.
4. Проверить, что `docs/LOCAL_SETUP.md` указывает следующий шаг `026`.
5. Проверить, что roadmap snapshot отражает completion шага 025.

## TDD Sequence

Шаг инфраструктурно-документационный: поведение приложений runtime не меняется, поэтому unit-level Red/Green/Refactor неприменим.

- Red equivalent: `git status` показывает шумные локальные артефакты.
- Green: `.gitignore` нормализован, шум убран, docs синхронизированы.
- Refactor: при росте репозитория можно добавить автоматическую проверку hygiene-правил в CI.

## Definition of Done

- [x] Корневой `.gitignore` структурирован и покрывает локальные Nx/runtime артефакты.
- [x] Step 025 добавлен в lesson-индексы и roadmap snapshot.
- [x] `docs/LOCAL_SETUP.md` указывает следующий шаг `026`.
- [x] Проверка `git status --short` подтверждает clean-status для шумных локальных файлов.

## What To Remember

- `.gitignore` — часть инженерного контракта команды, а не “мусорная корзина”.
- Игнорируем только воспроизводимые локальные артефакты.
- Любой новый шаг в roadmap требует синхронного обновления docs-индексов.

## Verify

```bash
git status --short
rg "Step 025|lesson-025-normalize-gitignore|Normalize \\.gitignore" docs
```
