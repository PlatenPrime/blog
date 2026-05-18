# API routing and versioning

Public application routes live under **`/api/v1`**. Operational endpoints stay at the **repository root** (no `/api` prefix, no URI version segment).

## Route map

| Path                 | Purpose                           | Versioned             |
| -------------------- | --------------------------------- | --------------------- |
| `GET /health`        | Liveness (Terminus)               | No                    |
| `GET /health/ready`  | Readiness (Postgres)              | No                    |
| `GET /metrics`       | Prometheus text exposition        | No                    |
| `GET /api/v1`        | API hello / smoke                 | Yes (`v1`)            |
| `/api/v1/examples`   | Sample CRUD resource (lesson 040) | Yes (`v1`)            |
| `/examples` (legacy) | —                                 | **404** (no redirect) |

Future Track 2 routes (e.g. `POST /api/v1/auth/register`) follow the same pattern.

## Implementation

Bootstrap ([`apps/api/src/main.ts`](../../apps/api/src/main.ts)) calls [`configureApiHttp()`](../../apps/api/src/config/configure-api-http.ts) after CORS:

1. **`setGlobalPrefix('api')`** with `exclude` for `health`, `health/ready`, and `metrics`.
2. **`enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })`** so controllers get `/api/v1/...` unless marked neutral.

Constants (for tests and future clients):

- `API_GLOBAL_PREFIX` → `api`
- `API_DEFAULT_VERSION` → `1`
- `API_V1_BASE` → `/api/v1`

### `VERSION_NEUTRAL` for ops controllers

Nest applies URI versioning to all routes when enabled. Exclusions on `setGlobalPrefix` alone are **not** enough ([nestjs/nest#10215](https://github.com/nestjs/nest/issues/10215)).

Ops controllers must declare **`version: VERSION_NEUTRAL`**:

- [`HealthController`](../../apps/api/src/health/health.controller.ts)
- [`MetricsController`](../../apps/api/src/metrics/metrics.controller.ts)

Without this, probes would resolve to `/api/v1/health` (404 in Kubernetes).

## Client base URL

For browser and server clients targeting the versioned API:

```text
http://localhost:4000/api/v1
```

Ops / monitoring:

```text
http://localhost:4000/health
http://localhost:4000/metrics
```

Env variables for prefix/version are **not** used yet (stable defaults). Add them only when multi-version or blue/green deployment requires runtime overrides.

## Adding API v2 later

1. Introduce `defaultVersion` policy (keep `v1` as default or bump with an ADR).
2. Add `@Version('2')` on new/changed controllers or methods.
3. Document breaking changes in `CHANGELOG.md` per [release-policy.md](../release-policy.md).
4. Deprecation headers (`Sunset`, `Link`) — optional follow-up (not in step 051).

## Verification

```bash
curl -sS http://127.0.0.1:4000/health
curl -sS http://127.0.0.1:4000/metrics | head
curl -sS http://127.0.0.1:4000/api/v1
curl -sS http://127.0.0.1:4000/api/v1/examples
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4000/examples   # expect 404
```

Automated: `npx nx run api:test:e2e` (paths and legacy 404).

## See also

- [lesson-051](../lessons/lesson-051-api-prefix-and-versioning.md)
- [NestJS global prefix](https://docs.nestjs.com/faq/global-prefix)
- [NestJS versioning](https://docs.nestjs.com/techniques/versioning)
