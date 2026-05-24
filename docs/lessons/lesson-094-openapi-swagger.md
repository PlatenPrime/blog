# Lesson 094: OpenAPI / Swagger + schema export

## Learning Goal

Подключить **интерактивную OpenAPI-документацию** (`/api/docs`, JSON `/api/docs-json`) и **экспорт снимка** в `docs/openapi/` для ревью контрактов до Track 3 и `libs/web-api` (**175**).

## Implementation Scope

В скоупе:

- `@nestjs/swagger`, `swagger-ui-express` в `apps/api`.
- [`build-openapi-document.ts`](../../apps/api/src/config/build-openapi-document.ts), [`configure-api-openapi.ts`](../../apps/api/src/config/configure-api-openapi.ts) — единый builder + UI.
- Вызов из [`configure-api-http-bootstrap.ts`](../../apps/api/src/config/configure-api-http-bootstrap.ts) (prod + e2e).
- Nest CLI plugin (`classValidatorShim`) в [`nest-cli.json`](../../apps/api/nest-cli.json).
- Схемы ответов/ошибок в `apps/api/src/openapi/` (не в `shared-contracts`).
- Декораторы на auth, examples, cms, rbac probe, app controllers.
- Экспорт: [`export-openapi.ts`](../../apps/api/src/scripts/export-openapi.ts) → [`docs/openapi/api-v1.openapi.json`](../openapi/api-v1.openapi.json).
- Nx: `api:openapi:export`.
- Unit + e2e: [`configure-api-openapi.spec.ts`](../../apps/api/src/config/configure-api-openapi.spec.ts), [`openapi.e2e-spec.ts`](../../apps/api/test/openapi.e2e-spec.ts).

Намеренно **не** делаем:

- Генерацию `libs/web-api` (**175**).
- Полную матрицу auth error codes в spec (**096**).
- Ops routes (`/health`, `/metrics`) в публичной spec.
- Prod env gate `OPENAPI_ENABLED` (можно позже).
- CI diff-gate на openapi.json.

## Dependencies

- [Шаг 092](./lesson-092-api-security-baseline.md) — общий HTTP bootstrap.
- [Шаг 093](./lesson-093-require-email-verified-policy.md) — JWT-маршруты в spec.
- [Шаг 054](./lesson-054-error-json-contract-tests.md) — problem+json wire (Zod); OpenAPI дублирует форму для документации.

## External operations (outside the repo)

В этом шаге достаточно monorepo + уже поднятого local compose; аккаунты Railway/Vercel/Supabase не нужны.

| Action | Where | Required this step? | Why                                               |
| ------ | ----- | ------------------- | ------------------------------------------------- |
| —      | —     | **Нет**             | Swagger UI — тот же локальный API; экспорт без БД |

**Architecture sketch:** Браузер или ревьюер открывает Swagger UI на том же Nest-процессе, что и продуктовые маршруты. Снимок JSON живёт в `docs/openapi/` для diff в PR; runtime-контракты типов по-прежнему в `@blog/shared-contracts`. Экспорт поднимает тестовое приложение со stub DataSource — Postgres не обязателен.

## Step-by-Step Changes

1. **Red:** `configure-api-openapi.spec.ts`, `openapi.e2e-spec.ts`.
2. **Green:** пакеты, `buildOpenApiDocument`, `configureApiOpenApi`, bootstrap, plugin, openapi schema classes, controller decorators.
3. **Export:** `nx run api:openapi:export` → commit `docs/openapi/api-v1.openapi.json`.
4. **Verify:** `shared-contracts:build`, `api:test`, `api:test:e2e`, `api:lint`, `api:build`, `api:openapi:export`.
5. **Docs sync:** урок 094, roadmap, storytelling, indexes, LOCAL_SETUP.

## Code Example

```typescript
// apps/api/src/config/configure-api-openapi.ts
export function configureApiOpenApi(app: INestApplication): void {
  const document = buildOpenApiDocument(app);
  SwaggerModule.setup(OPENAPI_DOCS_PATH, app, document, {
    jsonDocumentUrl: OPENAPI_JSON_PATH,
    useGlobalPrefix: true,
  });
}
```

## Context

После **093** периметр и verified-email gate на месте, но контракт HTTP нельзя было сверить без чтения кода. **094** — черновой договор перед постами (**110**) и двумя фронтами.

