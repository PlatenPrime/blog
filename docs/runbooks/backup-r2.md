# Runbook: R2 backup & retention

Шаг **101**. Подстраховка медиа в Cloudflare R2. Neon — отдельно, [backup-neon.md](./backup-neon.md) (**100**). Upload / CORS / env — [r2-media.md](./r2-media.md) (**037**).

## Prefconditions

| Что            | Заметка                                                                               |
| -------------- | ------------------------------------------------------------------------------------- |
| Primary bucket | Имя из `R2_BUCKET` (рабочий media bucket приложения)                                  |
| Backup bucket  | Отдельный private bucket, канон имени: `blog-media-backup` (без public URL / r2.dev)  |
| Plan           | R2 Free: **10 GB-month** Standard storage; Class A/B ops в месячном free allowance    |
| Owner          | Solo author (ты)                                                                      |
| Tools          | Cloudflare Dashboard; `rclone` **или** AWS CLI (`aws s3 …` против R2 S3 endpoint)     |
| App env        | `R2_*` на Vercel / local — только primary; backup credentials **не** класть в app env |

Секреты не коммитить; см. [secrets.md](./secrets.md).

## Лимиты и возможности (канон)

| Возможность                      | Статус на R2                       | Решение для блога                                  |
| -------------------------------- | ---------------------------------- | -------------------------------------------------- |
| S3 Object Versioning             | **Не реализовано**                 | Accepted gap — не «включим потом молча»            |
| S3 Object Lock / replication API | **Не реализовано**                 | Не используем                                      |
| Bucket locks (retention rules)   | Есть (срок / до даты / indefinite) | **Не** на primary: ломает Payload delete/overwrite |
| Neon-like PITR                   | Нет                                | Только вторая копия + cold local                   |
| Durability                       | Высокая (Cloudflare)               | Не заменяет защиту от accidental delete            |

