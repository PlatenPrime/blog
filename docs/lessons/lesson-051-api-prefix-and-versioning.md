# Lesson 051: Global API prefix + URI versioning

## Learning Goal

Закрепить публичную поверхность API под **`/api/v1`**, оставив ops-маршруты (`/health`, `/metrics`) на корне, и задокументировать контракт маршрутизации.

## Implementation Scope

В скоупе:

- [`apps/api/src/config/configure-api-http.ts`](../../apps/api/src/config/configure-api-http.ts) — `setGlobalPrefix`, `enableVersioning`, константы `API_V1_BASE`.
- [`apps/api/src/main.ts`](../../apps/api/src/main.ts) — вызов `configureApiHttp` после CORS.
- [`apps/api/src/testing/create-api-test-app.ts`](../../apps/api/src/testing/create-api-test-app.ts) — тот же bootstrap, что в prod.
- `VERSION_NEUTRAL` на [`HealthController`](../../apps/api/src/health/health.controller.ts) и [`MetricsController`](../../apps/api/src/metrics/metrics.controller.ts).
- Unit + e2e обновления; [`scripts/health-smoke.mjs`](../../scripts/health-smoke.mjs) → `GET /health`.
- [`docs/api/routing-and-versioning.md`](../api/routing-and-versioning.md).

Намеренно **не** делаем:

- Header-based versioning, env overrides, redirects со старых URL.
- Изменения `apps/web` (ещё нет API-клиента).

## Dependencies

- [Шаг 050](./lesson-050-metrics-endpoint-stub.md) — `/metrics` на корне.
- [Шаг 034](./lesson-034-terminus-health-liveness.md) — `/health` на корне.

## Step-by-Step Changes

1. `configureApiHttp()` + unit/integration spec.
2. `configureApiHttp(app)` в `main.ts` и `createApiTestApp()`.
3. `@Controller({ path: 'health'|'metrics', version: VERSION_NEUTRAL })`.
4. E2e: `/api/v1`, `/api/v1/examples`, legacy `GET /examples` → 404.
5. `health-smoke.mjs` проверяет liveness JSON.
6. **Verify.** `nx run api:build`, `api:test`, `api:test:e2e`, `api:lint`.
7. **Docs.** routing doc, урок 051, roadmap, learning-path, README, storytelling.

## Code Example

```typescript
// configure-api-http.ts
export function configureApiHttp(app: INestApplication): void {
  app.setGlobalPrefix(API_GLOBAL_PREFIX, { exclude: [...OPS_ROUTE_EXCLUDES] });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_DEFAULT_VERSION,
  });
}

// health.controller.ts
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController { ... }
```

## Context

До 051 бизнес-эндпоинты жили в корне (`/examples`), что смешивало продуктовый API с пробами и метриками. Track 2 (`/auth/*`) и CMS требуют стабильного префикса и версии. URI `v1` — явный контракт для web и contract-тестов.

## Architecture Notes

- **Два механизма для ops:** `exclude` в `setGlobalPrefix` **и** `VERSION_NEUTRAL` на контроллере (иначе versioning даёт `/api/v1/health`).
- **Константа `API_V1_BASE`:** единый путь для e2e и будущего `VITE_PUBLIC_API_URL`.
- **Legacy URL:** `GET /examples` → 404 без redirect — клиенты должны перейти на `/api/v1/examples`.

## Changed Files

| Файл                                             | Действие           |
| ------------------------------------------------ | ------------------ |
| `apps/api/src/config/configure-api-http.ts`      | создан             |
| `apps/api/src/config/configure-api-http.spec.ts` | создан             |
| `apps/api/src/testing/create-api-test-app.ts`    | создан             |
| `apps/api/src/main.ts`                           | `configureApiHttp` |
| `apps/api/src/health/health.controller.ts`       | `VERSION_NEUTRAL`  |
| `apps/api/src/metrics/metrics.controller.ts`     | `VERSION_NEUTRAL`  |
| `apps/api/test/*.e2e-spec.ts`, contract spec     | пути + bootstrap   |
| `scripts/health-smoke.mjs`                       | `/health`          |
| `docs/api/routing-and-versioning.md`             | создан             |
| `apps/api/README.md`                             | секция Routing     |

## Verification

```bash
npx nx run api:build
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint
```

### Manual

```bash
curl -sS http://127.0.0.1:4000/health
curl -sS http://127.0.0.1:4000/api/v1
curl -sS http://127.0.0.1:4000/api/v1/examples
```

## Definition of Done

- [x] Прикладные маршруты под `/api/v1`.
- [x] `/health`, `/health/ready`, `/metrics` без префикса и версии.
- [x] `GET /examples` → 404.
- [x] `api:build`, `api:test`, `api:test:e2e`, `api:lint` зелёные.
- [x] [routing-and-versioning.md](../api/routing-and-versioning.md) и индексы обновлены.

## What To Remember

- Versioning + global prefix: ops-контроллеры помечай `VERSION_NEUTRAL`.
- Тестовый bootstrap = prod (`createApiTestApp`).
- Smoke API лучше бить в `/health`, не в hello-текст корня.

## Verify

Docs review: [routing-and-versioning.md](../api/routing-and-versioning.md).

```bash
npx nx run api:test:e2e
```
