# Runbook: Vercel Preview Deployments

Шаг **089**. Preview env vars на каждый PR, ограничения shared БД и проверка ссылки в PR. Подключение проекта и Production env — [vercel-connect.md](./vercel-connect.md) (**088**). Migrate-on-deploy и «admin пишет в prod» — шаг **090**.

## Два «preview» — не путать

| Термин                        | Что это                                                     | Где                                 |
| ----------------------------- | ----------------------------------------------------------- | ----------------------------------- |
| **Vercel Preview Deployment** | Хост приложения на ветку/PR (`*.vercel.app`)                | этот runbook, шаг **089**           |
| **Draft / CMS preview**       | Кнопка Preview в admin → `/next/preview` + `PREVIEW_SECRET` | шаг **035**, `PREVIEW_SECRET` в env |

`PREVIEW_SECRET` — секрет CMS draft gate, не платформенный секрет Vercel.

## Prefconditions

| Что             | Заметка                                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel project  | `blog` linked to GitHub (`PlatenPrime/blog`) — **088**                                                                                  |
| Git Integration | Automatic Preview Deployments for Pull Requests включены (Project Settings → Git / Deployments)                                         |
| Neon            | pooled `DATABASE_URL` уже есть для Production                                                                                           |
| Код origin      | `getServerUrl()` → `NEXT_PUBLIC_SERVER_URL` или fallback `https://${VERCEL_URL}` ([`src/lib/serverUrl.ts`](../../src/lib/serverUrl.ts)) |

## Стратегия окружений

Канон: `local` · `preview` · `production` ([tech-stack.md](../tech-stack.md) §13).

- **БД:** одна shared Neon (тот же pooled `DATABASE_URL`, что Production). Отдельная Neon branch / DB на PR **не** вводим на этом шаге.
- **Секреты:** Preview получает **свои** `PAYLOAD_SECRET` и `PREVIEW_SECRET` (не копировать Production) — сессии и draft-ссылки не пересекаются с prod.
- **Origin:** для Preview **не** задавать `NEXT_PUBLIC_SERVER_URL`. На билде/runtime Vercel подставляет `VERCEL_URL`; код собирает `https://…`. Production оставляет фиксированный канонический URL.

## Preview Environment Variables

Project → **Settings** → **Environment Variables** → scope **Preview** (не Production).

| Variable                                                            | Preview                                    | Notes                                                       |
| ------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| `DATABASE_URL`                                                      | Neon **pooled** (тот же, что Production)   | shared DB — см. ограничения ниже                            |
| `PAYLOAD_SECRET`                                                    | **новый** длинный random                   | не = Production                                             |
| `PREVIEW_SECRET`                                                    | **новый** длинный random                   | CMS draft gate; не = Production                             |
| `NEXT_PUBLIC_SERVER_URL`                                            | **не задавать**                            | иначе CSRF/cors/metadata смотрят на чужой origin            |
| `R2_BUCKET` / ключи / `R2_ENDPOINT` / `R2_PUBLIC_URL` / `R2_REGION` | те же, что для prod (если медиа уже на R2) | опционально для DoD фасада; uploads загрязняют общий bucket |
| `CONTACT_EMAIL`                                                     | опционально                                | как в Production                                            |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD`                                    | не нужны runtime                           | только `seed:admin`                                         |

Канон имён — [`.env.example`](../../.env.example). Полная матрица «где какой секрет» — шаг **092**.

На Vercel платформа выставляет `VERCEL` → адаптер `@payloadcms/db-vercel-postgres` ([`src/db/adapter.ts`](../../src/db/adapter.ts)). Также доступны `VERCEL_URL` и `VERCEL_ENV=preview`.

## Ограничения shared БД

| Правило                                                    | Почему                                                                                  |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `push: false` на preview                                   | [ADR-001](../adr/001-migrations-policy.md) — только migrations                          |
| Схему на shared Neon менять только явным `npm run migrate` | Auto-push в serverless запрещён; deploy-time migrate — **090**                          |
| Не сидить мусорный контент «навсегда» из preview admin     | Те же строки, что Production; черновики и тестовые посты видны всем, кто смотрит эту БД |
| Schema drift ломает **все** preview и prod                 | Одна схема на всех consumers URL                                                        |
| До **090** `/admin` на preview/prod может быть сырым       | Билд Ready ≠ миграции применены                                                         |

Neon branching per PR — сознательно позже «по мере необходимости»; дефолт роадмапа — простой shared Neon + изолированные secrets.

## R2 на Preview

- Один bucket с Production допустим: публичные URL медиа совпадут.
- Upload из preview admin пишет в тот же bucket — не удаляйте чужие объекты «для теста».
- CORS: кроме Production origin разрешите preview hosts (конкретные `*.vercel.app` или политика под ваш процесс). См. [r2-media.md](./r2-media.md) § CORS.

## CLI

Из корня репо (после `npx vercel link`):

```bash
# Preview secrets — pipe, без печати в argv/чат
openssl rand -base64 32 | npx vercel env add PAYLOAD_SECRET preview --sensitive --yes
openssl rand -base64 32 | npx vercel env add PREVIEW_SECRET preview --sensitive --yes

# Shared DB: взять pooled URL из Neon (не из `vercel env pull` — sensitive значения
# приходят как placeholder `[SENSITIVE]`, и такой «URL» ломает билд Invalid URL)
npx neonctl connection-string --project-id <id> --branch production --pooled \
  | npx vercel env add DATABASE_URL preview --sensitive --yes

npx vercel env ls
# NEXT_PUBLIC_SERVER_URL для preview быть не должно
```

`npx vercel deploy` с машины может загрузить локальный `.env` в артефакт — для проверки Preview env опирайтесь на Git Integration (push/PR), а не на CLI upload. Секреты не коммитьте. Токен Vercel — только local auth / CI позже.

## Verify (DoD шага 089)

1. Откройте или создайте PR в `PlatenPrime/blog` (или push в ветку с Git Integration).
2. Дождитесь Vercel check / комментария бота со ссылкой **Visit Preview** (или Project → **Deployments** → фильтр Preview → Status Ready).
3. Откройте URL. На Hobby / с **Deployment Protection** возможен редирект на Vercel SSO — после логина в аккаунт Vercel фасад должен открыться (`/` → locale, например `/uk`).
4. Ожидаемо до **090:** `/admin` без применённых миграций на Neon может быть нерабочим — это не блокер Preview must-have.
5. Unit origin: `npm test -- tests/unit/serverUrl.test.ts`.

## Что не в этом шаге

| Тема                                     | Шаг                      |
| ---------------------------------------- | ------------------------ |
| Neon migrate-on-deploy, prod admin smoke | **090**                  |
| Уточнение vercel-postgres adapter        | **091**                  |
| Матрица секретов (Vercel + Actions)      | **092**                  |
| Neon branch per PR                       | позже / по необходимости |
| Custom domain, analytics                 | **097+**, **109**        |

## Связанные документы

- [vercel-connect.md](./vercel-connect.md) — Production connect (**088**)
- [tech-stack.md](../tech-stack.md) — environments
- [adr/001-migrations-policy.md](../adr/001-migrations-policy.md) — push vs migrate
- [r2-media.md](./r2-media.md) — R2 и CORS
- [LOCAL_SETUP.md](../LOCAL_SETUP.md) — локальный путь
