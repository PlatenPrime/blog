# NestJS + TanStack Start Practice Track

This repository is a fullstack practice track: NestJS API + TanStack Start + Nx.

## Documentation

- [storytelling.md](./storytelling.md) — история проекта по главам: зачем, затем что сделано (для новичков)
- [development-roadmap.md](./development-roadmap.md)
- [adr/README.md](./adr/README.md) — Architecture Decision Records (ADR)
- [security/threat-model-stub.md](./security/threat-model-stub.md) — threat model stub (auth controls mapped; expanded in Track 7)
- [adr/003-roadmap-renumber-090-plus.md](./adr/003-roadmap-renumber-090-plus.md) — step renumber after 089 (090+ → 334)
- [track-0-acceptance-checklist.md](./track-0-acceptance-checklist.md) — Track 0 acceptance checklist
- [track-1-acceptance-checklist.md](./track-1-acceptance-checklist.md) — Track 1 acceptance checklist
- [LOCAL_SETUP.md](./LOCAL_SETUP.md)
- [learning-path.md](./learning-path.md)
- [release-policy.md](./release-policy.md)
- [lesson-authoring-guide.md](./lesson-authoring-guide.md) — как писать уроки и **чеклист синхронизации docs + storytelling**
- Правило Cursor: [`.cursor/rules/storytelling.mdc`](../.cursor/rules/storytelling.mdc) — обязательный формат narrative в storytelling
- [lessons/lesson-template.md](./lessons/lesson-template.md)

## Quick Start

```bash
npm install
npm run start:dev
npm run test
npm run test:e2e
```

## Completed Lessons

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
- Step 070: [lesson-070-auth-refresh-rotation.md](./lessons/lesson-070-auth-refresh-rotation.md)
- Step 071: [lesson-071-auth-logout-revoke-refresh.md](./lessons/lesson-071-auth-logout-revoke-refresh.md)
- Step 072: [lesson-072-auth-refresh-reuse-detection.md](./lessons/lesson-072-auth-refresh-reuse-detection.md)
- Step 073: [lesson-073-token-ttl-configuration.md](./lessons/lesson-073-token-ttl-configuration.md)
- Step 074: [lesson-074-login-brute-force-lockout.md](./lessons/lesson-074-login-brute-force-lockout.md)
- Step 075: [lesson-075-email-verification-token-model.md](./lessons/lesson-075-email-verification-token-model.md)
- Step 076: [lesson-076-auth-verify-email.md](./lessons/lesson-076-auth-verify-email.md)
- Step 077: [lesson-077-password-reset-request-flow.md](./lessons/lesson-077-password-reset-request-flow.md)
- Step 078: [lesson-078-password-reset-completion.md](./lessons/lesson-078-password-reset-completion.md)
- Step 079: [lesson-079-roles-permissions-schema.md](./lessons/lesson-079-roles-permissions-schema.md)
- Step 080: [lesson-080-seed-default-roles.md](./lessons/lesson-080-seed-default-roles.md)
- Step 081: [lesson-081-roles-guard.md](./lessons/lesson-081-roles-guard.md)
- Step 082: [lesson-082-permissions-guard.md](./lessons/lesson-082-permissions-guard.md)
- Step 083: [lesson-083-sample-cms-route-rbac.md](./lessons/lesson-083-sample-cms-route-rbac.md)
- Step 084: [lesson-084-jwt-payload-shared-contracts.md](./lessons/lesson-084-jwt-payload-shared-contracts.md)
- Step 085: [lesson-085-auth-register-login-e2e-flow.md](./lessons/lesson-085-auth-register-login-e2e-flow.md)
- Step 086: [lesson-086-auth-refresh-rotation-e2e-flow.md](./lessons/lesson-086-auth-refresh-rotation-e2e-flow.md)
- Step 087: [lesson-087-auth-rbac-forbidden-e2e-flow.md](./lessons/lesson-087-auth-rbac-forbidden-e2e-flow.md)
- Step 088: [lesson-088-security-audit-log-table.md](./lessons/lesson-088-security-audit-log-table.md)
- Step 089: [lesson-089-audit-events-auth-mutations.md](./lessons/lesson-089-audit-events-auth-mutations.md)
- Step 090: [lesson-090-email-channel.md](./lessons/lesson-090-email-channel.md)
- Step 091: [lesson-091-auth-sensitive-rate-limits.md](./lessons/lesson-091-auth-sensitive-rate-limits.md)
- Step 092: [lesson-092-api-security-baseline.md](./lessons/lesson-092-api-security-baseline.md)
- Step 093: [lesson-093-require-email-verified-policy.md](./lessons/lesson-093-require-email-verified-policy.md)
- Step 094: [lesson-094-openapi-swagger.md](./lessons/lesson-094-openapi-swagger.md)
- Step 095: [lesson-095-session-device-metadata.md](./lessons/lesson-095-session-device-metadata.md)

Quality scripts from repo root (`build`, `test`, `lint`, `test:e2e`) run through Nx on the `api` app. The `web` app (TanStack Start) builds with `npx nx run web:build` or `npm run web:dev` for local dev. Full CI parity from root: `npm run ci` (see [lesson-019](./lessons/lesson-019-ci-pipeline-baseline.md)); GitHub Actions restores `.nx/cache` for repeated CI runs (see [lesson-020](./lessons/lesson-020-nx-cache-in-ci.md)); CI targets now run through `nx affected` range detection (see [lesson-021](./lessons/lesson-021-nx-affected-flow-in-ci.md)). Utility scripts:

- `npm run nx:show` — list Nx projects (`api`, `web`, `shared-contracts`)
- `npm run nx:graph` — open the project graph