Источники: [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [Bucket locks](https://developers.cloudflare.com/r2/buckets/bucket-locks/), [S3 API compatibility](https://developers.cloudflare.com/r2/api/s3/api/).

## Risk accepted (явно)

1. Нет versioning / PITR: удалил объект в `/admin` → байты ушли с primary сразу.
2. Dual-bucket в **одном** Cloudflare account не спасает от wipe аккаунта → нужен cold local.
3. Bucket lock на live media сознательно не ставим (Media CUD должен работать).
4. Preview/Production шарят один primary bucket (см. [vercel-preview.md](./vercel-preview.md)) — uploads из preview загрязняют тот же набор объектов.

## Политика: три слоя

### 1. Primary (live)

- Bucket из `R2_BUCKET`; public URL = `R2_PUBLIC_URL`.
- App API token: Object **Read & Write** только на этот bucket.
- Без versioning, без bucket lock.

### 2. Secondary mirror (`blog-media-backup`)

Отдельный **private** bucket (не включать r2.dev / custom domain).

1. Cloudflare Dashboard → **R2** → **Create bucket** → `blog-media-backup`.
2. **Manage R2 API Tokens** → token с доступом:
   - primary: **Object Read** (достаточно для sync source), **или** Read & Write если тот же token крутит оба;
   - backup: **Object Read & Write**.
3. Предпочтительно **отдельный** backup-токен, не тот что в Vercel `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`.

Еженедельный mirror (одинаковые ключи объектов):

```bash
# Пример: AWS CLI против R2 (профиль с endpoint URL)
# Не коммить реальные ключи. Endpoint = R2_ENDPOINT без trailing slash.

aws s3 sync "s3://${R2_BUCKET}" "s3://blog-media-backup" \
  --endpoint-url "$R2_ENDPOINT" \
  --delete
```

Эквивалент `rclone sync` между двумя remote’ами, настроенными на тот же account endpoint.

- `--delete` держит backup = точная копия primary (удалённое в admin уходит и из backup на следующем sync). Для «oops, удалил вчера» этого мало → см. слой 3 и частоту.
- Без `--delete` backup копит stale keys (больше storage на Free 10 GB). Канон v1: **с** `--delete` + cold local раз в месяц.
- Sync **вне** git / CI / chat. Не класть объекты backup в репозиторий.

### 3. Cold local (offline)

Раз в месяц **или** перед массовой чисткой Media:

```bash
aws s3 sync "s3://blog-media-backup" "./blog-r2-cold-$(date +%Y%m%d)/" \
  --endpoint-url "$R2_ENDPOINT"
```

- Хранить на шифрованном диске / offline backup **вне** репозитория.
- Ротация: оставляй 1–2 последних cold folder’а; старые удаляй руками.

## Расписание (owner = solo)

| Действие                       | Когда                                            |
| ------------------------------ | ------------------------------------------------ |
| Создать `blog-media-backup`    | Один раз (если ещё нет)                          |
| `aws s3 sync` primary → backup | Еженедельно **или** после крупной заливки медиа  |
| Cold local из backup           | Ежемесячно **или** перед массовым delete в admin |
| Restore / list drill           | Минимум раз в квартал (или после смены токенов)  |

## Restore drill (на копии / без порчи live URL)

Цель Verify шага **101**: доказать, что mirror читается и объект восстанавливается. **Не** менять Vercel env. **Не** перезаписывать рабочие ключи primary без нужды.

1. Убедись, что backup bucket существует и хотя бы один sync уже прошёл (или сделай sync сейчас).
2. Сравни число объектов (примерно):

```bash
aws s3 ls "s3://${R2_BUCKET}" --endpoint-url "$R2_ENDPOINT" --recursive | wc -l
aws s3 ls "s3://blog-media-backup" --endpoint-url "$R2_ENDPOINT" --recursive | wc -l
```

На Windows PowerShell вместо `wc -l`: `(aws s3 ls … --recursive).Count`.

3. Выбери один существующий key с backup. Скопируй его в **drill-prefix** на primary (не поверх живого filename без префикса):

```bash
aws s3 cp \
  "s3://blog-media-backup/<existing-key>" \
  "s3://${R2_BUCKET}/_restore-drill/<existing-key>" \
  --endpoint-url "$R2_ENDPOINT"
```

4. Проверь: объект виден в Dashboard **или** скачай локально и открой файл (картинка читается). Публичный URL drill-ключа не обязателен (префикс может не быть в Media collection).
5. **Удали** `s3://${R2_BUCKET}/_restore-drill/` (и вложенные объекты) после проверки.

### Последний drill

| Поле          | Значение                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Дата          | 2026-11-16                                                                                                                     |
| Primary       | из `R2_BUCKET` (доступен; list/put/copy/get/delete OK)                                                                         |
| Backup        | `blog-media-backup` — **ещё не создан** (HeadBucket 404); создать в Dashboard один раз (app token без CreateBucket — ожидаемо) |
| Object counts | primary=0 (пустой media), backup=n/a                                                                                           |
| Drill         | Put `_restore-drill/smoke-source.bin` → Copy → Get → Delete обоих ключей; leftover=0                                           |
| Vercel touch  | нет                                                                                                                            |

Повторный drill после появления медиа и backup bucket: list counts primary vs backup + restore одного live key в `_restore-drill/` (шаги 1–5 выше).

## Инцидент: потеря / порча медиа

1. **Стоп:** не заливай массово поверх тех же filename; не гоняй sync с `--delete`, пока не понял масштаб.
2. Оцени: один объект → восстанови из `blog-media-backup` тем же key на primary; много объектов / backup тоже пуст → cold local.
3. После restore байтов: проверь запись Media в Neon (`url` / `filename`) — Postgres и R2 независимы (**100** vs **101**). Битая строка в БД при живом объекте ≠ restore файла.
4. Когда live снова ок — свежий sync primary → backup + новый cold local.
5. Revoke скомпрометированный token → новый → обновить только нужные env (app vs backup).

## Verify 101

1. Файл [`backup-r2.md`](./backup-r2.md) описывает versioning N/A, три слоя, периодичность, drill.
2. Процедура sync / list / restore в drill-prefix воспроизводима командами выше.
3. Хотя бы один drill выполнен и записан в «Последний drill» (или дата первого drill проставлена owner’ом при наличии ключей).
4. Vercel `R2_*` и public media URLs не менялись ради drill.

## Что не в этом шаге

| Тема                      | Шаг / место     |
| ------------------------- | --------------- |
| Neon backup               | **100**         |
| Ops runbook index         | **103**         |
| Custom CDN / signed media | после v1 / out  |
| CI / cron авто-sync       | сознательно нет |
| Bucket lock на primary    | сознательно нет |
| npm script / код Payload  | вне 101         |

## Связанные документы

- [r2-media.md](./r2-media.md) — bucket, CORS, `R2_*`, upload smoke
- [backup-neon.md](./backup-neon.md) — Postgres отдельно
- [secrets.md](./secrets.md) — где лежат ключи
- [vercel-connect.md](./vercel-connect.md) — prod env matrix
- [tech-stack.md](../tech-stack.md) — Free Neon + R2 split
