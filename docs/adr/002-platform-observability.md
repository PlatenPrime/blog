# ADR-002: Platform observability (traces, logs, metrics)

## Status

Accepted — baseline for API observability after Track 1 step 056.

## Context

Track 1 lessons 048–053 introduced:

- OpenTelemetry tracer wiring with noop export by default
- W3C `traceparent` propagation on incoming HTTP
- Structured JSON logging with `requestId` / `correlationId`
- Prometheus `/metrics` with process-level default metrics
- Request timeout / client abort handling

Several items were intentionally deferred to avoid requiring a collector in CI and to keep each lesson focused. Step 056 closes the **platform** observability baseline before Track 2 (auth/domain).

## Decision

1. **Traces — opt-in OTLP export**
   - Default: `OTEL_TRACES_EXPORTER=none` — spans are created in-process only (CI/local without collector).
   - When `OTEL_TRACES_EXPORTER=otlp` and `OTEL_EXPORTER_OTLP_ENDPOINT` is set: register `BatchSpanProcessor` + OTLP HTTP exporter before Nest bootstrap (`instrumentation.ts`).
   - Service name: `OTEL_SERVICE_NAME` (default `api`), aligned with pino `service` field.
   - On graceful shutdown, flush/shutdown the tracer provider before `app.close()`.

2. **Logs ↔ traces**
   - Pino mixin adds `traceId` and `spanId` (W3C hex) when an active span exists, in addition to ALS `requestId` / `correlationId`.

3. **Access logs**
   - Ops routes (`/health`, `/health/ready`, `/metrics`) are excluded from HTTP access-log lines to reduce scraper/probe noise.

4. **Request lifecycle spans**
   - Active server span receives attributes on handler timeout (`http.request.timeout`, `error.type=timeout`) and client abort (`http.client_aborted`).

5. **Metrics**
   - Keep Prometheus text exposition at `GET /metrics` (step 050).
   - Add `http_request_duration_seconds` histogram (method, route, status_code) for application HTTP latency.
   - **Do not** add business/CMS counters here; those belong to domain tracks.

6. **Explicitly deferred**
   - Docker Compose observability stack — roadmap step **327**
   - Cost/usage dashboards — step **334**
   - Auth token rotation counters — step **105**
   - Scraper network policy / auth for `/metrics`
   - `@opentelemetry/instrumentation-http` auto-instrumentation (we already use `TraceContextMiddleware`)

## Consequences

- Local dev and CI stay zero-dependency unless OTLP env is set.
- Operators can enable Jaeger/Tempo/etc. with env only; full compose stack waits for step 312.
- Log queries can correlate to traces via `traceId` when export is enabled.

## References

- [lesson-048](../lessons/lesson-048-opentelemetry-noop.md) — noop wiring
- [lesson-049](../lessons/lesson-049-trace-context-propagation.md) — W3C propagation
- [lesson-050](../lessons/lesson-050-metrics-endpoint-stub.md) — Prometheus stub
- [lesson-056](../lessons/lesson-056-platform-observability-follow-ups.md) — follow-ups implementation
- [development-roadmap.md](../development-roadmap.md) — steps 327, 334, 105 ([ADR-003](./003-roadmap-renumber-090-plus.md))
