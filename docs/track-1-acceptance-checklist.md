# Track 1 acceptance checklist (steps 033–054)

Use this list before treating **Track 1 — Platform Core** as closed. Commands run from the repository root unless noted.

**Prerequisite:** [Track 0 acceptance checklist](./track-0-acceptance-checklist.md) completed (steps 001–032).

## Prerequisites

- [ ] Track 0 checklist signed off ([`track-0-acceptance-checklist.md`](./track-0-acceptance-checklist.md)).
- [ ] Root `.env` matches [`.env.example`](../.env.example) (or documented overrides) — see [`lesson-033`](./lessons/lesson-033-nest-config-and-env-validation.md).
- [ ] `npm run db:up` — Postgres healthy for readiness checks ([`LOCAL_SETUP.md`](./LOCAL_SETUP.md)).

## Build, types, lint, tests

- [ ] `npx nx run shared-contracts:build` succeeds.
- [ ] `npx nx run api:test` succeeds (includes error JSON contract spec from step 054).
- [ ] `npx nx run api:test:e2e` succeeds (request/correlation IDs, validation smoke).
- [ ] `npm run lint:ci` succeeds.

## Config and fail-fast (033)

- [ ] API starts with default `.env`; keys in [`.env.example`](../.env.example) match Zod schema in `apps/api/src/config/env.schema.ts`.
- [ ] Invalid `PORT` (e.g. `PORT=not-a-number`) fails at startup with a clear message — see [`lesson-033`](./lessons/lesson-033-nest-config-and-env-validation.md).

## Health probes (034–036)

With API running (`npm run start:dev`) and `npm run db:up`:

- [ ] `curl -sS http://127.0.0.1:4000/health` — liveness OK ([`lesson-034`](./lessons/lesson-034-terminus-health-liveness.md)).
- [ ] `curl -sS http://127.0.0.1:4000/health/ready` — readiness OK when Postgres is up ([`lesson-035`](./lessons/lesson-035-readiness-probe-dependencies.md)).
- [ ] Health response shapes exported from `@blog/shared-contracts` ([`lesson-036`](./lessons/lesson-036-health-response-dtos.md)).

## Errors and validation (037–042, 054)

- [ ] `npx nx run api:test` — `api-error-problem-details.contract.spec.ts` green (all platform error codes, no legacy Nest fields) — [`lesson-054`](./lessons/lesson-054-error-json-contract-tests.md).
- [ ] Optional manual: `curl -sS -D - http://127.0.0.1:4000/api/v1/examples/not-a-uuid` — `Content-Type: application/problem+json`, no `statusCode`/`message`/`error` in body ([`lesson-041`](./lessons/lesson-041-problem-details-alignment.md)).
- [ ] Unknown 5xx responses use safe client-facing detail ([`lesson-042`](./lessons/lesson-042-safe-unknown-errors.md)).

## Request context and logs (043–047)

- [ ] E2E: responses include `X-Request-Id` and `X-Correlation-Id` — [`lesson-046`](./lessons/lesson-046-correlation-id.md).
- [ ] `instance` in problem+json equals request id when `X-Request-Id` sent ([`lesson-043`](./lessons/lesson-043-request-id-middleware.md)).
- [ ] Log redaction unit tests pass in `api:test` ([`lesson-047`](./lessons/lesson-047-log-redaction.md)).
- [ ] Structured JSON logs and per-request access log documented ([`lesson-044`](./lessons/lesson-044-structured-logging.md), [`lesson-045`](./lessons/lesson-045-request-logging-interceptor.md)).

## Observability (048–050, 056)

- [ ] `npx nx run api:build` succeeds with OpenTelemetry noop wiring ([`lesson-048`](./lessons/lesson-048-opentelemetry-noop.md)).
- [ ] W3C `traceparent` propagation covered by unit/e2e tests ([`lesson-049`](./lessons/lesson-049-trace-context-propagation.md)).
- [ ] With API running: `curl -sS http://127.0.0.1:4000/metrics | head` — Prometheus text exposition ([`lesson-050`](./lessons/lesson-050-metrics-endpoint-stub.md)).
- [ ] Optional OTLP: `OTEL_TRACES_EXPORTER=otlp` + collector — traces export ([`lesson-056`](./lessons/lesson-056-platform-observability-follow-ups.md), [ADR-002](./adr/002-platform-observability.md)).
- [ ] `/metrics` scrape includes `http_request_duration_seconds` after at least one `/api/v1` request ([`lesson-056`](./lessons/lesson-056-platform-observability-follow-ups.md)).

## API surface (051)

With API running:

- [ ] `curl -sS http://127.0.0.1:4000/health` — ops route on root (not under `/api/v1`).
- [ ] `curl -sS http://127.0.0.1:4000/api/v1/examples` — versioned public API ([`lesson-051`](./lessons/lesson-051-api-prefix-and-versioning.md)).

## Lifecycle (052–053)

- [ ] `npx nx run api:build && npm run shutdown:smoke` exits `0` ([`lesson-052`](./lessons/lesson-052-graceful-shutdown-hooks.md)).
- [ ] Request timeout / shutdown grace covered by `api:test` ([`lesson-053`](./lessons/lesson-053-request-timeout-abort.md)).

## CI parity (optional but recommended before Track 2)

- [ ] `npm run ci` passes locally (same ordering as GitHub Actions baseline).

## Manual smoke

With `npm run db:up` and `npm run start:dev` (and optionally `npm run web:dev`):

- [ ] `npm run health:smoke` exits `0` ([`lesson-029`](./lessons/lesson-029-health-smoke-script.md)).

## Documentation

- [ ] [`development-roadmap.md`](./development-roadmap.md) baseline reflects completed steps through **056**.
- [ ] Lessons **033–056** linked in roadmap index and [`learning-path.md`](./learning-path.md).
- [ ] [`storytelling.md`](./storytelling.md) — Track 1 epilogue / «Где мы сейчас» updated for step 056.

## Sign-off

- [ ] Owner reviewed Track 1 lessons **033–054** for link rot against this checklist.
- [ ] Step **056** (observability follow-ups) completed or consciously skipped with ADR-002 noted.
- [ ] Next work item is **Track 2 — Auth and Identity** starting at step **057** ([`development-roadmap.md`](./development-roadmap.md)).
