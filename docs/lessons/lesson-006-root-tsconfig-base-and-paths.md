# Lesson 006: Add root `tsconfig.base.json` and path mappings

## Learning Goal

Centralize reusable TypeScript compiler settings at workspace root and connect `apps/api` through `extends`, so new apps/libs can share one baseline configuration.

## Implementation Scope

- Added root [`tsconfig.base.json`](../../tsconfig.base.json) with shared `compilerOptions`.
- Added root `baseUrl` and initial workspace `paths` mapping for future shared libs.
- Refactored [`apps/api/tsconfig.json`](../../apps/api/tsconfig.json) to extend root config and keep only app-specific `outDir`.
- Kept strictness at a compatibility-safe level (no aggressive tightening).

## Dependencies

- Nx workspace from steps 001-005.
- Existing NestJS app in `apps/api`.

## Step-by-Step Changes

1. Created root `tsconfig.base.json` as the single source of shared TypeScript settings.
2. Moved common compiler options from `apps/api/tsconfig.json` to root base.
3. Added `baseUrl: "."` and `paths` in root config to prepare monorepo aliases.
4. Updated `apps/api/tsconfig.json` to use `"extends": "../../tsconfig.base.json"`.
5. Left only `outDir` in API config to preserve project-specific build output.

## Verification

Run from repository root:

```bash
npx nx run api:build
```

Expected:

- TypeScript config resolution succeeds through root `tsconfig.base.json`.
- `api` build completes successfully without behavior regressions.

## Changed Files

| File                                                       | Action                        |
| ---------------------------------------------------------- | ----------------------------- |
| [`tsconfig.base.json`](../../tsconfig.base.json)           | created                       |
| [`apps/api/tsconfig.json`](../../apps/api/tsconfig.json)   | updated to extend root config |
| [`docs/development-roadmap.md`](../development-roadmap.md) | marked step 006 as completed  |
| [`docs/README.md`](../README.md)                           | added lesson 006 link         |
| [`docs/learning-path.md`](../learning-path.md)             | added step 006                |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                 | moved next step to 007        |
| `docs/lessons/lesson-006-root-tsconfig-base-and-paths.md`  | this file                     |

## Architecture Notes

- Root TypeScript baseline reduces duplication and drift between workspace projects.
- `paths` are intentionally minimal at this stage: enough for monorepo growth, without introducing premature alias complexity.
- Keeping app-specific settings in leaf configs (`apps/*/tsconfig.json`) keeps responsibilities clean.

## Definition of Done

- [ ] Root `tsconfig.base.json` exists and contains shared compiler options.
- [ ] `apps/api/tsconfig.json` uses `extends` and no longer duplicates base options.
- [ ] Root `paths` are defined for future shared libraries.
- [ ] `nx run api:build` passes from repository root.
