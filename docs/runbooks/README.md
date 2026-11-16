# Ops runbooks

Шаг **103**. Одна точка входа в операционные инструкции. Процедуры живут в связанных файлах — здесь только карта «куда идти».

## Deploy / hosting

| Runbook                                  | Шаг               | Когда открывать                                                        |
| ---------------------------------------- | ----------------- | ---------------------------------------------------------------------- |
| [vercel-connect.md](./vercel-connect.md) | **088** / **090** | Первый connect GitHub ↔ Vercel, Production env, Neon migrate-on-deploy |
| [vercel-preview.md](./vercel-preview.md) | **089**           | Preview env на PR, shared Neon, `VERCEL_URL`                           |

## Secrets / release gate

| Runbook                                        | Шаг     | Когда открывать                                               |
| ---------------------------------------------- | ------- | ------------------------------------------------------------- |
| [secrets.md](./secrets.md)                     | **092** | Где какой ключ: local / Vercel Production / Preview / Actions |
| [branch-protection.md](./branch-protection.md) | **096** | Ruleset на `main`: PR-only, required check `quality`          |

Политика «как катим» — не runbook: [release-policy.md](../release-policy.md) (**095**).

## Observability

| Runbook                                      | Шаг     | Когда открывать                                  |
| -------------------------------------------- | ------- | ------------------------------------------------ |
| [vercel-analytics.md](./vercel-analytics.md) | **097** | Web Analytics + consent в UI Vercel              |
| [vercel-logs.md](./vercel-logs.md)           | **098** | Runtime logs, JSON logger, triage по `requestId` |

Sentry в v1 **не** подключен — [ADR-008](../adr/008-sentry-waive-until-needed.md) (**099**). Канон ошибок: Vercel Logs + `logger`.

## Media

| Runbook                      | Шаг     | Когда открывать                            |
| ---------------------------- | ------- | ------------------------------------------ |
| [r2-media.md](./r2-media.md) | **037** | Bucket, CORS, `R2_*`, upload smoke в admin |

## Backup / restore

| Runbook                            | Шаг     | Когда открывать                                     |
| ---------------------------------- | ------- | --------------------------------------------------- |
| [backup-neon.md](./backup-neon.md) | **100** | PITR / snapshot / `pg_dump`, restore drill на копии |
| [backup-r2.md](./backup-r2.md)     | **101** | Mirror bucket, cold copy; versioning на R2 нет      |

## Смежное (не runbook)

| Документ                                                                        | Зачем                                                |
| ------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [LOCAL_SETUP.md](../LOCAL_SETUP.md)                                             | Локальный Node / Docker / env / migrate / seed       |
| [release-policy.md](../release-policy.md)                                       | `main` = Production; PR + зелёный `quality`          |
| [security/checklist.md](../security/checklist.md)                               | Security inventory и operator must до публичного URL |
| [adr/008-sentry-waive-until-needed.md](../adr/008-sentry-waive-until-needed.md) | Почему нет Sentry и когда revisit                    |

## Чего здесь нет

Отдельного **incident** runbook пока нет — не заводим stub. Если понадобится playbook «сайт лежит / данные испорчены», это новый numbered шаг чертежа, не тихая правка индекса.
