# Lesson 090: Email channel (MailDev + EmailService)

## Learning Goal

Добавить **реальный канал доставки** для verify/reset: MailDev в local compose, абстракция `EmailService` в API и шаблоны писем — чтобы токены уходили по SMTP, а не только в JSON ответа (учебный компромисс шагов 076–077).

## Implementation Scope

В скоупе:

- MailDev в `docker-compose` + порты в [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md).
- `EmailModule` / `EmailService` в `apps/api` — `sendVerificationEmail`, `sendPasswordResetEmail`.
- Env: `SMTP_*`, `APP_PUBLIC_BASE_URL`, `EMAIL_RETURN_TOKEN_IN_RESPONSE` в `.env.example` и Zod `env.schema.ts`.
- Вызовы из `AuthService` после register / request-password-reset (токен **не** в JSON при успешной отправке и включённом SMTP).
- Unit-тесты с mock transport (без реального SMTP в CI).

Намеренно **не** делаем:

- Production ESP (SendGrid/SES) — ADR/runbook позже.
- Rate limits на reset/resend — [шаг 091](./lesson-091-auth-sensitive-rate-limits.md) (done).
- HTML-вёрстка «как в проде» — plain-text достаточно.

## Dependencies

- [Шаг 076](./lesson-076-auth-verify-email.md) — verify flow.
- [Шаг 077](./lesson-077-password-reset-request-flow.md) — reset request.
- [Шаг 033](./lesson-033-nest-config-and-env-validation.md) — Zod env.
- [Шаг 016](./lesson-016-postgres-compose-local-dev.md) — compose patterns.

## External operations (outside the repo)

| Action                                                                  | Where (tool / URL)                              | Required this step?               | Why in the architecture                                                               |
| ----------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| Установить / запустить **Docker Desktop** (или engine + compose plugin) | Хост ОС                                         | Да, если ещё не сделано в Track 0 | MailDev и Postgres из урока 016 крутятся в контейнерах                                |
| `docker compose up -d` в корне репозитория                              | Терминал — см. [LOCAL_SETUP](../LOCAL_SETUP.md) | Да                                | Поднимает Postgres + MailDev SMTP                                                     |
| Открыть **MailDev Web UI**                                              | Браузер: `http://127.0.0.1:1080`                | Да для ручной проверки            | Видите письмо verify/reset так, как пользователь в dev, без реального почтового ящика |
| Заполнить `SMTP_*` в `.env`                                             | Корневой `.env` (см. `.env.example`)            | Да                                | API шлёт почту на MailDev как на SMTP-сервер, не в stdout                             |
| Аккаунт **Resend / SendGrid / AWS SES**                                 | Облачные dashboard                              | **Нет** — шаг Track 8 / runbook   | Production transport подключим позже, интерфейс `EmailService` тот же                 |
| **Railway / Vercel / Supabase**                                         | Облако                                          | **Нет**                           | Деплой и managed DB не нужны для локального канала почты                              |

**Architecture sketch:** Браузер или HTTP-клиент бьётся в **Nest API** на ноутбуке. API пишет токены в **Postgres** (как раньше) и **отправляет письмо по SMTP** в контейнер **MailDev** — отдельный процесс в Docker, не часть Node. MailDev не доставляет письмо в интернет: это «почтовый ящик разработчика». В production тот же слой `EmailService` будет смотреть на другой SMTP host (ESP), но граница «API → SMTP → почтовый мир» останется; секрет verify/reset не должен возвращаться в JSON ответа, когда SMTP включён.

**Deferred:** production ESP, DNS (SPF/DKIM), webhook — не этот шаг; см. roadmap Track 8 и security Track 7.

## Step-by-Step Changes

1. **Red:** `email.service.spec.ts` + расширение `auth.service.spec.ts` (SMTP on/off, omit token).
2. MailDev в compose; документировать UI URL в LOCAL_SETUP.
3. `EmailService` + nodemailer; plain-text шаблоны в `build-auth-email-content.ts`.
4. `AuthModule` → `EmailModule`; `AuthService` вызывает send после persist токена.
5. `EMAIL_RETURN_TOKEN_IN_RESPONSE` и пустой `SMTP_HOST` для CI/e2e.
6. **Verify:** `docker compose up -d`, `nx run api:test`, `nx run api:test:e2e`, ручная проверка в MailDev UI.

