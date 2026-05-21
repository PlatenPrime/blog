# Learning Path

For the **why** behind each step (mentor narrative by chapter), read [storytelling.md](./storytelling.md) — сначала глава целиком, затем строка вашего шага в таблице главы.

Use [development-roadmap.md](./development-roadmap.md) as the source of truth for exact order.

## Phase 1: Monorepo Foundation (Track 0)

- Step 001: [lesson-001-root-npm-workspaces.md](./lessons/lesson-001-root-npm-workspaces.md)
- Step 002: [lesson-002-local-setup-and-node-policy.md](./lessons/lesson-002-local-setup-and-node-policy.md)
- Step 003: [lesson-003-nx-init.md](./lessons/lesson-003-nx-init.md)
- Step 004: [lesson-004-nx-targets-and-inference.md](./lessons/lesson-004-nx-targets-and-inference.md)
- Step 005: [lesson-005-nest-apps-api-migration.md](./lessons/lesson-005-nest-apps-api-migration.md)
- Step 006: [lesson-006-root-tsconfig-base-and-paths.md](./lessons/lesson-006-root-tsconfig-base-and-paths.md)
- Step 007: [lesson-007-root-eslint-flat-config.md](./lessons/lesson-007-root-eslint-flat-config.md)
- Step 008: [lesson-008-root-prettier-and-editorconfig.md](./lessons/lesson-008-root-prettier-and-editorconfig.md)
- Step 009: [lesson-009-root-scripts-via-nx.md](./lessons/lesson-009-root-scripts-via-nx.md)
- Step 010: [lesson-010-apps-web-tanstack-start.md](./lessons/lesson-010-apps-web-tanstack-start.md)
- Step 011: [lesson-011-web-typecheck-target.md](./lessons/lesson-011-web-typecheck-target.md)
- Step 012: [lesson-012-shared-contracts-lib.md](./lessons/lesson-012-shared-contracts-lib.md)
- Step 013: [lesson-013-wire-shared-contracts-api.md](./lessons/lesson-013-wire-shared-contracts-api.md)
- Step 014: [lesson-014-wire-shared-contracts-web.md](./lessons/lesson-014-wire-shared-contracts-web.md)
- Step 015: [lesson-015-cors-and-dev-origins.md](./lessons/lesson-015-cors-and-dev-origins.md)
- Step 016: [lesson-016-postgres-compose-local-dev.md](./lessons/lesson-016-postgres-compose-local-dev.md)
- Step 017: [lesson-017-env-example-files.md](./lessons/lesson-017-env-example-files.md)
- Step 018: [lesson-018-root-readme-runbook.md](./lessons/lesson-018-root-readme-runbook.md)
- Step 019: [lesson-019-ci-pipeline-baseline.md](./lessons/lesson-019-ci-pipeline-baseline.md)
- Step 020: [lesson-020-nx-cache-in-ci.md](./lessons/lesson-020-nx-cache-in-ci.md)
- Step 021: [lesson-021-nx-affected-flow-in-ci.md](./lessons/lesson-021-nx-affected-flow-in-ci.md)
- Step 022: [lesson-022-optional-husky-lint-staged-policy.md](./lessons/lesson-022-optional-husky-lint-staged-policy.md)
- Step 023: [lesson-023-lessons-folder-structure-conventions.md](./lessons/lesson-023-lessons-folder-structure-conventions.md)
- Step 024: [lesson-024-release-stub-and-changelog-policy.md](./lessons/lesson-024-release-stub-and-changelog-policy.md)
- Step 025: [lesson-025-normalize-gitignore.md](./lessons/lesson-025-normalize-gitignore.md)
- Step 026: [lesson-026-optional-vscode-recommendations.md](./lessons/lesson-026-optional-vscode-recommendations.md)
- Step 027: [lesson-027-adr-000-nx-tanstack-start.md](./lessons/lesson-027-adr-000-nx-tanstack-start.md)
- Step 028: [lesson-028-threat-model-stub.md](./lessons/lesson-028-threat-model-stub.md)
- Step 029: [lesson-029-health-smoke-script.md](./lessons/lesson-029-health-smoke-script.md)
- Step 030: [lesson-030-track-0-acceptance-checklist.md](./lessons/lesson-030-track-0-acceptance-checklist.md)
- Step 031: [lesson-031-ci-matrix-improvements.md](./lessons/lesson-031-ci-matrix-improvements.md)
- Step 032: [lesson-032-adr-process-deviations.md](./lessons/lesson-032-adr-process-deviations.md)

## Phase 2: Platform Core (Track 1)

Steps 033-056.

