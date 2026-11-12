# Runbook: Vercel project connect

Шаг **088**. Подключить GitHub-репозиторий к Vercel, задать Production env и build settings. Neon Postgres создаётся здесь минимально (чтобы `DATABASE_URL` был живым); migrate-on-deploy и проверка «prod admin пишет» — шаг **090**. Preview env strategy — **089**.

## Prefconditions

| Что    | Заметка                                                                  |
| ------ | ------------------------------------------------------------------------ |
| GitHub | `PlatenPrime/blog` (или ваш fork)                                        |
| Vercel | аккаунт уже есть; Import Git Repository                                  |
| Neon   | Free project, только Postgres (без Neon Object Storage / Functions / AI) |
| Node   | `24.x` — как в `.nvmrc` / `package.json` `engines`                       |
| R2     | bucket и ключи уже есть локально (см. [r2-media.md](./r2-media.md))      |

## 1. Neon: проект и connection strings

1. [console.neon.tech](https://console.neon.tech) → **Create project**.
2. **Name:** `blog` (или то же имя, что Vercel project).
3. **Region:** предпочтительно EU (например `AWS Europe Central 1 (Frankfurt)`). Фактический prod project шага **088** может быть в другом region Free-tier — имя проекта `blog`, id смотрите в Neon Console; для latency EU при желании пересоздайте на **090**.
4. **Services:** включите только **Postgres**. Выключите Object storage, Functions, AI gateway, Realtime, Better Auth — медиа у нас в Cloudflare R2, auth в Payload.
5. После создания откройте **Connection details** (или `neonctl connection-string --project-id <id> --branch production --pooled`):
   - **Pooled** (хост часто с `-pooler`) → это значение для `DATABASE_URL` на Vercel (serverless).
   - **Direct** (без pooler) → сохраните локально для `npm run migrate` с машины (**090** / ручные migrate). Не коммитьте ни одну строку в git.

## 2. Vercel: Import GitHub

1. [vercel.com/new](https://vercel.com/new) → Import `PlatenPrime/blog`.
2. Framework Preset: **Next.js** (автодетект).
3. Root Directory: `.` (монорепо нет).
4. **Build & Development Settings:**
   - Install Command: `npm ci` (или default Vercel)
   - Build Command: `npm run build`
   - Output: Next.js default (файл `vercel.json` в репо не требуется)
5. **Node.js Version:** `24.x` (Project Settings → General → Node.js Version, либо совпадение с `.nvmrc`).

## 3. Production Environment Variables

В Project → **Settings** → **Environment Variables** → scope **Production** (Preview — стратегия на **089**).

| Variable                         | Source / notes                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                   | Neon **pooled** connection string                                                                                     |
| `PAYLOAD_SECRET`                 | длинная случайная строка (не из локального `.env` с слабым replace-me)                                                |
| `PREVIEW_SECRET`                 | длинная случайная строка для draft preview                                                                            |
| `NEXT_PUBLIC_SERVER_URL`         | `https://<project>.vercel.app` без trailing slash; после первого деплоя сверьте с реальным URL и при смене — Redeploy |
| `R2_BUCKET`                      | как в локальном `.env`                                                                                                |
| `R2_ACCESS_KEY_ID`               | R2 API token                                                                                                          |
| `R2_SECRET_ACCESS_KEY`           | R2 secret                                                                                                             |
| `R2_ENDPOINT`                    | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`                                                                       |
| `R2_REGION`                      | обычно `auto`                                                                                                         |
| `R2_PUBLIC_URL`                  | публичный base (r2.dev или custom)                                                                                    |
| `CONTACT_EMAIL`                  | опционально                                                                                                           |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | не нужны для runtime; только `seed:admin`                                                                             |

Канон имён — [`.env.example`](../../.env.example). Полная матрица «где какой секрет» — шаг **092** (`docs/runbooks/secrets.md`).

На Vercel платформа сама выставляет `VERCEL` → адаптер `@payloadcms/db-vercel-postgres` ([`src/db/adapter.ts`](../../src/db/adapter.ts)).

## 4. Deploy и Verify

1. **Deploy** (кнопка после Import) или push в подключенную ветку / PR.
2. Project → **Deployments**: появляется новый Deployment (Building → Ready или Error).
3. **Verify шага 088:** push или PR создаёт Deployment в UI Vercel. DoD — хостинг подключён.

Ожидаемо до **090:** билд может быть зелёным при валидном `DATABASE_URL`, а runtime `/admin` без применённых миграций на Neon — сырой. Автомиграции при cold start намеренно нет (ADR-001).

## 5. CLI (как подключили в 088)

```bash
npx vercel login
npx vercel link --yes --project blog   # создаёт project при отсутствии + GitHub connect
npx vercel project update blog --build-command "npm run build" --install-command "npm ci" --framework nextjs
# env: pipe из neonctl, без печати URL в argv
npx neonctl connection-string --project-id <id> --branch production --pooled \
  | npx vercel env add DATABASE_URL production --sensitive --yes
npx vercel env ls
npx vercel deploy --yes                # Preview; Production — Deployments UI или --prod
```

Секреты в CLI не печатайте в чат и не коммитьте. Токен Vercel — только в local auth / CI secrets позже.

**Build note:** `next build` typecheck включает `tests/`. Loose Lexical types в factory-тестах сужаются явным cast (см. `tests/unit/factories.test.ts`), чтобы билд не падал на `TS7053`.

## Что не в этом шаге

| Тема                                     | Шаг               |
| ---------------------------------------- | ----------------- |
| Preview env vars / общая preview-БД      | **089**           |
| Neon migrate-on-deploy, prod admin smoke | **090**           |
| Уточнение vercel-postgres adapter        | **091**           |
| Матрица секретов                         | **092**           |
| Analytics, custom domain, go-live URL    | **097+**, **109** |

## Связанные документы

- [tech-stack.md](../tech-stack.md) — хостинг и env
- [LOCAL_SETUP.md](../LOCAL_SETUP.md) — локальный путь (Docker Postgres)
- [r2-media.md](./r2-media.md) — R2 ключи и CORS
- [adr/001-migrations-policy.md](../adr/001-migrations-policy.md) — без auto-migrate на serverless
