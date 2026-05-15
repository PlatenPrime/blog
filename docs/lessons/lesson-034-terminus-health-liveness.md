# Lesson 034: Terminus health module + `/health` liveness

## Learning Goal

Добавить **liveness**-эндпоинт `GET /health` через [`@nestjs/terminus`](https://docs.nestjs.com/recipes/terminus): оркестраторы и load balancer’ы могут проверять, что HTTP-стек API жив, без обращения к PostgreSQL и без смешения с readiness.

## Implementation Scope

В скоупе:

- Зависимость `@nestjs/terminus` в [`apps/api/package.json`](../../apps/api/package.json).
- [`apps/api/src/health/health.module.ts`](../../apps/api/src/health/health.module.ts) — `TerminusModule`, `HealthController`.
- [`apps/api/src/health/health.controller.ts`](../../apps/api/src/health/health.controller.ts) — `GET /health`, `@HealthCheck()`, синтетический indicator `api: up`.
- [`apps/api/src/health/health.controller.spec.ts`](../../apps/api/src/health/health.controller.spec.ts) — unit-тест делегирования в `HealthCheckService`.
- [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts) — импорт `HealthModule`.
- E2e в [`apps/api/test/app.e2e-spec.ts`](../../apps/api/test/app.e2e-spec.ts) — `GET /health` → 200, Terminus envelope.
- Документация: этот урок, [`docs/development-roadmap.md`](../development-roadmap.md), [`docs/learning-path.md`](../learning-path.md), [`apps/api/README.md`](../../apps/api/README.md).

Намеренно **не** делаем:

- `GET /health/ready` и проверки БД — [шаг 035](../development-roadmap.md).
- DTO/types health-ответа в `shared-contracts` — [шаг 036](../development-roadmap.md).
- Переключение [`scripts/health-smoke.mjs`](../../scripts/health-smoke.mjs) с `GET /` на `/health` — опционально позже; smoke по-прежнему проверяет корень.
- Глобальный API prefix, exception filters, structured logging — следующие шаги Track 1.

## Dependencies

- Шаг 033 ([lesson-033](./lesson-033-nest-config-and-env-validation.md)) — `ConfigModule`, bootstrap.
- Пакет: `@nestjs/terminus` ^11 (в паре с Nest 11).

## Step-by-Step Changes

1. **Red.** E2e `GET /health` — ожидаем 200 и `status: ok` с `details.api.status === 'up'`.
2. **Green.** `HealthModule` + `HealthController` + `TerminusModule`; unit-тест контроллера.
3. **Verify.** `nx run api:test`, `api:test:e2e`, `api:lint:ci`, `api:build`; ручной `curl /health` на dev-сервере.
4. **Docs.** Урок, roadmap baseline, learning-path, `apps/api/README.md`.

## Code Example

```typescript
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @Get()
  @HealthCheck()
  liveness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => Promise.resolve({ api: { status: 'up' } }),
    ]);
  }
}
```

## Context

После шага 033 env валидируется при старте, но платформенного health-эндпоинта не было — только корневой `GET /` и dev smoke по тексту «Hello World» ([lesson-029](./lesson-029-health-smoke-script.md)). Kubernetes и Compose различают **liveness** (процесс жив) и **readiness** (готов принимать трафик); сейчас закрываем только liveness.

## Concept

**Liveness vs readiness.** Liveness отвечает «упал ли процесс / завис ли event loop»; при fail orchestrator перезапускает pod. Readiness — «можем ли обслуживать запросы» (БД, очереди, миграции). Смешивать их в один `/health` — антипаттерн: ложные рестарты при временной недоступности БД.

## Code Changes

- `apps/api/src/health/*` — модуль и контроллер.
- `apps/api/src/app.module.ts` — `HealthModule` в imports.
- `apps/api/test/app.e2e-spec.ts` — e2e liveness.

## Why This Matters

Единый Terminus-контракт (`status`, `info`, `error`, `details`) совместим с probe’ами и будущими custom indicators (Postgres в 035). Корневой `GET /` остаётся для dev/smoke без поломки Track 0.

## Architecture Notes

- **Почему синтетический indicator `api`:** без внешних зависимостей на шаге 034; в 035 добавим реальные checks в `/health/ready`.
- **Почему `@Controller('health')` + `@Get()`:** маршрут ровно `/health`, как в roadmap; без глобального prefix (шаг 051).
- **HTTP 503 при fail:** Terminus выставляет 503, если любой indicator не `up` — поведение из коробки для будущих проверок.

## Changed Files

| Файл                                                   | Действие           |
| ------------------------------------------------------ | ------------------ |
| `apps/api/package.json`                                | `@nestjs/terminus` |
| `apps/api/src/health/health.module.ts`                 | создан             |
| `apps/api/src/health/health.controller.ts`             | создан             |
| `apps/api/src/health/health.controller.spec.ts`        | создан             |
| `apps/api/src/app.module.ts`                           | изменён            |
| `apps/api/test/app.e2e-spec.ts`                        | изменён            |
| `docs/lessons/lesson-034-terminus-health-liveness.md`  | создан             |
| `docs/development-roadmap.md`, `docs/learning-path.md` | шаг 034            |
| `apps/api/README.md`                                   | секция Health      |

## Verification

- `npx nx run api:test` — зелёные.
- `npx nx run api:test:e2e` — зелёные, в т.ч. `/health`.
- `npx nx run api:lint:ci` — без предупреждений.
- `npx nx run api:build` — успешная сборка.
- Dev: `npm run start:dev`, затем `curl -sS http://127.0.0.1:4000/health` (порт из лога bootstrap, если занят 4000).

## TDD Sequence

- Red: e2e `GET /health`.
- Green: `HealthModule` + controller + unit spec.
- Refactor: без смены публичного контракта.

## Definition of Done

- [x] `GET /health` → 200, Terminus envelope, `details.api.status === 'up'`.
- [x] `GET /` без изменений.
- [x] Урок 034 и индексы roadmap/learning-path обновлены.

## What To Remember

- Liveness не трогает БД; readiness — отдельный маршрут в 035.
- Terminus возвращает единый JSON; типы в `shared-contracts` — в 036.
- E2e health использует тот же bootstrap, что и CORS-тесты (`enableApiCors` после `createNestApplication`).

## Verify

```bash
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint:ci
npx nx run api:build
curl -sS http://127.0.0.1:4000/health
```
