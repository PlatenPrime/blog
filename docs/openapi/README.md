# OpenAPI snapshot (API v1)

Committed snapshot of the Nest API contract for review and diffs in PRs.

| File                                           | Purpose                                           |
| ---------------------------------------------- | ------------------------------------------------- |
| [`api-v1.openapi.json`](./api-v1.openapi.json) | OpenAPI 3 document for `/api/v1/*` product routes |

## Regenerate after API changes

From the repository root (no running Postgres required — export uses the e2e test app stub):

```bash
nx run api:openapi:export
```

## Interactive docs (local dev)

With API running (`npm run start:dev`):

- Swagger UI: http://127.0.0.1:4000/api/docs
- JSON spec: http://127.0.0.1:4000/api/docs-json

See [lesson-094](../lessons/lesson-094-openapi-swagger.md).
