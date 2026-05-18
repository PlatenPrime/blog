# NestJS + TanStack Start Practice Track

This repository is a fullstack practice track: NestJS API + TanStack Start + Nx.

## Documentation

- [development-roadmap.md](./development-roadmap.md)
- [adr/README.md](./adr/README.md) — Architecture Decision Records (ADR)
- [security/threat-model-stub.md](./security/threat-model-stub.md) — threat model stub (Track 7 precursor)
- [track-0-acceptance-checklist.md](./track-0-acceptance-checklist.md) — Track 0 acceptance checklist
- [LOCAL_SETUP.md](./LOCAL_SETUP.md)
- [learning-path.md](./learning-path.md)
- [release-policy.md](./release-policy.md)
- [lesson-authoring-guide.md](./lesson-authoring-guide.md)
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

Quality scripts from repo root (`build`, `test`, `lint`, `test:e2e`) run through Nx on the `api` app. The `web` app (TanStack Start) builds with `npx nx run web:build` or `npm run web:dev` for local dev. Full CI parity from root: `npm run ci` (see [lesson-019](./lessons/lesson-019-ci-pipeline-baseline.md)); GitHub Actions restores `.nx/cache` for repeated CI runs (see [lesson-020](./lessons/lesson-020-nx-cache-in-ci.md)); CI targets now run through `nx affected` range detection (see [lesson-021](./lessons/lesson-021-nx-affected-flow-in-ci.md)). Utility scripts:

- `npm run nx:show` — list Nx projects (`api`, `web`, `shared-contracts`)
- `npm run nx:graph` — open the project graph
