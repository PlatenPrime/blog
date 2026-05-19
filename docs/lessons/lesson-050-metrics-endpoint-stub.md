# Lesson 050: Metrics endpoint stub (Prometheus exposition)

## Learning Goal

Добавить в API точку сбора метрик для Prometheus: `GET /metrics` с текстовым exposition format и дефолтными process-метриками (`prom-client`), отдельно от Terminus `/health`.

## Implementation Scope

В скоупе:

- [`apps/api/src/metrics/`](../../apps/api/src/metrics/) — `MetricsModule`, `MetricsController`, `MetricsService`, отдельный `Registry`.
- [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts) — импорт `MetricsModule`.
- Зависимость `prom-client` в `apps/api`.
- Unit-тесты controller/service; e2e `GET /metrics` в [`app.e2e-spec.ts`](../../apps/api/test/app.e2e-spec.ts).

Намеренно **не** делаем:

- HTTP histogram `http_request_duration_seconds`, skip ops access-log, OTLP export — [шаг 056](./lesson-056-platform-observability-follow-ups.md).
- Business/CMS metrics, OTel Metrics SDK — доменные треки / [шаг 312+](../development-roadmap.md).
- Auth / network policy для scraper'а — позже.

## Dependencies

- [Шаг 049](./lesson-049-trace-context-propagation.md) — middleware по-прежнему на всех маршрутах, включая `/metrics`.
- [Шаг 034](./lesson-034-terminus-health-liveness.md) — health остаётся JSON Terminus, не Prometheus.

## Step-by-Step Changes

1. `npm install prom-client -w api`.
2. `MetricsModule` с `PROMETHEUS_REGISTRY` → `new Registry()`.
3. `MetricsService.onModuleInit` — `collectDefaultMetrics({ register })`.
4. `MetricsController` — `@Controller('metrics')`, `Content-Type: text/plain; version=0.0.4`.
5. Unit + e2e тесты.
6. **Verify.** `npx nx run api:build`, `npx nx run api:test`, `cd apps/api && npm run test:e2e`, `npx nx run api:lint`.
7. **Docs.** Урок 050, roadmap, learning-path, docs README, storytelling.

## Code Example

```typescript
// metrics.controller.ts
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @Header('Content-Type', PROMETHEUS_CONTENT_TYPE)
  getMetrics(): Promise<string> {
    return this.metrics.getMetrics();
  }
}
```

## Context

После 049 API умеет tracing в памяти, но observability stack для ops (Prometheus) не к чему подключиться. Шаг 050 даёт стабильный `/metrics` stub: scraper или `curl` получают валидный text format с process metrics — без Grafana compose (шаг 312) и без кастомных метрик приложения.

## Architecture Notes

- **Отдельный модуль:** не смешивать с `HealthController` — разные протоколы и потребители.
- **Свой Registry:** не default global register — проще тесты и будущие custom metrics.
- **Top-level path:** глобальный API prefix (051) пока нет → `/metrics` как `/health`.

## Changed Files

| Файл                                               | Действие        |
| -------------------------------------------------- | --------------- |
| `apps/api/package.json`                            | `prom-client`   |
| `apps/api/src/metrics/*`                           | создан          |
| `apps/api/src/app.module.ts`                       | `MetricsModule` |
| `apps/api/test/app.e2e-spec.ts`                    | e2e `/metrics`  |
| `docs/lessons/lesson-050-metrics-endpoint-stub.md` | создан          |

## Verification

```bash
npx nx run api:build
npx nx run api:test
cd apps/api && npm run test:e2e
npx nx run api:lint
```

### Manual metrics check

1. Запустить API: `npm run start:dev` (порт по умолчанию **4000**).
2. Запросить exposition:

```bash
curl -s http://localhost:4000/metrics | head
```

3. Ожидание: HTTP **200**, строки `# HELP`, `# TYPE`, метрики `process_*` / `nodejs_*`.

## Definition of Done

- [x] `GET /metrics` возвращает Prometheus text exposition.
- [x] `Content-Type` содержит `text/plain; version=0.0.4`.
- [x] Default process metrics через отдельный `Registry`.
- [x] `api:build`, `api:test`, `api:lint`, `test:e2e` зелёные.
- [x] Урок 050 и индексы roadmap/learning-path/docs README/storytelling обновлены.

## What To Remember

- Prometheus scrape ожидает **plain text**, не JSON API envelope.
- `collectDefaultMetrics` вызывать один раз на registry (в `onModuleInit`).
- Health ≠ metrics: liveness/readiness для orchestrator, `/metrics` для monitoring.

## Verify

```bash
npx nx run api:build
curl -s http://localhost:4000/metrics | head
```
