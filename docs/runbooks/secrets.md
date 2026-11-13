# Runbook: Secrets matrix

Шаг **092**. Где какой ключ лежит: local `.env`, Vercel Production / Preview, GitHub Actions. Канон имён и плейсхолдеров — [`.env.example`](../../.env.example). Процедуры подключения env — [vercel-connect.md](./vercel-connect.md), [vercel-preview.md](./vercel-preview.md), [r2-media.md](./r2-media.md), [LOCAL_SETUP.md](../LOCAL_SETUP.md).

## Правила

- Коммитить только `.env.example`. Реальный `.env` и значения секретов — никогда.
- На Vercel чувствительные значения помечать **Sensitive** (не печатать в argv/чат; pipe в `vercel env add`).
- Preview **не** копирует Production для `PAYLOAD_SECRET` / `PREVIEW_SECRET` — отдельные random, иначе сессии и draft-ссылки пересекаются с prod.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — только локальный one-shot `seed:admin` (в т.ч. против Neon). На Vercel **не** кладём.
- `NEXT_PUBLIC_SERVER_URL` на Preview **не** задавать — origin через `VERCEL_URL` ([`src/lib/serverUrl.ts`](../../src/lib/serverUrl.ts)).
- Не ставить `VERCEL=1` в локальный `.env` — ломает выбор DB-адаптера (шаг **091**).

## Матрица (ключи из `.env.example`)

| Ключ                     | Local `.env`                   | Vercel Production                | Vercel Preview            | GitHub Actions |
| ------------------------ | ------------------------------ | -------------------------------- | ------------------------- | -------------- |
| `DATABASE_URL`           | да (Docker или Neon pooled)    | Neon **pooled** (runtime)        | тот же pooled (shared БД) | нет            |
| `DATABASE_URL_UNPOOLED`  | да (migrate; Neon direct)      | Neon **direct** (`build:deploy`) | тот же direct             | нет            |
| `NEON_BRANCH`            | опционально (`neon env pull`)  | нет                              | нет                       | нет            |
| `NEON_BRANCH_ID`         | опционально (`neon env pull`)  | нет                              | нет                       | нет            |
| `PAYLOAD_SECRET`         | да (длинный random)            | да (prod random)                 | **отдельный** random      | нет            |
| `PREVIEW_SECRET`         | да (CMS draft gate)            | да (prod random)                 | **отдельный** random      | нет            |
| `NEXT_PUBLIC_SERVER_URL` | да (`http://localhost:3000`)   | канонический prod URL            | **не задавать**           | нет            |
| `CONTACT_EMAIL`          | опционально                    | опционально                      | опционально               | нет            |
| `ADMIN_EMAIL`            | только `seed:admin`            | **никогда**                      | **никогда**               | нет            |
| `ADMIN_PASSWORD`         | только `seed:admin`            | **никогда**                      | **никогда**               | нет            |
| `R2_BUCKET`              | опционально (пусто → `media/`) | да, если медиа в бою             | тот же bucket             | нет            |
| `R2_ACCESS_KEY_ID`       | опционально                    | да (с остальными R2)             | да                        | нет            |
| `R2_SECRET_ACCESS_KEY`   | опционально                    | да                               | да                        | нет            |
| `R2_ENDPOINT`            | опционально                    | да                               | да                        | нет            |
| `R2_REGION`              | опционально (`auto`)           | да                               | да                        | нет            |
| `R2_PUBLIC_URL`          | опционально                    | да                               | да                        | нет            |

Все ключи из `.env.example` размечены выше.

## Платформа (не в `.env.example`)

Vercel сам выставляет `VERCEL`, `VERCEL_URL`, `VERCEL_ENV` (`preview` / `production`). Их не дублируем в Project Environment Variables и не кладём в local `.env`.

## GitHub Actions

Текущий CI ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)) — `npm ci` + `npm run ci` (lint / format / typecheck / unit). **App-секретов в Actions нет** и не требуется.

- Встроенный `GITHUB_TOKEN` даёт Actions checkout/API; это не наш runtime-секрет и не лежит в Settings → Secrets.
- Если позже понадобится deploy/token/smoke с ключами — только **Settings → Secrets and variables → Actions**, не в репозиторий и не в Vercel «заодно».

## Ротация (куда идти)

| Секрет / ресурс                          | Где перевыпустить                                                               | Куда обновить                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `PAYLOAD_SECRET` / `PREVIEW_SECRET`      | `openssl rand -base64 32`                                                       | local `.env`; Vercel env (scope Production и/или Preview отдельно) → Redeploy  |
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | Neon console / `neonctl connection-string`                                      | local; Vercel Production + Preview (sensitive)                                 |
| R2 API keys                              | Cloudflare R2 → API tokens                                                      | local `.env`; Vercel Production + Preview; CORS — [r2-media.md](./r2-media.md) |
| `ADMIN_*`                                | смена пароля в `/admin` или БД; для seed — новые значения только в local `.env` | не на Vercel                                                                   |

После утечки: revoke у провайдера → rotate → обновить все места из матрицы → убедиться, что значение не в git ([supply-chain.md](../security/supply-chain.md)).

## Связанные документы

- [vercel-connect.md](./vercel-connect.md) — Production env + Neon migrate
- [vercel-preview.md](./vercel-preview.md) — Preview env strategy
- [r2-media.md](./r2-media.md) — R2 ключи и CORS
- [LOCAL_SETUP.md](../LOCAL_SETUP.md) — локальный `.env`
- [security/supply-chain.md](../security/supply-chain.md) — scanning / revoke → rotate
- [tech-stack.md](../tech-stack.md) — environments и Env secrets
