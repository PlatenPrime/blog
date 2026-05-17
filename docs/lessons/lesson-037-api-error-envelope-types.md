# Lesson 037: API error envelope types in `shared-contracts`

## Learning Goal

Вынести TypeScript-типы JSON-ошибок API в [`libs/shared-contracts`](../../libs/shared-contracts), чтобы API, web и будущие contract-тесты ссылались на один кросс-стековый контракт вместо заглушки `ApiErrorBodyStub`.

## Implementation Scope

В скоупе:

- [`libs/shared-contracts/src/errors/api-error.types.ts`](../../libs/shared-contracts/src/errors/api-error.types.ts) — `ApiErrorBody`, `ApiValidationFieldError`, `ApiErrorDetails`, платформенные константы `API_ERROR_CODE_*`, тип `ApiErrorCode`.
- Re-export из [`libs/shared-contracts/src/index.ts`](../../libs/shared-contracts/src/index.ts); удаление `ApiErrorBodyStub`.
- Документация: этот урок, [`docs/development-roadmap.md`](../development-roadmap.md), [`docs/learning-path.md`](../learning-path.md), [`docs/README.md`](../README.md).

Намеренно **не** делаем:

- Global exception filter и маппинг Nest → envelope — [шаг 038](../development-roadmap.md).
- Подключение типов в controllers/services API.
- Zod-схемы в lib, `problem+json` (шаг 041), contract-тесты JSON (шаг 054).

## Dependencies

- Шаг 036 — health DTOs в `shared-contracts`, паттерн types-only lib.
- Lesson 012 — build target `nx run shared-contracts:build`.

## Step-by-Step Changes

1. Добавить `src/errors/api-error.types.ts` с envelope, validation details и кодами ошибок.
2. Экспортировать типы и константы из `src/index.ts`, удалить `ApiErrorBodyStub`.
3. **Verify.** `npx nx run shared-contracts:build` → `dist/errors/api-error.types.d.ts`.
4. **Docs.** Урок 037, baseline roadmap, learning-path, docs README.

## Code Example

```typescript
export type ApiErrorBody = {
  readonly code: ApiErrorCode;
  readonly message: string;
  readonly requestId?: string;
  readonly details?: ApiErrorDetails;
};

export type ApiValidationFieldError = {
  readonly field: string;
  readonly message: string;
  readonly code?: string;
};
```

## Context

После 036 health-ответы типизированы в `shared-contracts`. Следующий публичный контракт платформы — ошибки: единый `code` + `message`, опционально `requestId` (шаги 043–046) и `details` для ValidationPipe (039–040). Заглушка из lesson 012 заменена полноценными типами без изменений в `apps/*`.

## Architecture Notes

- **Только types, без runtime:** lib не тянет Nest; exception filter в API — шаг 038.
- **`readonly`:** иммутабельный контракт, как у health types.
- **HTTP status в заголовке:** `statusCode` не дублируем в body; filter выставит статус при сериализации.
- **`ApiErrorCode`:** union платформенных констант + `string` для доменных кодов (CMS, auth).
- **Версия пакета:** `SHARED_CONTRACTS_VERSION` не менялась — замена неиспользуемой заглушки.

## Changed Files

| Файл                                                                     | Действие                      |
| ------------------------------------------------------------------------ | ----------------------------- |
| `libs/shared-contracts/src/errors/api-error.types.ts`                    | создан                        |
| `libs/shared-contracts/src/index.ts`                                     | re-export errors, stub удалён |
| `docs/lessons/lesson-037-api-error-envelope-types.md`                    | создан                        |
| `docs/development-roadmap.md`, `docs/learning-path.md`, `docs/README.md` | шаг 037                       |

## Verification

```bash
npx nx run shared-contracts:build
```

Ожидание:

- `tsc` без ошибок.
- `libs/shared-contracts/dist/errors/api-error.types.d.ts` и re-export в `dist/index.d.ts`.

### Unit tests

Compile-only deliverable (как lessons 012, 036); отдельный unit test не добавлялся.

## Definition of Done

- [x] API error envelope types экспортированы из `@blog/shared-contracts`.
- [x] `ApiErrorBodyStub` удалён.
- [x] `npx nx run shared-contracts:build` успешен.
- [x] Урок 037 и индексы roadmap/learning-path/docs README обновлены.

## What To Remember

- Контракт: `code`, `message`, опционально `requestId`, `details` (validation array).
- Global exception filter — шаг 038; contract-тесты JSON — шаг 054.
- Problem Details (`problem+json`) — опционально, шаг 041.

## Verify

```bash
npx nx run shared-contracts:build
```
