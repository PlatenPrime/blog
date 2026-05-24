/** Swagger security scheme id for `Authorization: Bearer` access tokens. */
export const OPENAPI_BEARER_SCHEME = 'JWT' as const;

/** Path segment under global `/api` prefix → `/api/docs`. */
export const OPENAPI_DOCS_PATH = 'docs' as const;

/** JSON spec URL under global prefix → `/api/docs-json`. */
export const OPENAPI_JSON_PATH = `${OPENAPI_DOCS_PATH}-json` as const;
