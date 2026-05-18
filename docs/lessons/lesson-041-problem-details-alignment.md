# Lesson 041: Problem Details (`problem+json`) alignment

## Learning Goal

Выровнять JSON-ошибки API под [RFC 7807](https://www.rfc-editor.org/rfc/rfc7807): wire-формат `application/problem+json` с полями `type`, `title`, `status`, `detail`, extension-полями `code`/`details`, Zod-схемой в `shared-contracts` и contract-тестом.

## Implementation Scope

В скоупе:

- [`libs/shared-contracts/src/errors/problem-details.types.ts`](../../libs/shared-contracts/src/errors/problem-details.types.ts) — `ProblemDetailsBody`, URI/title helpers.
- [`libs/shared-contracts/src/errors/problem-details.schema.ts`](../../libs/shared-contracts/src/errors/problem-details.schema.ts) — `problemDetailsBodySchema` (Zod).
- [`apps/api/src/errors/map-api-error-to-problem-details.ts`](../../apps/api/src/errors/map-api-error-to-problem-details.ts) — `ApiErrorBody` → `ProblemDetailsBody`.
- [`apps/api/src/errors/api-exception.filter.ts`](../../apps/api/src/errors/api-exception.filter.ts) — `Content-Type: application/problem+json`.
- [`apps/api/src/errors/api-error-problem-details.contract.spec.ts`](../../apps/api/src/errors/api-error-problem-details.contract.spec.ts) — contract test.
- Обновление unit/e2e; документация roadmap/learning-path/docs README.

Намеренно **не** делаем:

- `requestId` / `instance` из middleware — [шаги 043–046](../development-roadmap.md).
- Расширенные contract-тесты всех кодов — [шаг 054](../development-roadmap.md).
- Content negotiation (`Accept`) — один формат для всех клиентов.
- Health probes — Terminus JSON без изменений.

## Dependencies

- Шаги 037–040 — `ApiErrorBody`, exception filter, validation `details`.
- `zod` в `@blog/shared-contracts`.

## Step-by-Step Changes

1. Добавить `ProblemDetailsBody`, helpers и Zod schema в `shared-contracts`.
2. Реализовать `mapApiErrorToProblemDetails` и подключить в `ApiExceptionFilter`.
3. Contract test + обновить unit/e2e под problem+json.
4. **Verify.** `npx nx run shared-contracts:build`, `nx run api:test`, `api:test:e2e`.
5. **Docs.** Урок 041, baseline roadmap, learning-path, docs README.

## Code Example

```json
{
  "type": "https://blog.dev/problems/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "detail": "Validation failed",
  "code": "VALIDATION_FAILED",
  "details": [{ "field": "title", "message": "title should not be empty" }]
}
```

```typescript
httpAdapter.setHeader(response, 'Content-Type', PROBLEM_MEDIA_TYPE);
httpAdapter.reply(response, problemBody, status);
```

## Context

После 040 клиенты получали `{ code, message, details? }` как обычный JSON. Шаг 041 делает ошибки совместимыми с RFC 7807: стабильные `type`/`title`, `status` в теле, `detail` вместо `message` на wire. Внутренний mapper по-прежнему использует `ApiErrorBody` с `message`.

## Architecture Notes

- **`ApiErrorBody`:** internal mapper shape; публичный wire-контракт — `ProblemDetailsBody`.
- **`type`:** `${PROBLEM_TYPE_BASE_URI}/${slug}`; slug из платформенного `code`.
- **Health:** `HealthCheckError` rethrow — без problem+json.
- **Contract test:** `problemDetailsBodySchema.safeParse` + `Content-Type` на `POST /examples` `{}`.

## Changed Files

| Файл                                                                     | Действие       |
| ------------------------------------------------------------------------ | -------------- |
| `libs/shared-contracts/src/errors/problem-details.types.ts`              | создан         |
| `libs/shared-contracts/src/errors/problem-details.schema.ts`             | создан         |
| `libs/shared-contracts/package.json`                                     | zod dependency |
| `libs/shared-contracts/src/index.ts`                                     | re-export      |
| `apps/api/src/errors/map-api-error-to-problem-details.ts`                | создан         |
| `apps/api/src/errors/api-exception.filter.ts`                            | problem+json   |
| `apps/api/src/errors/api-error-problem-details.contract.spec.ts`         | создан         |
| `apps/api/src/errors/*.spec.ts`, `test/app.e2e-spec.ts`                  | обновлены      |
| `docs/api/dto-validation-conventions.md`                                 | секция ошибок  |
| `docs/lessons/lesson-041-problem-details-alignment.md`                   | создан         |
| `docs/development-roadmap.md`, `docs/learning-path.md`, `docs/README.md` | шаг 041        |

## Verification

```bash
npx nx run shared-contracts:build
npx nx run api:test
npx nx run api:test:e2e
```

Ожидание:

- Ошибки приложения: `Content-Type: application/problem+json`.
- Contract test: Zod schema pass на validation error.
- `/health`, `/health/ready` — без регрессии.

## Definition of Done

- [x] `ProblemDetailsBody` + Zod schema в `shared-contracts`.
- [x] API отдаёт `application/problem+json` через global filter.
- [x] Contract test на `VALIDATION_FAILED`.
- [x] `nx run api:test`, `api:test:e2e` зелёные.
- [x] Урок 041 и индексы roadmap/learning-path/docs README обновлены.

## What To Remember

- Wire: `detail`, не `message`; `status` дублируется в body (RFC).
- `ApiErrorBody` — только для mapper внутри API.
- Расширенные contract-тесты — шаг 054; `instance` из request ID — 043–046.

## Verify

```bash
npx nx run api:test
```
