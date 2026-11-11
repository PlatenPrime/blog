# Runbook: Resend transactional email

Шаг **082** (адаптер — **028**). Verify email и password reset через `@payloadcms/email-resend`. Newsletter / marketing — out of scope.

## Когда что используется

| Окружение              | Условие                 | Поведение                                                               |
| ---------------------- | ----------------------- | ----------------------------------------------------------------------- |
| Local (по умолчанию)   | `RESEND_API_KEY` пустой | Payload console adapter — HTML письма в лог `npm run dev`               |
| Local / preview / prod | `RESEND_API_KEY` задан  | Resend API; From = `RESEND_FROM_EMAIL` (fallback `noreply@example.com`) |

Код: [`src/auth/emailAdapter.ts`](../../src/auth/emailAdapter.ts) — адаптер подключается только если ключ непустой; иначе Payload пишет письма в console. В production без ключа — warn в лог.

Шаблоны: [`src/auth/emailTemplates.ts`](../../src/auth/emailTemplates.ts). Ссылки verify / reset строятся через `getServerUrl()` + `prefixPublicPath` → **default locale `uk`**:

- `{NEXT_PUBLIC_SERVER_URL}/uk/verify?token=…`
- `{NEXT_PUBLIC_SERVER_URL}/uk/reset-password?token=…`

## Resend: API key и From

1. [Resend Dashboard](https://resend.com/) → **API Keys** → Create → скопируйте ключ → `RESEND_API_KEY` (только в env / Vercel; не в git).
2. **From address** → `RESEND_FROM_EMAIL`. Display name в коде фиксирован: `Blog`.
3. Не используйте `noreply@example.com` с живым ключом — Resend отклонит неотверенный From.

## Onboarding domain (без своего DNS)

Пока нет custom domain, Resend даёт onboarding / test From (часто вид `onboarding@resend.dev` — актуальный адрес смотрите в Dashboard → **Domains** / onboarding).

1. В Dashboard скопируйте разрешённый onboarding From.
2. Положите его в `RESEND_FROM_EMAIL` (Preview и Production на Vercel — те же значения, пока нет custom domain).
3. Ограничение onboarding: обычно можно слать только на **email аккаунта Resend** (или узкий allowlist). Для smoke A этого достаточно.

Custom domain не обязателен для закрытия **082**.

## Custom domain (SPF / DKIM / DMARC)

Когда появится свой домен сайта (после go-live / Track deploy):

1. Resend → **Domains** → Add → ваш домен.
2. Добавьте DNS-записи, которые показывает Dashboard (обычно SPF, DKIM; DMARC — по рекомендации Resend).
3. Дождитесь статуса **Verified**.
4. Обновите `RESEND_FROM_EMAIL` на адрес с этого домена (например `noreply@yourdomain`) → redeploy.
5. Повторите smoke B на Production.

## Env matrix

| Переменная               | Зачем                                                    |
| ------------------------ | -------------------------------------------------------- |
| `RESEND_API_KEY`         | Отправка через Resend                                    |
| `RESEND_FROM_EMAIL`      | Verified / onboarding From                               |
| `NEXT_PUBLIC_SERVER_URL` | Origin ссылок в письмах (не `localhost` на preview/prod) |

Канон имён — [`.env.example`](../../.env.example). Секреты — не в git; матрица размещения на Vercel — шаг **092**.

## Smoke A — сейчас (вне console)

Цель DoD **082**: путь писем проверен **не** через console adapter.

1. В `.env`: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (onboarding), `NEXT_PUBLIC_SERVER_URL=http://localhost:3000`.
2. `npm run dev` (Postgres up, migrate — как в [`LOCAL_SETUP.md`](../LOCAL_SETUP.md)).
3. Зарегистрируйте reader на inbox, куда Resend разрешает слать (часто = email Resend-аккаунта), либо используйте уже verified reader.
4. Откройте `/uk/forgot-password` → отправьте reset на этот email.
5. Ожидание: письмо в inbox (или spam) от `RESEND_FROM_EMAIL`; subject reset — `Reset your Blog password`; в Resend Dashboard → **Emails** — статус Delivered / Sent.
6. Ссылка → `/uk/reset-password?token=…` → новый пароль → login.

Доп. проверка API без своего inbox: `to: delivered@resend.dev` (Resend test sink) — письмо появится в Dashboard, в Gmail не ищите.

Негатив: очистите `RESEND_API_KEY` → снова console в логе; неверный From → ошибка/reject в Resend, письма нет.

## Smoke B — после Preview / Production (088–089)

Vercel ещё не обязателен для `done` по **082**; процедура для повтора после deploy:

1. Vercel → Project → Settings → Environment Variables: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_SERVER_URL` = URL preview или production (не localhost).
2. Redeploy.
3. На live URL: `/uk/forgot-password` → тот же inbox → письмо → reset → login.
4. В Resend Dashboard убедитесь, что From и delivery ок.

Галочки go-live в [`production-checklist.md`](../production-checklist.md) — шаг **108**.

## Troubleshooting

| Симптом                      | Что проверить                                                              |
| ---------------------------- | -------------------------------------------------------------------------- |
| Письма только в логе dev     | `RESEND_API_KEY` пустой                                                    |
| Resend reject / 403 From     | `RESEND_FROM_EMAIL` не из verified / onboarding domain                     |
| Ссылка в письме на localhost | На preview/prod `NEXT_PUBLIC_SERVER_URL` должен быть публичный origin      |
| Письмо не приходит, API ok   | Spam; onboarding allowlist (только свой email)                             |
| 429 на forgot / reset        | App rate limit (**074**) и Payload `forgotPassword.minRequestInterval` 15s |
| Token expired                | Срок reset — 1 час (`Users.auth.forgotPassword.expiration`)                |

## Операции

- **Ротация ключа:** новый API key в Resend → обновить env → redeploy → revoke старый → smoke A или B.
- **Смена From:** только на verified адрес → обновить `RESEND_FROM_EMAIL` → redeploy → smoke.
- **Маркетинг / newsletter:** не через этот адаптер и не через тот же From без отдельной политики (вне скоупа).

## Вне скоупа этого шага

- Подключение Vercel / Neon (**088+**)
- Пункты Resend в production checklist (**108**)
- Обязательный custom domain (достаточно onboarding)
