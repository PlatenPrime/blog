# Release policy

Канон: как код попадает в production. Версии и changelog — в [`versioning.md`](./versioning.md). Сообщения коммитов — в [`commit-convention.md`](./commit-convention.md). Ручная настройка защиты ветки в GitHub — [`runbooks/branch-protection.md`](./runbooks/branch-protection.md).

## Инварианты

| Правило                  | Смысл                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`main` = Production**  | Ветка `main` — единственный источник Vercel **Production**. Каждый merge/`push` в `main` → Production deploy (`npm run build:deploy`, migrate-on-deploy). |
| **Только через PR**      | В `main` не пушим напрямую. Изменения — feature-ветка → Pull Request → merge.                                                                             |
| **Checks перед merge**   | PR мержим только когда зелёные обязательные CI jobs (ниже). Hotfix — тот же путь, без обхода checks.                                                      |
| **Preview ≠ Production** | Каждый PR получает Vercel **Preview**. Shared Neon и отличи Preview env — [`runbooks/vercel-preview.md`](./runbooks/vercel-preview.md).                   |

Enforce «no direct push» и «required status checks» в UI GitHub — [`runbooks/branch-protection.md`](./runbooks/branch-protection.md). Этот документ фиксирует _политику_ и _какие_ checks считать обязательными.

## Обязательные checks (до merge в `main`)

Workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

| Job          | Когда                               | Что закрывает                                                 |
| ------------ | ----------------------------------- | ------------------------------------------------------------- |
| `quality`    | `pull_request` (+ `push` на `main`) | `npm ci` → `npm run ci` (lint, format:check, typecheck, unit) |
| `commitlint` | только `pull_request`               | Conventional Commits на range base…head                       |

Перед merge оба job’а на PR должны быть зелёными. Имена для GitHub «Require status checks» — в [`runbooks/branch-protection.md`](./runbooks/branch-protection.md).

**Changeset на каждый PR CI не требует** — дисциплина и hint в PR template ([`versioning.md`](./versioning.md)). Gate в Actions сознательно не ставим (как без husky на 093).

## Поток: feature → production

```text
feature branch → PR (+ Preview deploy)
       ↓
  quality + commitlint green
       ↓
  merge → main → Vercel Production
       ↓
  (если были user-facing changesets) → npm run release → chore: release → tag vX.Y.Z
```

1. Ветка от `main`, PR в `main`.
2. Дождаться зелёного CI и осмысленного Preview (smoke по ссылке в Deployments / PR).
3. Merge (squash или merge — как принято в репо; история коммитов на PR уже прошла commitlint).
4. Убедиться, что Production Deployment на Vercel успешен (build + migrate).
5. Версия / changelog — отдельно (следующий раздел); bump **не** блокирует уже случившийся deploy кода.

## Версия, тег, GitHub Release

Semver и `CHANGELOG.md` — [`versioning.md`](./versioning.md). Кратко для релиза:

1. После merge user-facing PR’ов с pending-файлами в `.changeset/` (на `main` или в отдельном release-PR): `npm run release`.
2. Закоммитить результат: `chore: release x.y.z` (или `chore(release): x.y.z`) — тоже через PR, если прямой push в `main` запрещён политикой.
3. На коммите релиза — annotated tag: `vX.Y.Z` (тот же номер, что в `package.json`).
4. **GitHub Release** с тега — по желанию (удобно людям); на Vercel-деплой не влияет.
5. Пакет в npm **не** публикуем (`private`).

Код на Production может опережать запись в changelog на один-несколько merge’ей — это ожидаемо: deploy привязан к `main`, номер версии — к осознанному `npm run release`.

## Hotfix

Тот же контур: ветка → PR → green `quality` + `commitlint` → merge → Production. Не пушить в `main` в обход PR и не отключать checks «на минутку». Если нужен patch в changelog — changeset `patch` в том же PR, затем обычный `npm run release` / tag.

## Вне scope этого документа

| Тема                                                   | Куда                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| Changeset CI gate                                      | не делаем; политика в [`versioning.md`](./versioning.md)            |
| Auto-release bot / Changesets GitHub Action            | не используем                                                       |
| npm publish                                            | нет (`private`)                                                     |
| Go-live checklist (SEO smoke, env gate, публичный URL) | [`production-checklist.md`](./production-checklist.md), шаг **108** |
| Secrets на Vercel / Actions                            | [`runbooks/secrets.md`](./runbooks/secrets.md)                      |

## Связанное

- Versioning / Changesets: [`versioning.md`](./versioning.md)
- Conventional Commits: [`commit-convention.md`](./commit-convention.md)
- Стек / CI: [`tech-stack.md`](./tech-stack.md) §13
- Vercel connect: [`runbooks/vercel-connect.md`](./runbooks/vercel-connect.md)
- Preview: [`runbooks/vercel-preview.md`](./runbooks/vercel-preview.md)
- Branch protection (чеклист UI): [`runbooks/branch-protection.md`](./runbooks/branch-protection.md)