- Step 033: [lesson-033-nest-config-and-env-validation.md](./lessons/lesson-033-nest-config-and-env-validation.md)
- Step 034: [lesson-034-terminus-health-liveness.md](./lessons/lesson-034-terminus-health-liveness.md)
- Step 035: [lesson-035-readiness-probe-dependencies.md](./lessons/lesson-035-readiness-probe-dependencies.md)
- Step 036: [lesson-036-health-response-dtos.md](./lessons/lesson-036-health-response-dtos.md)
- Step 037: [lesson-037-api-error-envelope-types.md](./lessons/lesson-037-api-error-envelope-types.md)
- Step 038: [lesson-038-global-exception-filter.md](./lessons/lesson-038-global-exception-filter.md)
- Step 039: [lesson-039-global-validation-pipe.md](./lessons/lesson-039-global-validation-pipe.md)
- Step 040: [lesson-040-dto-validation-conventions.md](./lessons/lesson-040-dto-validation-conventions.md)
- Step 041: [lesson-041-problem-details-alignment.md](./lessons/lesson-041-problem-details-alignment.md)
- Step 042: [lesson-042-safe-unknown-errors.md](./lessons/lesson-042-safe-unknown-errors.md)
- Step 043: [lesson-043-request-id-middleware.md](./lessons/lesson-043-request-id-middleware.md)
- Step 044: [lesson-044-structured-logging.md](./lessons/lesson-044-structured-logging.md)
- Step 045: [lesson-045-request-logging-interceptor.md](./lessons/lesson-045-request-logging-interceptor.md)
- Step 046: [lesson-046-correlation-id.md](./lessons/lesson-046-correlation-id.md)
- Step 047: [lesson-047-log-redaction.md](./lessons/lesson-047-log-redaction.md)
- Step 048: [lesson-048-opentelemetry-noop.md](./lessons/lesson-048-opentelemetry-noop.md)
- Step 049: [lesson-049-trace-context-propagation.md](./lessons/lesson-049-trace-context-propagation.md)
- Step 050: [lesson-050-metrics-endpoint-stub.md](./lessons/lesson-050-metrics-endpoint-stub.md)
- Step 051: [lesson-051-api-prefix-and-versioning.md](./lessons/lesson-051-api-prefix-and-versioning.md)
- Step 052: [lesson-052-graceful-shutdown-hooks.md](./lessons/lesson-052-graceful-shutdown-hooks.md)
- Step 053: [lesson-053-request-timeout-abort.md](./lessons/lesson-053-request-timeout-abort.md)
- Step 054: [lesson-054-error-json-contract-tests.md](./lessons/lesson-054-error-json-contract-tests.md)
- Step 055: [lesson-055-track-1-acceptance-checklist.md](./lessons/lesson-055-track-1-acceptance-checklist.md)
- Step 056: [lesson-056-platform-observability-follow-ups.md](./lessons/lesson-056-platform-observability-follow-ups.md)

## Phase 3: Auth and Identity (Track 2)

- Step 057: [lesson-057-database-module-postgres-orm-bootstrap.md](./lessons/lesson-057-database-module-postgres-orm-bootstrap.md)
- Step 058: [lesson-058-datasource-config-database-url.md](./lessons/lesson-058-datasource-config-database-url.md)
- Step 059: [lesson-059-migration-workflow-baseline-schema.md](./lessons/lesson-059-migration-workflow-baseline-schema.md)
- Step 060: [lesson-060-user-entity-indexes.md](./lessons/lesson-060-user-entity-indexes.md)
- Step 061: [lesson-061-password-hasher-service.md](./lessons/lesson-061-password-hasher-service.md)
- Step 062: [lesson-062-user-service-create-find-by-email.md](./lessons/lesson-062-user-service-create-find-by-email.md)
- Step 063: [lesson-063-auth-register-dto.md](./lessons/lesson-063-auth-register-dto.md)
- Step 064: [lesson-064-unique-email-friendly-conflict.md](./lessons/lesson-064-unique-email-friendly-conflict.md)
- Step 065: [lesson-065-auth-login.md](./lessons/lesson-065-auth-login.md)
- Step 066: [lesson-066-jwt-access-token-service.md](./lessons/lesson-066-jwt-access-token-service.md)
- Step 067: [lesson-067-jwt-strategy-auth-guard.md](./lessons/lesson-067-jwt-strategy-auth-guard.md)
- Step 068: [lesson-068-current-user-decorator.md](./lessons/lesson-068-current-user-decorator.md)
- Step 069: [lesson-069-refresh-token-entity-persistence.md](./lessons/lesson-069-refresh-token-entity-persistence.md)

Steps 070-104.

## Phase 4: CMS Backend (Track 3)

Steps 105-164.

## Phase 5: Public Web (Track 4)

Steps 165-200.

## Phase 6: Admin Studio (Track 5)

Steps 201-252.

## Phase 7: Data and Performance (Track 6)

Steps 253-278.

## Phase 8: Reliability and Delivery (Tracks 7-8)

Steps 279-320.

## Authoring references

- [lesson-authoring-guide.md](./lesson-authoring-guide.md)
- [lessons/lesson-template.md](./lessons/lesson-template.md)
