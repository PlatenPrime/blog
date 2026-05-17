# Lesson 040: DTO validation conventions + sample resource (`examples`)

## Learning Goal

Зафиксировать конвенции DTO (request в API, response в `shared-contracts`), добавить переиспользуемую пагинацию query и эталонный in-memory ресурс `examples`, заменив временный `validation-smoke`.

## Implementation Scope

В скоупе:

- [`docs/api/dto-validation-conventions.md`](../api/dto-validation-conventions.md) — канонический справочник.
- [`apps/api/src/common/dto/pagination-query.dto.ts`](../../apps/api/src/common/dto/pagination-query.dto.ts) — базовый query DTO.
- [`libs/shared-contracts/src/examples/example.types.ts`](../../libs/shared-contracts/src/examples/example.types.ts) — `ExampleItem`, `ListExamplesResponse`.
- [`apps/api/src/examples/`](../../apps/api/src/examples/) — module, controller, service, DTOs (`POST/GET/PATCH/DELETE /examples`).
- Удаление [`apps/api/src/validation/`](../../apps/api/src/validation/) (smoke из шага 039).
- Unit + e2e на `/examples`; документация roadmap/learning-path/docs README.

Намеренно **не** делаем:

- Persistence / ORM — [шаг 057](../development-roadmap.md).
- `requestId` в envelope — 043–046.
- `problem+json` — [шаг 041](../development-roadmap.md).
- Contract tests JSON shape — [шаг 054](../development-roadmap.md).

## Dependencies

- Шаг 039 — глобальный `ValidationPipe`, `VALIDATION_FAILED` + `details`.
- Шаг 036 — паттерн types-only контрактов в `shared-contracts`.

## Step-by-Step Changes

1. Документ конвенций + `PaginationQueryDto`.
2. Типы `ExampleItem` / `ListExamplesResponse` в `shared-contracts`.
3. `ExamplesModule` (in-memory `Map`, CRUD).
4. Удалить `ValidationModule` / `validation-smoke`.
5. **Verify.** `npx nx run api:lint`, `api:test`, `api:test:e2e`.
6. **Docs.** Урок 040, baseline roadmap, learning-path, docs README.

## Code Example

```typescript
// apps/api/src/examples/dto/create-example-body.dto.ts
export class CreateExampleBodyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;
}
```

```typescript
// libs/shared-contracts — response only
export type ExampleItem = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};
```

## Context

После 039 валидация входа работает глобально, но не было эталона «как писать DTO для фичи». Smoke `POST /validation-smoke` заменён на полноценный `examples` — образец для auth (063+) и CMS (Track 3).

## Concept

**Request DTO** (class-validator) живут в `apps/api`; **публичные типы ответа** — в `shared-contracts`. Глобальный pipe не дублируется в контроллерах.

## Code Changes

- `docs/api/dto-validation-conventions.md` — правила именования, декораторов, split.
- `common/dto/pagination-query.dto.ts` — `page` / `limit` с transform.
- `examples/*` — эталонный REST-модуль без БД.
- E2e: validation + CRUD на `/examples`.

## Why This Matters

Единые конвенции снижают расхождение между эндпоинтами и упрощают contract-тесты и фронт. `examples` — живой reference, а не абстрактная документация.

## Architecture Notes

- **In-memory store:** `Map` в `ExamplesService` — достаточно для Track 1; данные не переживают рестарт.
- **`ParseUUIDPipe`:** валидация `:id` на уровне маршрута; 404 — `NotFoundException` → `NOT_FOUND`.
- **Pagination defaults:** `@Transform` на `PaginationQueryDto` для query-строк без значения.
- **Удалён smoke:** e2e validation-сценарии перенесены на реальный create/list flow.

## Changed Files

| Файл                                                                     | Действие |
| ------------------------------------------------------------------------ | -------- |
| `docs/api/dto-validation-conventions.md`                                 | создан   |
| `libs/shared-contracts/src/examples/example.types.ts`                    | создан   |
| `libs/shared-contracts/src/index.ts`                                     | изменён  |
| `apps/api/src/common/dto/pagination-query.dto.ts`                        | создан   |
| `apps/api/src/common/dto/index.ts`                                       | создан   |
| `apps/api/src/examples/**`                                               | создан   |
| `apps/api/src/examples/examples.service.spec.ts`                         | создан   |
| `apps/api/src/app.module.ts`                                             | изменён  |
| `apps/api/src/validation/**`                                             | удалён   |
| `apps/api/test/app.e2e-spec.ts`                                          | изменён  |
| `docs/lessons/lesson-040-dto-validation-conventions.md`                  | создан   |
| `docs/development-roadmap.md`, `docs/learning-path.md`, `docs/README.md` | шаг 040  |

## Verification

```bash
npx nx run shared-contracts:build
npx nx run api:lint
npx nx run api:test
npx nx run api:test:e2e
```

Ожидание:

- `POST /examples` с `{}` → 400, `VALIDATION_FAILED`, `details` с `title`/`body`.
- `POST /examples` с лишним полем → 400 (forbidNonWhitelisted).
- `GET /examples?page=2&limit=2` (строки) → корректная пагинация.
- CRUD: create 201 → get → patch → delete 204 → get 404.
- `/`, `/health`, CORS — без регрессии.

## Definition of Done

- [x] Конвенции DTO задокументированы в `docs/api/dto-validation-conventions.md`.
- [x] `PaginationQueryDto` + `examples` module с типами в `shared-contracts`.
- [x] `validation-smoke` удалён; e2e на `/examples`.
- [x] `nx run api:lint`, `api:test`, `api:test:e2e` зелёные.
- [x] Урок 040 и индексы roadmap/learning-path/docs README обновлены.

## What To Remember

- Request DTO → `apps/api`; response types → `shared-contracts`.
- `@Type` перед `@Is*`; `@IsOptional` первым на PATCH-полях.
- `examples` — reference implementation до появления БД и CMS-сущностей.

## Verify

```bash
npx nx run api:lint
```
