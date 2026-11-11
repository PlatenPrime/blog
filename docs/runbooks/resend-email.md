# Runbook: Resend transactional email

Шаг **082** (адаптер — **028**). Verify email и password reset через `@payloadcms/email-resend`. Newsletter / marketing — out of scope.

## Когда что используется

| Окружение              | Условие                 | Поведение                                                               |
| ---------------------- | ----------------------- | ----------------------------------------------------------------------- |
| Local (по умолчанию)   | `RESEND_API_KEY` пустой | Payload console adapter — HTML письма в лог `npm run dev`               |
| Local / preview / prod | `RESEND_API_KEY` задан  | Resend API; From = `RESEND_FROM_EMAIL` (fallback `noreply@example.com`) |

Код: [`src/auth/emailAdapter.ts`](../../src/auth/emailAdapter.ts) — Resend только если ключ непустой; в production без ключа — warn в лог, письма остаются в console.

Шаблоны и ссылки: [`src/auth/emailTemplates.ts`](../../src/auth/emailTemplates.ts) — base URL = `NEXT_PUBLIC_SERVER_URL` (default locale path `/uk/verify`, `/uk/reset-password`).

## Resend: API key и From

1. [Resend Dashboard](https://resend.com/) → **API Keys** → Create → скопируйте ключ → `RESEND_API_KEY` (только в env / Vercel; не в git).
2. **From address** → `RESEND_FROM_EMAIL`. Display name в коде фиксирован: `Blog`.
3. Канон имён — [`.env.example`](../../.env.example). Локальный fallback без ключа — [`LOCAL_SETUP.md`](../LOCAL_SETUP.md) §Auth email.

## Onboarding domain (путь v1)

До своего домена сайта достаточно **onboarding / test domain** Resend (адрес From, который кабинет показывает как уже разрешённый к отправке — обычно вида `*@….resend.dev` или актуальный аналог в UI).

1. В Dashboard откройте Domains / onboarding sender и скопируйте **точный** From, который Resend принимает.
2. Положите его в `RESEND_FROM_EMAIL` (Preview и Production на Vercel — те же значения, пока нет custom domain).
3. Не подставляйте выдуманный `@example.com` / чужой домен без verify — API отклонит отправку.

Свой домен почты не обязателен для закрытия **082** и для go-live на `*.vercel.app`.

## DNS notes (свой домен — позже)

Когда появится свой домен отправителя:

1. Resend Dashboard → **Domains** → Add domain.
2. Скопируйте **записи из кабинета Resend** (SPF, DKIM; DMARC — по рекомендации Resend). Не выдумывайте значения в этом runbook — они привязаны к аккаунту.
3. Добавьте записи у DNS-провайдера домена → дождитесь статуса **Verified** в Resend.
4. Обновите `RESEND_FROM_EMAIL` на адрес с этого домена (например `noreply@yourdomain`) → redeploy.
5. Повторите §Проверка (B).

Пока домен не Verified — оставайтесь на onboarding From.

## Env на Vercel (после шага 088)

После подключения проекта задайте в **Preview** и **Production**:

| Variable                 | Назначение                                       |
| ------------------------ | ------------------------------------------------ |
| `RESEND_API_KEY`         | Отправка через Resend                            |
| `RESEND_FROM_EMAIL`      | Verified / onboarding From                       |
| `NEXT_PUBLIC_SERVER_URL` | Origin без trailing slash = публичный URL деплоя |

`NEXT_PUBLIC_SERVER_URL` должен совпадать с URL, по которому открывают сайт: иначе ссылки verify/reset в письме ведут на localhost или чужой origin.

Полный env-gate перед go-live — шаг **108** / [`production-checklist.md`](../production-checklist.md).

## Проверка

### (A) Путь Resend без console (достаточно для DoD 082)

1. В `.env`: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (onboarding), `NEXT_PUBLIC_SERVER_URL=http://localhost:3000`.
2. `npm run dev` — в логе **нет** постоянного режима «только console» для исходящих auth-писем (ключ задан).
3. Зарегистрируйте reader на существующий ящик **или** возьмите уже verified reader.
4. Откройте `/{locale}/forgot-password` → отправьте reset на этот email.
5. Ожидание: письмо в inbox (или spam) от `RESEND_FROM_EMAIL`; в Resend Dashboard → **Emails** — статус Delivered / Sent.
6. Перейдите по ссылке → `/{locale}/reset-password?token=…` → новый пароль → логин новым паролем работает, старым — нет.

Негатив: очистите `RESEND_API_KEY` → снова console в логе; неверный From → ошибка/reject в Resend, письма нет.

### (B) Preview / Production (после 088 / 089)

Тот же цикл на URL деплоя: env на Vercel заданы, `NEXT_PUBLIC_SERVER_URL` = origin preview/prod, forgot → inbox → reset. Галочка в [`production-checklist.md`](../production-checklist.md) §Email.

## Troubleshooting

| Симптом                            | Что проверить                                                               |
| ---------------------------------- | --------------------------------------------------------------------------- |
| Письма только в логе dev           | `RESEND_API_KEY` пустой                                                     |
| Warn в production, писем нет       | Ключ не задан на Vercel; адаптер не поднимается                             |
| Resend reject / 403 From           | `RESEND_FROM_EMAIL` не из verified / onboarding domain                      |
| Ссылка ведёт на localhost          | `NEXT_PUBLIC_SERVER_URL` не совпадает с origin деплоя                       |
| UI «письмо отправлено», inbox пуст | Spam; Resend Emails log; rate limit forgot (`minRequestInterval` / Upstash) |
| Слишком частые запросы             | Подождите интервал Payload / снимите rate limit key; не крутите скриптом    |

## Операции

- **Ротация ключа:** новый API key в Resend → обновить env → redeploy → revoke старый.
- **Смена From:** только на verified адрес → обновить `RESEND_FROM_EMAIL` → redeploy → smoke (A) или (B).

## Вне скоупа

- Newsletter / broadcast.
- Custom domain DNS как обязательство v1 до появления своего домена сайта.
- Индекс `docs/runbooks/README.md` — шаг **103**; карта секретов Vercel — **901**.