## Code Example

```typescript
// apps/api/src/auth/auth.service.ts (delivery gate)
if (!this.email.isEnabled()) {
  return token;
}
await this.email.sendVerificationEmail({ to: email, token });
return this.shouldReturnTokenInResponse() ? token : undefined;
```

## Context

После 076–077 потоки verify/reset работают, но письма не отправлялись — токены временно возвращались в API для локальной отладки. Шаг **090** закрывает разрыв между моделью токена и продуктовой доставкой перед публичным CMS (**128** list) и шагом **093** (verified-email gate).

## Concept

**Out-of-band delivery:** секрет для восстановления/подтверждения должен приходить по каналу, который атакующий не видит из одного HTTP-ответа register/reset.

## Architecture Notes

- Dev: MailDev ловит всё SMTP на `127.0.0.1:1025`; UI на `:1080`.
- Prod (позже): тот же `EmailService`, другой transport из env.
- Ошибка SMTP на reset: лог, neutral 200 без `passwordResetToken` (anti-enumeration сохранён).

## Changed Files

| Файл                                                  | Действие                                                        |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| `docker-compose.yml`                                  | MailDev service                                                 |
| `.env.example`                                        | SMTP + `APP_PUBLIC_BASE_URL` + `EMAIL_RETURN_TOKEN_IN_RESPONSE` |
| `package.json`                                        | `compose:up` script                                             |
| `apps/api/package.json`                               | `nodemailer` dependency                                         |
| `apps/api/src/config/env.schema.ts`                   | SMTP env keys                                                   |
| `apps/api/src/config/env.schema.spec.ts`              | defaults tests                                                  |
| `apps/api/src/email/*`                                | `EmailModule`, `EmailService`, templates                        |
| `apps/api/src/email/email.service.spec.ts`            | unit (mock transport)                                           |
| `apps/api/src/email/build-auth-email-content.spec.ts` | unit                                                            |
| `apps/api/src/auth/auth.service.ts`                   | deliver verify/reset emails                                     |
| `apps/api/src/auth/auth.service.spec.ts`              | SMTP on/off cases                                               |
| `apps/api/src/auth/auth.module.ts`                    | import `EmailModule`                                            |
| `apps/api/vitest.config.e2e.ts`                       | force `SMTP_HOST=''` for e2e                                    |
| `libs/shared-contracts/src/auth/register.types.ts`    | optional `emailVerificationToken`                               |
| `docs/lessons/lesson-090-email-channel.md`            | updated                                                         |
| `docs/development-roadmap.md`                         | step 090 done                                                   |
| `docs/README.md`, `docs/learning-path.md`             | index                                                           |
| `docs/LOCAL_SETUP.md`                                 | MailDev section                                                 |
| `docs/storytelling.md`                                | chapter XVI arc + checkpoints                                   |
| `docs/security/threat-model-stub.md`                  | email control done                                              |

## Verification

```bash
npm run compose:up
nx run api:test
nx run api:test:e2e
# With SMTP_* in .env: register or request-password-reset; open http://127.0.0.1:1080
```

## Definition of Done

- [x] MailDev documented and starts with compose.
- [x] `EmailService` covered by unit tests (mock transport).
- [x] Register and password-reset request invoke email when SMTP configured.
- [x] Storytelling: chapter XVI arc; roadmap baseline **092** next (after 091).
- [x] No production secrets committed.
- [ ] **External operations** (compose + MailDev UI) — выполните локально при первом проходе.

## What To Remember

- Следующий шаг после 091 — **092** (Helmet + global throttler), не **095** (session metadata).
- См. [ADR-003](../adr/003-roadmap-renumber-090-plus.md) если встречаете старые номера шагов в уроках 001–089.
