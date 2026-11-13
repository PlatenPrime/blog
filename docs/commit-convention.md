# Conventional Commits

Канон сообщений коммитов для этого репозитория. Enforcement: **Commitlint** в CI на каждый `pull_request` (шаг **093**). Локальный git hook (husky) не используем.

Формат:

```text
<type>(optional-scope): <description>
```

Subject — в императиве, без точки в конце; первая строка ≤ 72 символов (правила `@commitlint/config-conventional`).

## Типы (часто используемые)

| Type       | Когда                                                          |
| ---------- | -------------------------------------------------------------- |
| `feat`     | Новая возможность для пользователя                             |
| `fix`      | Исправление бага                                               |
| `docs`     | Только документация                                            |
| `chore`    | Обслуживание (deps, CI, tooling), без смены поведения продукта |
| `refactor` | Перестройка кода без смены поведения                           |
| `test`     | Только тесты                                                   |
| `style`    | Форматирование / стиль без логики                              |
| `perf`     | Улучшение производительности                                   |
| `ci`       | Только CI/CD конфиг                                            |
| `build`    | Сборка / бандл / внешние зависимости сборки                    |

Breaking change: `!` после type/scope (`feat!: …`) или footer `BREAKING CHANGE:`.

## Примеры

**Хорошо**

```text
feat: add commitlint CI gate
fix(media): reject oversized uploads
docs: document conventional commits
chore(deps): bump eslint
```

**Плохо** (CI / commitlint отклонит)

```text
updated stuff
Fix bug
FEAT: Add Thing
feat: Add thing.
```

## Локальная проверка

Одно сообщение из stdin:

```bash
echo "feat: add commitlint" | npx commitlint
echo "bad message" | npx commitlint   # expect fail
```

Range как в CI (замените SHA):

```bash
npx commitlint --from <base-sha> --to <head-sha> --verbose
```

Или script: `npm run commitlint -- --from <base-sha> --to <head-sha> --verbose`.

## CI

Job `commitlint` в [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) на `pull_request`:

- `fetch-depth: 0`
- `npx commitlint --from <PR base.sha> --to <PR head.sha> --verbose`

На `push` в `main` job не гоняется (история уже смержена). Job `quality` (lint / format / typecheck / unit) без изменений.

## Dependabot

В [`.github/dependabot.yml`](../.github/dependabot.yml) для `npm` и `github-actions` задан `commit-message` с prefix `chore` и scope — bump-коммиты проходят тот же gate.

## Связанное

- Стек / релизный трек: [`tech-stack.md`](./tech-stack.md) §13
- PR hint: [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md)
- Changesets / changelog: [`versioning.md`](./versioning.md)
- Production release: [`release-policy.md`](./release-policy.md)
