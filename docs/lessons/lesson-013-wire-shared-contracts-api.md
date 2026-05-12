# Lesson 013: Wire `shared-contracts` into the API

## Learning Goal

Make the NestJS API consume the shared library as a real npm workspace dependency so runtime and TypeScript resolution match production-style linking, and ensure Nx builds the library before the API.

## Implementation Scope

- Registered [`libs/shared-contracts/package.json`](../../libs/shared-contracts/package.json) as workspace package `@blog/shared-contracts` with `main` / `types` pointing at `dist/`.
- Added [`libs/shared-contracts`](../../libs/shared-contracts) to root [`package.json`](../../package.json) `workspaces`.
- Declared dependency in [`apps/api/package.json`](../../apps/api/package.json) using `file:../../libs/shared-contracts` (reliable with npm workspaces; `workspace:*` is an alternative on npm versions that support it).
- Added Nx `dependsOn` so `api:build` runs [`shared-contracts:build`](../../libs/shared-contracts/project.json) first.
- Imported [`SHARED_CONTRACTS_VERSION`](../../libs/shared-contracts/src/index.ts) in [`apps/api/src/app.service.ts`](../../apps/api/src/app.service.ts) and aligned unit + e2e expectations.
- Added Jest `moduleNameMapper` entries so `@blog/shared-contracts` resolves in CI (Jest does not apply TypeScript `paths`; `rootDir` differs between unit and e2e configs).

## Dependencies

- Lesson 012: buildable `shared-contracts` library.
- Root path alias `@blog/*` (lesson 006) remains useful for editors and tools; runtime resolution uses the workspace package under `node_modules`.

## Step-by-Step Changes

1. Added `package.json` to the library and included it in root npm workspaces.
2. Linked the library from `apps/api` and configured `nx.targets.build.dependsOn` for `shared-contracts:build`.
3. Used the shared constant in `AppService` to prove the dependency is live.
4. Updated controller unit test and e2e smoke to match the new greeting string.
5. Mapped the package spec to `libs/shared-contracts/src/index.ts` in Jest so tests run without relying on hoisted `node_modules` layout.

## Verification

From repository root:

```bash
npm install
npx nx run api:build
npx nx run api:test
npx nx run api:test:e2e
```

Expected:

- `api:build` runs `shared-contracts:build` first, then `nest build` succeeds.
- Unit and e2e tests pass.

## Changed Files

| File                                                                               | Action                                                              |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`libs/shared-contracts/package.json`](../../libs/shared-contracts/package.json)   | added workspace package metadata                                    |
| [`package.json`](../../package.json)                                               | added `libs/shared-contracts` to workspaces                         |
| [`apps/api/package.json`](../../apps/api/package.json)                             | dependency + `nx.targets.build.dependsOn` + Jest `moduleNameMapper` |
| [`apps/api/test/jest-e2e.json`](../../apps/api/test/jest-e2e.json)                 | Jest `moduleNameMapper` for e2e                                     |
| [`apps/api/src/app.service.ts`](../../apps/api/src/app.service.ts)                 | import shared contracts                                             |
| [`apps/api/src/app.controller.spec.ts`](../../apps/api/src/app.controller.spec.ts) | updated expectation                                                 |
| [`apps/api/test/app.e2e-spec.ts`](../../apps/api/test/app.e2e-spec.ts)             | updated expectation                                                 |
| [`docs/development-roadmap.md`](../development-roadmap.md)                         | step 013 in completed snapshot                                      |
| [`docs/learning-path.md`](../learning-path.md)                                     | step 013 lesson link                                                |
| [`docs/README.md`](../README.md)                                                   | step 013 in completed lessons                                       |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                                         | next step → 014                                                     |
| `docs/lessons/lesson-013-wire-shared-contracts-api.md`                             | this file                                                           |

## Architecture Notes

- The API resolves `@blog/shared-contracts` via the symlinked workspace package; consumers must build the library so `dist/` exists before `nest build` / `node dist/main` (enforced by Nx `dependsOn`).
- TypeScript path mapping in [`tsconfig.base.json`](../../tsconfig.base.json) still maps `@blog/*` to `libs/*/src/index.ts` for direct source navigation; the declared dependency is the source of truth for bundling and Node resolution.
- Jest resolves modules independently: `moduleNameMapper` points at library **source** so `api:test` / `api:test:e2e` do not require a prebuilt `dist/` in `shared-contracts` (unlike `nest build`, which uses the workspace package `main`).

## Definition of Done

- [ ] `npx nx run api:build` succeeds and triggers `shared-contracts:build`.
- [ ] `npx nx run api:test` and `api:test:e2e` pass.
- [ ] Step 013 is linked in roadmap and lesson indexes.
