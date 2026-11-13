# Versioning & changelog (Changesets)

Канон semver и changelog для приложения `blog`. Сообщения коммитов — в [`commit-convention.md`](./commit-convention.md). Как катим в production (`main` = prod, required checks) — шаг **095** (`docs/release-policy.md`).

Пакет **не** публикуется в npm (`"private": true`). Changesets нужны для номера версии в `package.json` и корневого `CHANGELOG.md`, не для `npm publish`.

## Когда нужен changeset

Добавляй файл в `.changeset/` в том же PR, если изменение **user-facing**:

| Нужен                                                             | Не нужен                                           |
| ----------------------------------------------------------------- | -------------------------------------------------- |
| `feat` — новая возможность для читателя/админа                    | чистые `docs`                                      |
| `fix` — исправление бага, которое видит пользователь              | `chore` без эффекта на продукт (CI, lint, tooling) |
| breaking / major — несовместимое изменение поведения              | Dependabot bump без user-facing эффекта            |
| заметное изменение UX / контент-модели / публичного API маршрутов | внутренний рефактор без смены поведения            |

CI **не** требует changeset на каждый PR (как и без husky на 093). Политика — дисциплина в PR, не gate в Actions.

## Поток: changeset → bump → changelog

1. В feature-ветке: `npm run changeset` (интерактивно) **или** руками файл в `.changeset/*.md`:

   ```md
   ---
   'blog': patch
   ---

   Short description of the change for CHANGELOG readers.
   ```

   Тип bump: `patch` | `minor` | `major` (semver). Имя пакета — `"blog"` (как в `package.json`).

2. Закоммить changeset-файл вместе с кодом; смержить PR в `main`.

3. На `main` (или в отдельном release-PR): `npm run release`  
   (alias: `npm run changeset:version` → `changeset version`).

4. Changesets:
   - поднимает `version` в [`package.json`](../package.json);
   - дописывает корневой [`CHANGELOG.md`](../CHANGELOG.md);
   - удаляет применённые файлы из `.changeset/` (кроме `config.json` / `README.md`).

5. Закоммить результат: `chore: release x.y.z` (или `chore(release): x.y.z`). Тег / GitHub Release / deploy policy — **095+**, не этот документ.

```text
PR (feat/fix) → .changeset/*.md → merge main
                                      ↓
                         npm run release
                                      ↓
                    package.json + CHANGELOG.md → chore: release
```

## Политика `CHANGELOG.md`

- Канон — **корневой** `CHANGELOG.md`, пишет **только** `changeset version` / `npm run release`.
- Не правь историю уже опубликованных релизов без крайней нужды (опечатка в описании — ок; переписывать смысл — нет).
- Пока ни одного `npm run release` не было, файла может не быть — это нормально; он появится при первом bump.
- Текст в changeset — для людей, читающих changelog, не дубль commit subject один в один (можно чуть яснее).

## Скрипты

| Script                      | Команда                        | Назначение                            |
| --------------------------- | ------------------------------ | ------------------------------------- |
| `npm run changeset`         | `changeset`                    | добавить pending changeset            |
| `npm run changeset:version` | `changeset version`            | применить bump + changelog            |
| `npm run release`           | то же, что `changeset:version` | release script шага 094 (без publish) |

Конфиг: [`.changeset/config.json`](../.changeset/config.json) — `baseBranch: main`, `access: restricted`, `commit: false` (без автокоммитов), `privatePackages.version: true` (иначе CLI 3 пропускает `private` и пишет «No versionable packages found»).

## Связанное

- Conventional Commits: [`commit-convention.md`](./commit-convention.md)
- Стек / релизный трек: [`tech-stack.md`](./tech-stack.md) §13
- PR hint: [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md)
- Production release process — шаг **095**
