# DTO validation conventions (API)

Canonical rules for request validation in `apps/api` and public response types in `libs/shared-contracts`. Reference implementation: [`examples`](../../apps/api/src/examples/) module (lesson 040). HTTP paths are under **`/api/v1`** — see [routing-and-versioning.md](./routing-and-versioning.md).

## Split: request vs response

| Layer                      | Location                                         | Technology                              | Purpose                                      |
| -------------------------- | ------------------------------------------------ | --------------------------------------- | -------------------------------------------- |
| Request body / query       | `apps/api/src/<feature>/dto/`                    | `class-validator` + `class-transformer` | Validate and transform incoming HTTP input   |
| Response / public contract | `libs/shared-contracts/src/<feature>/*.types.ts` | TypeScript types only (`readonly`)      | Cross-stack JSON shape for API ↔ web ↔ tests |

Request DTOs stay in the API app because they depend on NestJS validation decorators. Response types live in `shared-contracts` (same pattern as health in lesson 036).

## File naming

| Kind              | Pattern                         | Example                      |
| ----------------- | ------------------------------- | ---------------------------- |
| Create body       | `create-<resource>-body.dto.ts` | `create-example-body.dto.ts` |
| Update body       | `update-<resource>-body.dto.ts` | `update-example-body.dto.ts` |
| List query        | `list-<resource>-query.dto.ts`  | `list-examples-query.dto.ts` |
| Shared query base | `apps/api/src/common/dto/`      | `pagination-query.dto.ts`    |

Class name matches file: `CreateExampleBodyDto`, `ListExamplesQueryDto`.

## Decorator order

1. `@Type(() => …)` — before `@Is*` when transforming primitives (query strings → numbers).
2. `@IsOptional()` — before other validators on optional PATCH fields.
3. Constraint decorators: `@IsString()`, `@IsInt()`, `@Min()`, `@Max()`, `@MaxLength()`, etc.

```typescript
@Type(() => Number)
@IsInt()
@Min(1)
page!: number;
```

## Field style

- Required fields: definite assignment (`title!: string`).
- Optional PATCH fields: `title?: string` with `@IsOptional()` first.
- No business logic inside DTO classes — only validation and transformation.

## Global ValidationPipe (lesson 039)

Registered via `APP_PIPE` in `AppModule`:

- `whitelist: true` — strips undeclared properties.
- `forbidNonWhitelisted: true` — extra properties → `400` + `VALIDATION_FAILED`.
- `transform: true` — applies `@Type()` (e.g. `"3"` → `3`).

Validation failures map to RFC 9457 **Problem Details** (`Content-Type: application/problem+json`) with `code: VALIDATION_FAILED` and extension `details[]` (field + message). See [`map-class-validator-errors.ts`](../../apps/api/src/errors/map-class-validator-errors.ts) and [`problem-details.types.ts`](../../libs/shared-contracts/src/errors/problem-details.types.ts).

Example error body:

```json
{
  "type": "https://blog.dev/problems/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "detail": "Validation failed",
  "code": "VALIDATION_FAILED",
  "details": [{ "field": "title", "message": "title should not be empty" }]
}
```

## Route parameters

Use Nest built-in pipes for IDs (e.g. `ParseUUIDPipe` on `:id`). Domain “not found” → `NotFoundException` → `NOT_FOUND` in the error envelope (lesson 038).

## Pagination query

Extend [`PaginationQueryDto`](../../apps/api/src/examples/dto/pagination-query.dto.ts) (re-exported from [`common/dto`](../../apps/api/src/common/dto/index.ts)):

- `page` — default `1`, min `1`
- `limit` — default `20`, min `1`, max `100`

List endpoints return `List*Response` from `shared-contracts` with `items`, `page`, `limit`, `total`.

## Module layout

```text
apps/api/src/<feature>/
  <feature>.module.ts
  <feature>.controller.ts
  <feature>.service.ts
  dto/
    create-*-body.dto.ts
    update-*-body.dto.ts
    list-*-query.dto.ts
```

## What not to put in DTOs

- Database access, caching, authorization decisions.
- Zod schemas (reserved for env/config — lesson 033).
- Response serialization types (use `shared-contracts`).
