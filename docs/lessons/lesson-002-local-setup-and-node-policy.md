# Lesson 002: Node/npm policy and LOCAL_SETUP

## Learning Goal

Зафиксировать **воспроизводимый toolchain** (Node + npm) для монорепо: одинаковые версии у разработчиков и в CI, явная документация локального запуска и жёсткая проверка через `engines` + `engine-strict`.

## Implementation Scope

- Добавлены файлы версий: [`.nvmrc`](../../.nvmrc), [`.node-version`](../../.node-version) → **20.18.0**.
- Корневой [`.npmrc`](../../.npmrc): `engine-strict=true`.
- Расширены `engines` и поле `packageManager` в корневом [`package.json`](../../package.json).
- Документ [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md) — единая инструкция по окружению и командам.
- Обновлены ссылки в [`docs/README.md`](../README.md), [`README.md`](../../README.md), [`development-roadmap.md`](../development-roadmap.md).

Не входит: установка Nx, Docker, CI — следующие шаги roadmap.

## Dependencies

- Node.js **20.18.0** (рекомендуемая точка в `.nvmrc`; минимум в `engines`: `>=20.10.0`).
- npm **>= 10** (рекомендуется версия из `packageManager`).

## Step-by-Step Changes

1. Создан `.nvmrc` / `.node-version` с `20.18.0` для nvm и fnm.
2. Добавлен `.npmrc` с `engine-strict=true`, чтобы `npm install` падал при несовместимом Node/npm.
3. В `package.json` уточнены `engines` (верхняя граница Node `<23`, npm `>=10`) и `packageManager: npm@10.8.2` для явной фиксации линии npm (Corepack / документация).
4. Написан `docs/LOCAL_SETUP.md` с проверками версий и таблицей команд из корня.
5. Roadmap и README ссылаются на новый документ и отмечают выполнение шага 002.

## Code Example

`.npmrc`:

```ini
engine-strict=true
```

## Context

После шага 001 команды запускаются из корня, но без зафиксированных версий Node/npm возможны расхождения и «works on my machine».

## Concept

**Policy as code**: `engines` + `engine-strict` переносят договорённости о версиях из чата в артефакты репозитория. Файлы `.nvmrc` / `.node-version` дают одну команду для переключения версии.

## Code Changes

- См. таблицу **Changed Files** ниже.

## Why This Matters

Nest 11, будущий Nx и TanStack Start предполагают современный Node и npm workspaces v2+. Ранняя строгость экономит часы отладки CI и локальных окружений.

## Architecture Notes

- **Почему 20.18.0 в `.nvmrc`**: единая рекомендуемая точка для команды и CI; совпадает с LTS Node 20 и npm 10.
- **Почему в `engines` только нижняя граница**: разработчики на Node 22/24 LTS не получают ложный `EBADENGINE`, если их версия новее; риск микроскопических расхождений снижается выравниванием через CI на версии из `.nvmrc`.
- **Trade-off**: без верхней границы в `engines` возможны редкие несовместимости на «слишком новой» версии — ловим их в CI и уроках, при необходимости ужесточаем `engines` осознанно (ADR).

## Changed Files

| Файл                                                       | Действие                                  |
| ---------------------------------------------------------- | ----------------------------------------- |
| [`.nvmrc`](../../.nvmrc)                                   | создан                                    |
| [`.node-version`](../../.node-version)                     | создан                                    |
| [`.npmrc`](../../.npmrc)                                   | создан                                    |
| [`package.json`](../../package.json)                       | изменён — `engines`, `packageManager`     |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                 | создан                                    |
| [`docs/README.md`](../README.md)                           | изменён — ссылка на LOCAL_SETUP, прогресс |
| [`README.md`](../../README.md)                             | изменён — ссылка на LOCAL_SETUP           |
| [`docs/development-roadmap.md`](../development-roadmap.md) | изменён — baseline, выполненные шаги      |
| [`docs/learning-path.md`](../learning-path.md)             | изменён — ссылка на урок 002              |
| `docs/lessons/lesson-002-local-setup-and-node-policy.md`   | создан (этот файл)                        |

## Verification

Из корня после `nvm use` (или эквивалента):

```bash
node -v
npm -v
npm install
npm run test
```

Ожидаемо:

- `node -v` → `v20.18.0` (если следуете `.nvmrc`) или любая версия в диапазоне `engines`.
- `npm install` завершается без `EBADENGINE` при допустимых версиях.
- `npm run test` — зелёный.

## Definition of Done

- [ ] Существуют `.nvmrc`, `.node-version`, `docs/LOCAL_SETUP.md`.
- [ ] В корневом `package.json` заданы `engines` и `packageManager`.
- [ ] `engine-strict=true` в корневом `.npmrc`.
- [ ] `npm install` и `npm run test` с корня проходят на машине с версией из политики.

## What To Remember

- Версия Node — часть контракта репозитория, не «личная настройка».
- `engine-strict` ловит проблемы на этапе `npm install`, а не в рантайме.
- Документ `LOCAL_SETUP.md` снижает порог входа для следующих участников.

## Verify

```bash
node -v && npm -v && npm install && npm run test
```

## Homework

Добавьте в `docs/LOCAL_SETUP.md` короткий подраздел «Проверка под Windows PowerShell» с примером вывода `node -v` и ссылкой на nvm-windows, если ваш основной OS — Windows.
