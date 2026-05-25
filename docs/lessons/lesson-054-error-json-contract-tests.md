# Lesson 054: Contract tests for error JSON shape

## Learning Goal

Зафиксировать wire-контракт ошибок API для всех platform-кодов: HTTP-ответы проходят `problemDetailsBodySchema` из `@blog/shared-contracts`, `Content-Type: application/problem+json`, без legacy-полей Nest (`statusCode`, `message`, `error`, `stack`).

## Implementation Scope

В скоупе:

- [`apps/api/src/testing/expect-problem-details-contract.ts`](../../apps/api/src/testing/expect-problem-details-contract.ts) — общий assert helper.
- [`apps/api/src/testing/error-probe.controller.ts`](../../apps/api/src/testing/error-probe.controller.ts) — test-only probe (не в `AppModule`).
- [`apps/api/src/testing/slow-test.controller.ts`](../../apps/api/src/testing/slow-test.controller.ts) — slow handler для `REQUEST_TIMEOUT`.
- [`apps/api/src/testing/create-api-contract-test-app.ts`](../../apps/api/src/testing/create-api-contract-test-app.ts) — bootstrap с probe controllers.
- [`apps/api/src/errors/api-error-problem-details.contract.spec.ts`](../../apps/api/src/errors/api-error-problem-details.contract.spec.ts) — матрица 8 platform codes + `instance` + health guard.

Намеренно **не** делаем:

- OpenAPI/Swagger для ошибок.
- Production-роуты для auth-кодов (позже закрыто в [шаге 096](./lesson-096-auth-error-envelope.md)).
- Ужесточение Zod `code` до enum (domain-коды позже).

## Dependencies

- [Шаг 041](./lesson-041-problem-details-alignment.md) — `problem+json`, первый contract test на `VALIDATION_FAILED`.
- [Шаг 043–046](./lesson-043-request-id-middleware.md) — `instance` из request ID.
- [Шаг 053](./lesson-053-request-timeout-abort.md) — `REQUEST_TIMEOUT`.

## Step-by-Step Changes

1. Добавить `expectProblemDetailsContract` (Zod + инварианты wire-формата).
2. Добавить test-only `ErrorProbeController` / `SlowTestController` и `createApiContractTestApp`.
3. Расширить contract spec: table-driven кейсы для всех `PlatformApiErrorCode`.
4. Cross-cutting: `X-Request-Id` → `instance`; `/health` не отдаёт problem+json.
5. **Verify.** `npx nx run shared-contracts:build`, `nx run api:test`.
6. **Docs.** Урок 054, roadmap, learning-path, storytelling; в уроке 041 — ссылка на расширение.

## Code Example

```typescript
const { body } = expectProblemDetailsContract(response, {
  status: 404,
  code: API_ERROR_CODE_NOT_FOUND,
  detail: /not found/i,
  expectDetails: false,
});
```

## Architecture Notes

- **Реальные роуты:** `VALIDATION_FAILED`, `BAD_REQUEST` (invalid UUID), `NOT_FOUND` (unknown example id) — через `ExamplesController`.
- **Probe:** `UNAUTHORIZED`, `FORBIDDEN`, `CONFLICT`, `INTERNAL_ERROR` — `GET /api/v1/_contract/errors/:scenario` только в Vitest module.
- **Timeout:** `REQUEST_TIMEOUT` — `GET /api/v1/_contract/slow` + `REQUEST_TIMEOUT_MS=200` override.
- **Health:** Terminus JSON без регрессии; negative guard в contract spec.

## Changed Files

| Файл                                                             | Действие                                |
| ---------------------------------------------------------------- | --------------------------------------- |
| `apps/api/src/testing/expect-problem-details-contract.ts`        | создан                                  |
| `apps/api/src/testing/error-probe.controller.ts`                 | создан                                  |
| `apps/api/src/testing/slow-test.controller.ts`                   | создан                                  |
| `apps/api/src/testing/create-api-contract-test-app.ts`           | создан                                  |
| `apps/api/src/errors/api-error-problem-details.contract.spec.ts` | расширен                                |
| `docs/lessons/lesson-054-error-json-contract-tests.md`           | создан                                  |
| `docs/development-roadmap.md`                                    | шаг 054 done                            |
| `docs/learning-path.md`                                          | ссылка на урок 054                      |
| `docs/storytelling.md`                                           | глава VI, «Где мы сейчас», «Что дальше» |
| `docs/lessons/lesson-041-problem-details-alignment.md`           | ссылка на 054                           |

## Definition of Done

- [x] Все 8 platform error codes покрыты contract spec (`api:test`).
- [x] Probe controllers не импортируются в `AppModule`.
- [x] `instance` проверяется при переданном `X-Request-Id`.
- [x] `/health` не возвращает `application/problem+json`.
- [x] `nx run api:test` зелёный.

## What To Remember

- Contract tests живут в `src/**/*.contract.spec.ts` и входят в `api:test`, не в e2e.
- Wire: `detail` + `status` в body; legacy Nest-поля не утекают в JSON.
- Auth-ошибки в production закрыты отдельной матрицей в [шаге 096](./lesson-096-auth-error-envelope.md).

## Verify

```bash
npx nx run shared-contracts:build
npx nx run api:test
```
