# NestJS + TanStack Start Practice Track

This repository is a fullstack practice track: NestJS API + TanStack Start + Nx.

## Documentation

- [development-roadmap.md](./development-roadmap.md)
- [LOCAL_SETUP.md](./LOCAL_SETUP.md)
- [learning-path.md](./learning-path.md)
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

Quality scripts from repo root (`build`, `test`, `lint`, `test:e2e`) run through Nx on the `api` app. The `web` app (TanStack Start) builds with `npx nx run web:build` or `npm run web:dev` for local dev. Utility scripts:

- `npm run nx:show` — list Nx projects (`api`, `web`, `shared-contracts`)
- `npm run nx:graph` — open the project graph
