# Lesson 036: Health response DTOs in `shared-contracts`

## Learning Goal

Вынести TypeScript-типы JSON-ответов Nest Terminus health (`GET /health`, `GET /health/ready`) в [`libs/shared-contracts`](../../libs/shared-contracts), чтобы API, web и будущие contract-тесты ссылались на один кросс-стековый контракт.

## Implementation Scope

В скоупе:

- [`libs/shared-contracts/src/health/health-response.types.ts`](../../libs/shared-contracts/src/health/health-response.types.ts) — Terminus envelope, indicator primitives, `LivenessHealthResponse`, `ReadinessHealthResponse`, константы ключей `api` / `database`.
- Re-export из [`libs/shared-contracts/src/index.ts`](../../libs/shared-contracts/src/index.ts).
- Документация: этот урок, [`docs/development-roadmap.md`](../development-roadmap.md), [`docs/learning-path.md`](../learning-path.md), [`docs/README.md`](../README.md).

Намеренно **не** делаем:

- Подключение типов в [`health.controller.ts`](../../apps/api/src/health/health.controller.ts) (остаётся `HealthCheckResult` из Terminus).
- Рефактор unit/e2e фикстур на импорт из `@blog/shared-contracts`.
- Zod-схемы в lib, error envelope (шаг 037), contract-тесты JSON (шаг 054).

## Dependencies

- Шаги 034–035 — liveness `/health`, readiness `/health/ready`, фактический JSON в e2e/unit.
- [`libs/shared-contracts`](../../libs/shared-contracts) — lesson 012, build target `nx run shared-contracts:build`.

## Step-by-Step Changes

1. Добавить `src/health/health-response.types.ts` с базовым `HealthCheckResponseBody` и endpoint-алиасами.
2. Экспортировать типы и константы из `src/index.ts`.
3. **Verify.** `npx nx run shared-contracts:build` → `dist/*.d.ts` с health-типами.
4. **Docs.** Урок 036, baseline roadmap, learning-path, docs README.

## Code Example

```typescript
export type HealthCheckResponseBody = {
  readonly status: HealthCheckStatus;
  readonly info: HealthIndicatorMap;
  readonly error: HealthIndicatorMap;
  readonly details: HealthIndicatorMap;
};

export type LivenessHealthResponse = HealthCheckResponseBody & {
  readonly status: 'ok';
  readonly info: { readonly api: HealthIndicatorDetail };
  readonly error: Record<string, never>;
  readonly details: { readonly api: HealthIndicatorDetail };
};
```

## Context

После 034–035 Terminus JSON проверяется в [`app.e2e-spec.ts`](../../apps/api/test/app.e2e-spec.ts) и [`health.controller.spec.ts`](../../apps/api/src/health/health.controller.spec.ts), но типы дублировались локально. `shared-contracts` — единая точка для публичных DTO платформы; health — первый такой контракт в Track 1.

## Architecture Notes

- **Только types, без runtime:** lib не тянет `@nestjs/terminus`; Nest остаётся источником runtime-поведения.
- **`readonly`:** как у `ApiErrorBodyStub`; иммутабельный контракт для потребителей.
- **`LivenessHealthResponse`:** узкий happy-path (`status: 'ok'`, пустой `error`).
- **`ReadinessHealthResponse`:** допускает `status: 'error'` и `database: down` при HTTP 503.
- **Версия пакета:** `SHARED_CONTRACTS_VERSION` не менялась — аддитивные экспорты.

## Changed Files

| Файл                                                                     | Действие               |
| ------------------------------------------------------------------------ | ---------------------- |
| `libs/shared-contracts/src/health/health-response.types.ts`              | создан                 |
| `libs/shared-contracts/src/index.ts`                                     | re-export health types |
| `docs/lessons/lesson-036-health-response-dtos.md`                        | создан                 |
| `docs/development-roadmap.md`, `docs/learning-path.md`, `docs/README.md` | шаг 036                |

## Verification

```bash
npx nx run shared-contracts:build
```

Ожидание:

- `tsc` без ошибок.
- `libs/shared-contracts/dist/health/health-response.types.d.ts` и re-export в `dist/index.d.ts`.

### Unit tests

Compile-only deliverable (как lesson 012); отдельный unit test не добавлялся.

## Definition of Done

- [x] Health Terminus types экспортированы из `@blog/shared-contracts`.
- [x] `npx nx run shared-contracts:build` успешен.
- [x] Урок 036 и индексы roadmap/learning-path/docs README обновлены.

## What To Remember

- Контракт совпадает с Terminus: `status`, `info`, `error`, `details`.
- API error envelope — шаг 037; wiring controller return types — опциональный follow-up.
- Contract-тесты JSON shape — шаг 054.

## Verify

```bash
npx nx run shared-contracts:build
```