## Concept

| Surface            | URL                                | Назначение                          |
| ------------------ | ---------------------------------- | ----------------------------------- |
| Swagger UI         | `/api/docs`                        | Интерактивный просмотр и Try it out |
| OpenAPI JSON       | `/api/docs-json`                   | Машиночитаемая spec                 |
| Committed snapshot | `docs/openapi/api-v1.openapi.json` | Diff в PR                           |

Request bodies берутся из DTO + CLI plugin; success responses — schema classes в `apps/api/src/openapi/`; ошибки — `application/problem+json` через `@ApiProblemResponse`.

## Why This Matters

Два клиента (публичный сайт и админка) и ревьюеры должны видеть одни и те же пути, статусы и схемы. OpenAPI не заменяет TypeScript-контракты, но даёт общую картину HTTP до codegen на **175**.

## Architecture Notes

- **shared-contracts** остаётся без Nest/Swagger — только api-layer schema classes.
- **Export** использует `createApiTestApp()` — без живой БД.
- **Ops** и test-only probes не входят в публичную spec.

## Changed Files

| File                                                  | Action                                          |
| ----------------------------------------------------- | ----------------------------------------------- |
| `apps/api/package.json`                               | changed — swagger deps, `openapi:export` script |
| `apps/api/nest-cli.json`                              | changed — swagger plugin                        |
| `apps/api/project.json`                               | changed — `openapi:export` target               |
| `apps/api/src/config/build-openapi-document.ts`       | created                                         |
| `apps/api/src/config/configure-api-openapi.ts`        | created                                         |
| `apps/api/src/config/configure-api-openapi.spec.ts`   | created                                         |
| `apps/api/src/config/configure-api-http-bootstrap.ts` | changed — OpenAPI step                          |
| `apps/api/src/openapi/**`                             | created — schemas + decorators                  |
| `apps/api/src/auth/auth.controller.ts`                | changed — ApiTags, responses                    |
| `apps/api/src/examples/examples.controller.ts`        | changed                                         |
| `apps/api/src/cms/cms-posts.controller.ts`            | changed                                         |
| `apps/api/src/rbac/rbac-probe.controller.ts`          | changed                                         |
| `apps/api/src/app.controller.ts`                      | changed                                         |
| `apps/api/src/scripts/export-openapi.ts`              | created                                         |
| `apps/api/test/openapi.e2e-spec.ts`                   | created                                         |
| `docs/openapi/api-v1.openapi.json`                    | created — committed snapshot                    |
| `docs/openapi/README.md`                              | created                                         |
| `docs/lessons/lesson-094-openapi-swagger.md`          | created                                         |
| `docs/development-roadmap.md`                         | changed                                         |
| `docs/storytelling.md`                                | changed                                         |
| `docs/README.md`                                      | changed                                         |
| `docs/learning-path.md`                               | changed                                         |
| `docs/LOCAL_SETUP.md`                                 | changed                                         |

## Verification

```bash
nx run shared-contracts:build
nx run api:test
nx run api:test:e2e
nx run api:lint
nx run api:build
nx run api:openapi:export
```

- **E2E:** `test/openapi.e2e-spec.ts` — `/api/docs` HTML, `/api/docs-json` с путём `/api/v1/auth/login`.
- **Manual:** `npm run start:dev` → http://127.0.0.1:4000/api/docs

## TDD Sequence

1. **Red:** unit document builder spec, e2e docs routes.
2. **Green:** bootstrap, schemas, controllers, export script.
3. **Refactor:** shared `buildOpenApiDocument` для UI и export.

## Definition of Done

- [x] Swagger UI at `/api/docs`, JSON at `/api/docs-json`.
- [x] Auth, examples, cms, rbac, app routes documented; ops excluded.
- [x] problem+json responses documented via shared decorator.
- [x] Committed snapshot in `docs/openapi/`.
- [x] Unit + e2e specs; docs sync.

## What To Remember

- OpenAPI в api — типы в shared-contracts; не смешивать слои.
- После изменения HTTP API — `nx run api:openapi:export` в том же PR.
- Следующий шаг Track 2 — **095** (session metadata в audit); Track 3 посты — **110**.

## Verify

```bash
nx run api:test
nx run api:openapi:export
```
