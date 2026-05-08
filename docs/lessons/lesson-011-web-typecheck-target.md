# Lesson 011: Add `web:typecheck` Nx target

## Learning Goal

Add a dedicated Nx target for frontend type-checking so `web` can validate TypeScript correctness independently of build and test pipelines.

## Implementation Scope

- Added explicit Nx project configuration for `web` in [`apps/web/project.json`](../../apps/web/project.json).
- Added `typecheck` target mapped to `tsc --noEmit -p apps/web/tsconfig.json`.
- Updated docs indexes to include lesson 011 and moved setup guidance to the next roadmap step.

## Dependencies

- Existing TanStack Start app in `apps/web` from step 010.
- Nx workspace with inferred Vite targets from `@nx/vite/plugin`.
- TypeScript available in the workspace (`tsc` CLI).

## Step-by-Step Changes

1. Created explicit `apps/web/project.json` so custom Nx targets can live alongside inferred Vite targets.
2. Added `typecheck` target using `nx:run-commands` with a no-emit TypeScript check.
3. Updated roadmap and lesson indexes to register step 011 as completed.
4. Updated local setup docs to include `npx nx run web:typecheck` and point to step 012 as next.

## Verification

From repository root:

```bash
npx nx run web:typecheck
```

Expected:

- TypeScript compiler runs with `--noEmit`.
- Command exits successfully when no type errors are present.

## Changed Files

| File                                                       | Action                                           |
| ---------------------------------------------------------- | ------------------------------------------------ |
| [`apps/web/project.json`](../../apps/web/project.json)    | added explicit Nx config + `typecheck` target    |
| [`docs/development-roadmap.md`](../development-roadmap.md) | added lesson 011 to completed snapshot           |
| [`docs/learning-path.md`](../learning-path.md)             | added step 011 lesson link                       |
| [`docs/README.md`](../README.md)                           | added step 011 to completed lessons              |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                 | added `web:typecheck`; next step switched to 012 |
| `docs/lessons/lesson-011-web-typecheck-target.md`          | this file                                        |

## Architecture Notes

- `web` keeps inferred targets (`build`, `test`, `dev`, `preview`) through Nx plugins, while `project.json` now holds explicit targets that are not inferable (like `typecheck`).
- Using `tsc --noEmit` separates static type validation from bundling, which keeps failures fast and easier to diagnose.

## Definition of Done

- [ ] `npx nx run web:typecheck` is available and executable from repository root.
- [ ] Frontend type-check runs without creating build artifacts.
- [ ] Step 011 is linked in roadmap and lesson indexes.
