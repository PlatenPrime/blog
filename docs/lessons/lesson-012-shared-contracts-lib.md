# Lesson 012: Create `libs/shared-contracts`

## Learning Goal

Introduce the first shared TypeScript library in the Nx workspace so API and web can later import the same contracts from one buildable project.

## Implementation Scope

- Added [`libs/shared-contracts/project.json`](../../libs/shared-contracts/project.json) with an Nx `build` target (`tsc`).
- Added TypeScript configs [`libs/shared-contracts/tsconfig.json`](../../libs/shared-contracts/tsconfig.json) and [`libs/shared-contracts/tsconfig.lib.json`](../../libs/shared-contracts/tsconfig.lib.json).
- Added minimal public surface in [`libs/shared-contracts/src/index.ts`](../../libs/shared-contracts/src/index.ts) (version constant + stub type for future error contract).
- Extended root Prettier scripts to include `libs/`.
- Updated roadmap and lesson indexes; local setup points to step 013.

## Dependencies

- Root [`tsconfig.base.json`](../../tsconfig.base.json) path alias `@blog/*` → `libs/*/src/index.ts` (lesson 006).
- Nx workspace and TypeScript available from the repo (TypeScript hoisted via `apps/api`).

## Step-by-Step Changes

1. Created `libs/shared-contracts` with `project.json` using `nx:run-commands` and declared `outputs` for Nx cache.
2. Wired `tsconfig.lib.json` to emit `dist/` from `src/`.
3. Exported a small stable API as a placeholder for shared DTOs and error shapes.
4. Included `libs` in root `format` / `format:check` so new code stays formatted.
5. Documented the step and registered it in learning indexes.

## Verification

From repository root:

```bash
npx nx run shared-contracts:build
```

Expected:

- `tsc` completes without errors.
- `libs/shared-contracts/dist` contains compiled `.js` and `.d.ts` for `src/index.ts`.

### Unit tests

This step is infrastructure plus a compile-only deliverable. There is no separate runtime behavior to assert beyond a successful TypeScript build, so no new unit test was added; verification is the Nx `build` target (same rationale as non-unit-testable targets like `web:typecheck` in lesson 011).

## Changed Files

| File                                                                                       | Action                          |
| ------------------------------------------------------------------------------------------ | ------------------------------- |
| [`libs/shared-contracts/project.json`](../../libs/shared-contracts/project.json)           | added Nx project + `build`      |
| [`libs/shared-contracts/tsconfig.json`](../../libs/shared-contracts/tsconfig.json)         | added                           |
| [`libs/shared-contracts/tsconfig.lib.json`](../../libs/shared-contracts/tsconfig.lib.json) | added                           |
| [`libs/shared-contracts/src/index.ts`](../../libs/shared-contracts/src/index.ts)           | added public exports            |
| [`package.json`](../../package.json)                                                       | Prettier includes `libs`        |
| [`docs/development-roadmap.md`](../development-roadmap.md)                                 | step 012 in completed snapshot  |
| [`docs/learning-path.md`](../learning-path.md)                                             | step 012 lesson link            |
| [`docs/README.md`](../README.md)                                                           | step 012 in completed lessons   |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                                                 | verify command; next step → 013 |
| `docs/lessons/lesson-012-shared-contracts-lib.md`                                          | this file                       |

## Architecture Notes

- The library compiles independently; wiring imports into `api` and `web` is intentionally deferred to steps 013 and 014.
- Build output lives under `libs/shared-contracts/dist` (ignored via root `dist` pattern in `.gitignore`).

## Definition of Done

- [ ] `npx nx run shared-contracts:build` succeeds from repository root.
- [ ] Step 012 is linked in roadmap and lesson indexes.
- [ ] `libs/` is covered by root Prettier scripts.
