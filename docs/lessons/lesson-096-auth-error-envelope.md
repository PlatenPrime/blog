# Lesson 096: Auth failures in API error envelope

## Learning Goal

Закрепить реальные **auth failures** в общем API error envelope: production auth routes возвращают `application/problem+json`, проходят `problemDetailsBodySchema` из `@blog/shared-contracts` и не отдают legacy Nest-поля (`statusCode`, `message`, `error`, `stack`).

## Implementation Scope

В скоупе:

- [`apps/api/src/errors/api-auth-error-problem-details.contract.spec.ts`](../../apps/api/src/errors/api-auth-error-problem-details.contract.spec.ts) — contract spec для реальных auth routes.
- Auth failure matrix: login validation, invalid credentials, missing access token, invalid refresh token, verified-email policy failure, login lockout.
- Reuse [`expectProblemDetailsContract`](../../apps/api/src/testing/expect-problem-details-contract.ts) from step 054.

Намеренно **не** делаем:

- Новые auth-specific error codes в `shared-contracts`.
- Изменение DTO или публичных success contracts.
- OpenAPI export: wire contract не меняется, только тестовая страховка.
- Frontend error parser (`libs/web-api`) — это шаг **175**.

## Dependencies

- [Шаг 041](./lesson-041-problem-details-alignment.md) — `application/problem+json`.
- [Шаг 054](./lesson-054-error-json-contract-tests.md) — общий helper и schema-level contract checks.
- [Шаги 065–074](./lesson-065-auth-login.md) — login, JWT и lockout.
- [Шаг 093](./lesson-093-require-email-verified-policy.md) — verified-email policy failures.

## External operations (outside the repo)

В этом шаге достаточно monorepo + уже поднятого local compose; аккаунты Railway/Vercel/Supabase не нужны.

| Action | Where | Required this step? | Why                                               |
| ------ | ----- | ------------------- | ------------------------------------------------- |
| —      | —     | **Нет**             | Меняется contract spec и docs, без новых сервисов |

**Architecture sketch:** Клиент видит один и тот же `problem+json` envelope для platform и auth ошибок. Nest `ApiExceptionFilter` остаётся общей точкой перевода исключений в wire contract; auth сервисы и guards только бросают обычные `HttpException`. Contract spec поднимает `AppModule` с production HTTP bootstrap, но заменяет Postgres, почту и auth repositories моками, чтобы тест проверял HTTP envelope, а не внешнюю инфраструктуру. Позже frontend-клиент сможет обрабатывать `code/status/detail/details` одинаково для auth, CMS и публичных маршрутов.

## Step-by-Step Changes

1. **Red:** добавить contract spec на реальные auth failure routes.
2. **Green:** подтвердить, что текущий mapper/filter уже отдаёт общий envelope.
3. **Refactor:** не вводить новые auth codes, пока нет frontend/domain потребности.
4. **Docs sync:** урок 096, roadmap, indexes, storytelling, related lessons.
5. **Verify:** focused spec + `npx nx run api:test`.

## Code Example

```typescript
expectProblemDetailsContract(response, {
  status: 401,
  code: API_ERROR_CODE_UNAUTHORIZED,
  detail: INVALID_LOGIN_CREDENTIALS_MESSAGE,
  expectDetails: false,
});
```

## Context

К шагу 054 общий error contract уже был зафиксирован для platform-кодов, но часть `401/403/409` проверялась через test-only probe. В Track 2 появились настоящие auth routes и реальные причины отказа: неверный пароль, отсутствующий access token, неактивный refresh, строгая политика verified email, lockout.

## Concept

**Platform code, domain detail:** `UNAUTHORIZED`, `FORBIDDEN` и `TOO_MANY_REQUESTS` остаются общими кодами. Auth-специфика живёт в `detail`, где уже есть нейтральные сообщения без account enumeration.

**One parser for clients:** frontend не должен знать, откуда пришла ошибка — из validation pipe, auth guard или service. Он получает `type`, `title`, `status`, `detail`, `code`, опциональные `details`.

**Contract test, not e2e story:** этот spec не доказывает весь login flow. Он доказывает wire shape на representative failure cases, используя production HTTP bootstrap.

## Why This Matters

Auth ошибки — первое место, где frontend будет показывать человеку понятный текст: неверный пароль, нужно подтвердить почту, слишком много попыток. Если эти ответы выбиваются из общего envelope, web-слой быстро обрастёт частными ветками и начнёт зависеть от Nest internals.

## Architecture Notes

- `VALIDATION_FAILED` остаётся единственным auth failure с `details`.
- Invalid credentials and refresh token use neutral `401` messages.
- Verified-email policy uses `403`, not `401`: пользователь известен, но действие запрещено политикой.
- Lockout stays `429 TOO_MANY_REQUESTS`; retry timing remains policy concern, not a new response shape.

## Changed Files

| File                                                                                         | Action                                     |
| -------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `apps/api/src/errors/api-auth-error-problem-details.contract.spec.ts`                        | created — auth failure contract matrix     |
| `docs/lessons/lesson-096-auth-error-envelope.md`                                             | created                                    |
| `docs/development-roadmap.md`                                                                | changed — 096 done                         |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md`                          | changed — indexes and narrative checkpoint |
| `docs/lessons/lesson-054-error-json-contract-tests.md`                                       | changed — production auth route pointer    |
| `docs/lessons/lesson-093-require-email-verified-policy.md` / `lesson-094-openapi-swagger.md` | changed — related pointers                 |
| `docs/lessons/lesson-095-session-device-metadata.md`                                         | changed — next-step pointer                |
| `docs/security/threat-model-stub.md`                                                         | changed — auth control status through 096  |

## Verification

```bash
npm run test -w api -- api-auth-error-problem-details.contract.spec.ts
npx nx run api:test
```

- Contract: auth failures match `problemDetailsBodySchema`.
- Contract: no legacy Nest error fields leak in auth failures.
- Full unit suite: `api:test`.

## TDD Sequence

1. **Red:** spec expects auth routes to return shared problem details.
2. **Green:** existing `ApiExceptionFilter` + mapper satisfy the matrix.
3. **Refactor:** keep auth services focused on domain decisions; keep envelope mapping centralized.

## Definition of Done

- [x] Real auth failure routes covered by contract spec.
- [x] Shared contract helper reused; no duplicate assertions.
- [x] No new auth-specific error codes introduced.
- [x] Docs sync completed.

## What To Remember

- Auth errors are not a separate wire format.
- Neutral auth messages prevent account/token enumeration.
- Следующий шаг Track 2 — **097**: service/API key auth stub.
