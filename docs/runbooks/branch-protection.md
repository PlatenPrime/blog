# Runbook: Branch protection (`main`)

Шаг **096**. Как вручную защитить `main` в GitHub, чтобы политика из [`release-policy.md`](../release-policy.md) не оставалась договором. CI jobs — [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml).

Репозиторий сейчас **public** (`PlatenPrime/blog`), default branch — `main`. Этот чеклист рассчитан на Free + public; для private Free часть правил может быть недоступна (см. ниже).

## Что enforce’им

| Правило                    | Смысл                                                                             |
| -------------------------- | --------------------------------------------------------------------------------- |
| Только через PR            | Прямой `git push origin main` и force-push запрещены                              |
| Required status checks     | Merge в `main` только при зелёном `quality`                                       |
| Up to date                 | Branch должен быть актуален относительно `main` перед merge                       |
| Без обязательных approvals | Соло-автор: required reviewers / CODEOWNERS не требуем                            |
| Без bypass «для админа»    | Bypass roles лучше выключить — иначе solo owner снова обходит checks «на минутку» |

### Имена checks в UI

В workflow у jobs нет поля `name:` — в GitHub «Require status checks» это ровно имена job’ов:

| Check     | Job в `ci.yml` | Когда появляется                  |
| --------- | -------------- | --------------------------------- |
| `quality` | `quality`      | `pull_request` и `push` на `main` |

`quality` обязателен перед merge. Job `commitlint` удалён — если в Ruleset он ещё числится required, **уберите** его (иначе PR будет ждать check, который больше не появляется). Vercel Preview Deployment **не** делаем required check (нет в `ci.yml`). Changeset на PR — дисциплина, не gate ([`versioning.md`](../versioning.md)).

Если check не появляется в поиске Ruleset — сначала откройте любой PR (или дождитесь прогона Actions), чтобы GitHub увидел имя status check хотя бы раз.

## Чеклист: Repository Ruleset

Актуальный путь GitHub — **Rulesets** (не классический Branch protection, если UI предлагает оба).

1. Открыть репозиторий → **Settings** → **Rules** → **Rulesets** → **New branch ruleset**.
2. **Ruleset name:** например `protect-main`.
3. **Enforcement status:** `Active`.
4. **Target branches** → **Include by pattern** → `main` (только `main`, не `*`).
5. Включить правила:
   - **Restrict deletions**
   - **Block force pushes**
   - **Require a pull request before merging**
     - Required approvals: **0** (соло)
     - Dismiss stale reviews / CODEOWNERS — не включать
   - **Require status checks to pass**
     - Добавить: `quality` (и **не** добавлять `commitlint`)
     - **Require branches to be up to date before merging** — включить
6. **Bypass list:** оставить пустым (не добавлять Admins / Maintain). Если когда‑нибудь понадобится аварийный обход — осознанно и временно, с записью в заметках, не как дефолт.
7. **Save changes**.

### Альтернатива: classic Branch protection

Если в UI удобнее классика: **Settings** → **Branches** → **Add branch protection rule** → Branch name pattern `main`, затем те же смыслы: Require a pull request, Require status checks (`quality`), Require up to date, Restrict who can push / block force pushes / restrict deletions — насколько план позволяет. Предпочтение — Rulesets.

## Free / visibility

| Visibility  | Ожидание на GitHub Free                                                                                                                                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Public**  | Полный набор выше (PR-only, required checks, block force push) доступен                                                                                                                                                                                                                  |
| **Private** | Часть правил Rulesets / classic protection может требовать платный план — сверьтесь с [GitHub docs: available rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets). Не копируем прайс сюда. |

Этот репозиторий — public; при смене на private пересмотрите Ruleset и зафиксируйте gap (что нельзя enforce’ить) рядом с политикой релиза.

## Verify (после настройки)

1. Локально: `git checkout main && git commit --allow-empty -m "chore: probe direct push" && git push origin main` — **ожидание:** push отклонён правилами ветки.
2. Открыть PR с заведомо красным CI (или дождаться падения) — кнопка merge недоступна / blocked, пока `quality` не green.
3. PR с зелёным `quality` — merge разрешён; после merge Vercel Production деплоится как обычно ([`release-policy.md`](../release-policy.md)).

## Вне scope

| Тема                                 | Куда / решение                              |
| ------------------------------------ | ------------------------------------------- |
| Required reviewers ≥ 1 / CODEOWNERS  | не для соло                                 |
| Vercel Deployment как required check | не добавляем                                |
| Changeset CI gate                    | нет ([`versioning.md`](../versioning.md))   |
| Auto-release bot                     | нет                                         |
| Сама политика «когда мержить»        | [`release-policy.md`](../release-policy.md) |

## Связанное

- [`release-policy.md`](../release-policy.md) — `main` = prod, какие checks обязательны
- [`tech-stack.md`](../tech-stack.md) §13 — CI/CD
- [`vercel-connect.md`](./vercel-connect.md) — Production deploy с `main`
