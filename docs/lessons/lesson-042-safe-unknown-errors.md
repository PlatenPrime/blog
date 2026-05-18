# Lesson 042: Safe handling of unknown errors (no stack leak)

## Learning Goal

Закрыть политику безопасных ошибок из [lesson-038](./lesson-038-global-exception-filter.md): клиент никогда не получает stack trace или внутренние детали 5xx; server log сохраняет полную информацию для unknown errors.

## Implementation Scope

В скоупе:

- [`libs/shared-contracts/src/errors/api-error.types.ts`](../../libs/shared-contracts/src/errors/api-error.types.ts) — `API_INTERNAL_ERROR_MESSAGE`.
- [`apps/api/src/errors/map-exception-to-api-error.ts`](../../apps/api/src/errors/map-exception-to-api-error.ts) — `resolveClientErrorMessage` для status ≥ 500.
- Unit-тесты mapper + filter (stringify assertions).
- Документация: этот урок, roadmap, learning-path, docs README; ссылка из lesson-038.

Намеренно **не** делаем:

- `requestId` / redaction в логах — [шаги 043–047](../development-roadmap.md).
- E2e для 500, mock logger.
- Contract-тесты всех кодов — [шаг 054](../development-roadmap.md).

## Dependencies

- Шаги 037–041 — `ApiErrorBody`, exception filter, `problem+json`.

## Step-by-Step Changes

1. Добавить `API_INTERNAL_ERROR_MESSAGE` в `shared-contracts`.
2. Санитизировать `message` для unknown errors и `HttpException` со status ≥ 500.
3. Расширить unit-тесты mapper + filter.
4. **Verify.** `npx nx run shared-contracts:build`, `nx run api:test`.
5. **Docs.** Урок 042, baseline roadmap, learning-path, docs README.

## Code Example

```typescript
function resolveClientErrorMessage(status: number, message: string): string {
  if (status >= 500) {
    return API_INTERNAL_ERROR_MESSAGE;
  }
  return message;
}
```

## Context

После 038 unknown `Error` уже мапился в generic 500, но `HttpException` с status 500 мог отдать `detail: 'secret db url'`. Шаг 042 закрывает этот канал утечки и фиксирует единую константу в контракте.

## Architecture Notes

- **5xx wire:** всегда `detail: API_INTERNAL_ERROR_MESSAGE`, `code: INTERNAL_ERROR`.
- **4xx wire:** исходный message (NotFound, validation и т.д.).
- **Stack:** только в `Logger.error` для non-`HttpException`; не в JSON body.
- **Validation branch:** не затрагивается (status 400 + `details`).

## Changed Files

| Файл                                                                     | Действие  |
| ------------------------------------------------------------------------ | --------- |
| `libs/shared-contracts/src/errors/api-error.types.ts`                    | изменён   |
| `libs/shared-contracts/src/index.ts`                                     | re-export |
| `apps/api/src/errors/map-exception-to-api-error.ts`                      | изменён   |
| `apps/api/src/errors/map-exception-to-api-error.spec.ts`                 | изменён   |
| `apps/api/src/errors/api-exception.filter.spec.ts`                       | изменён   |
| `docs/lessons/lesson-042-safe-unknown-errors.md`                         | создан    |
| `docs/lessons/lesson-038-global-exception-filter.md`                     | ссылка    |
| `docs/development-roadmap.md`, `docs/learning-path.md`, `docs/README.md` | шаг 042   |

## Verification

```bash
npx nx run shared-contracts:build
npx nx run api:test
```

Ожидание:

- Unknown `Error` → 500 + generic `detail`, stringify без `stack` / secret message.
- `HttpException` 500 / `InternalServerErrorException` → sanitized detail.
- `NotFoundException` 404 → оригинальный message без регрессии.

## Definition of Done

- [x] `API_INTERNAL_ERROR_MESSAGE` в `shared-contracts`.
- [x] Санитизация всех 5xx в mapper.
- [x] Unit-тесты mapper + filter на отсутствие leak.
- [x] `npx nx run api:test` успешен.
- [x] Урок 042 и индексы roadmap/learning-path/docs README обновлены.

## What To Remember

- Клиент видит generic detail на 5xx; оператор — полный stack в логах (unknown only).
- 4xx messages намеренно информативны для клиента.
- Request ID — [lesson-043](./lesson-043-request-id-middleware.md); log redaction — шаг 047.

## Verify

```bash
npx nx run api:test
```
