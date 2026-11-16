# Runbook: Neon backup & restore

Шаг **100**. Подстраховка Postgres на Free (project `blog`, region `aws-us-east-2`). R2 — отдельно, [шаг **101**](../development-roadmap.md) / будущий `backup-r2.md`. Connect / migrate — [vercel-connect.md](./vercel-connect.md) (**088** / **090**).

## Prefconditions

| Что          | Заметка                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------- |
| Neon project | `blog` (`noisy-breeze-98599474`), root branch `production`                                          |
| Plan         | **Free** — history window ≤ **6h** / ≤ **1 GB** change history; **1** manual snapshot; no schedules |
| Owner        | Solo author (ты)                                                                                    |
| Tools        | Neon Console и/или `neonctl`; для dump — `pg_dump` + **direct** (unpooled) URL                      |
| Vercel       | Prod/Preview шарят ту же `production` БД — restore in-place на root = downtime для обоих            |

Секреты connection string не коммитить; см. [secrets.md](./secrets.md).

## Лимиты Free (канон)

| Слой                       | Что даёт Free                          | Ограничение                                 |
| -------------------------- | -------------------------------------- | ------------------------------------------- |
| Instant restore (PITR)     | Откат root branch по истории изменений | До **6 часов**, до **1 GB** WAL/history     |
| Manual snapshot            | Именованный снимок ветки               | **1** слот; scheduled backups **нет**       |
| Child branch (копия)       | Copy-on-write от head / restore target | ≤ **10** branches / project                 |
| Logical export (`pg_dump`) | Полный SQL dump вне Neon               | Твоя машина / шифрованное хранилище; не git |

Источники лимитов: [Neon plans](https://neon.com/docs/introduction/plans), [Backups](https://neon.com/docs/postgres/backup-restore/backups), [Instant restore](https://neon.com/docs/introduction/branch-restore).

## Политика: три слоя

### 1. Instant restore (свежие «oops», ≤ 6h)

Использовать, когда данные испортили недавно (плохой migrate, случайный delete в admin).

**Правило:** не откатывать `production` in-place в панике. Создай **новую** branch из истории (Console: branch → **Backup & Restore** → **Restore from history** → restore into a **new** branch) или child от нужной точки. Проверь копию. Только потом решай, менять ли Vercel `DATABASE_URL` / менять ли default branch.

PITR доступен только с **root** branches (`production`). Child branches history для instant restore не дают.

### 2. Manual snapshot (единственный слот Free)

После крупного schema/content события **или** раз в месяц:

1. Console → `production` → **Backup & Restore** → snapshots **или** CLI: `neon snapshots create --project-id noisy-breeze-98599474 --branch production`.
2. Если слот занят — **удали** старый snapshot, затем создай новый (на Free одновременно живёт только один).
3. Имя/заметка: `YYYY-MM` или `pre-migrate-<slug>`.

Restore из snapshot — тоже сначала в **новую** branch (preview), не поверх живого prod без проверки.

### 3. Logical export (`pg_dump`) — за пределами 6h

Раз в неделю **или** перед рискованным migrate:

```bash
# Direct URL (без -pooler) — как DATABASE_URL_UNPOOLED
pg_dump "$DATABASE_URL_UNPOOLED" --format=custom --file="blog-neon-$(date +%Y%m%d).dump"
```

- Хранить **вне** репозитория (локальный диск / шифрованный бэкап).
- Не класть dump в git, PR, chat, публичный bucket.
- Restore drill dump’а: `pg_restore` в **локальный** Docker Postgres или во временную Neon branch — не в prod.

## Расписание (owner = solo)

| Действие                      | Когда                                         |
| ----------------------------- | --------------------------------------------- |
| Проверить history window = 6h | При создании project / после upgrade плана    |
| Ротация manual snapshot       | Ежемесячно **или** после крупного migrate     |
| `pg_dump`                     | Еженедельно **или** перед рискованным DDL     |
| Restore drill на **копии**    | Минимум раз в квартал (или после смены плана) |

## Restore drill (на копии)

Цель Verify шага **100**: доказать, что копия читается. **Не** трогать root `production` и Vercel env.

1. Создать disposable branch от head `production`, например `restore-drill-YYYYMMDD` (Console **New branch** или `neon branches create`).
2. Взять connection string этой ветки (`neonctl connection-string --project-id … --branch restore-drill-…` **или** MCP/`get_connection_string`).
3. Smoke SQL (имена таблиц Payload = slug коллекций):

```sql
SELECT
  (SELECT count(*) FROM users) AS users,
  (SELECT count(*) FROM articles) AS articles,
  (SELECT count(*) FROM notes) AS notes;
```

4. Убедиться, что counts ≥ 0 и совпадают с ожиданиями (на пустом blog допустимы нули; на живом — admin ≥ 1).
5. **Удалить** drill-branch (освобождает слот Free ≤ 10 branches).

### Последний drill

| Поле         | Значение                                       |
| ------------ | ---------------------------------------------- |
| Дата         | 2026-11-16                                     |
| Project      | `noisy-breeze-98599474` (`blog`)               |
| Parent       | `production` (`br-wispy-morning-bekr6ay9`)     |
| Drill branch | `restore-drill-20261116` (удалена после smoke) |
| Smoke        | `users=1`, `articles=0`, `notes=1`             |
| Prod touch   | нет (Vercel env и root branch не менялись)     |

## Инцидент: потеря / порча данных на prod

1. **Стоп:** не пиши больше в admin; не гоняй migrate на prod.
2. Оцени возраст проблемы: ≤ 6h → instant restore в **новую** branch; старше → snapshot и/или последний `pg_dump`.
3. Проверь копию smoke SQL + `/admin` login против **копии** (временный local `.env` / отдельный URL — не подменяй Production env, пока не уверен).
4. Только после проверки: либо cutover (новый default / обновлённые connection strings), либо точечный `INSERT`/`UPDATE` из копии.
5. После стабилизации — новый manual snapshot + свежий `pg_dump`.

## Verify 100

1. Файл [`backup-neon.md`](./backup-neon.md) описывает PITR, snapshot, `pg_dump`, периодичность, drill.
2. Хотя бы один restore drill на копии выполнен и записан в «Последний drill».
3. Production root и Vercel `DATABASE_URL*` не менялись ради drill.

## Что не в этом шаге

| Тема                          | Шаг / место              |
| ----------------------------- | ------------------------ |
| R2 backup / retention         | **101**                  |
| Ops runbook index             | **103**                  |
| Branch-per-PR Neon            | позже / по необходимости |
| Upgrade Neon plan / schedules | вне v1 Free              |
| Автоматизация dump в CI       | сознательно нет          |

## Связанные документы

- [vercel-connect.md](./vercel-connect.md) — Neon project + unpooled migrate
- [secrets.md](./secrets.md) — где лежат URL
- [tech-stack.md](../tech-stack.md) — Free Neon + R2 split
- [adr/001-migrations-policy.md](../adr/001-migrations-policy.md) — schema только через migrate
