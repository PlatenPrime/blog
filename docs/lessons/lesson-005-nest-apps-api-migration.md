# Lesson 005: Move NestJS workspace from `app/` to `apps/api`

## Learning Goal

Place the NestJS application under the canonical monorepo layout `apps/api`, rename the npm workspace package to **`api`** (so Nx project name matches `nx run api:*`), and fix paths that depended on the old folder depth.

## Implementation Scope

- Moved Nest project files from `app/` to `apps/api/` (excluded `node_modules` and `dist` from move; reinstall from root).
- Renamed package: `apps/api/package.json` `name` from `app` to **`api`**.
- Updated root [`package.json`](../../package.json): `workspaces: ["apps/api"]`, scripts use `-w api`, Nx scripts use `nx run api:*`.
- Updated [`nx.json`](../../nx.json): ESLint input path to `apps/api/eslint.config.mjs`.
- Updated [`apps/api/src/main.ts`](../../apps/api/src/main.ts): `.env` lookup uses `../../../.env` from compiled `dist/` (one level deeper than before).
- Updated [`apps/api/package.json`](../../apps/api/package.json): `coverageDirectory` to `../../coverage`.

## Dependencies

- npm workspaces, Nx from prior steps.

## Step-by-Step Changes

1. Create `apps/api` and move sources from `app/` (exclude heavy/generated folders).
2. Delete leftover `app/node_modules` if present; remove empty `app/` (if Windows locks the empty folder, delete it after closing handles — see Verification).
3. Rename workspace package to `api`.
4. Update root orchestration scripts and Nx target names.
5. Fix `main.ts` env path depth and Jest coverage output path.

## Architecture Notes

- **Why `name: api`**: aligns with roadmap commands (`nx run api:build`) and future `apps/web`.
- **Why `../../../.env`**: from `apps/api/dist/main.js`, three levels up reaches repo root (same as old `../../` from `app/dist`).

## Changed Files

| File                                                       | Action                                        |
| ---------------------------------------------------------- | --------------------------------------------- |
| `apps/api/**`                                              | created (moved from `app/`)                   |
| `app/`                                                     | removed (or empty stub if locked — see below) |
| [`package.json`](../../package.json)                       | workspaces + scripts + nx targets             |
| [`nx.json`](../../nx.json)                                 | eslint input path                             |
| [`apps/api/package.json`](../../apps/api/package.json)     | name `api`, coverage path                     |
| [`apps/api/src/main.ts`](../../apps/api/src/main.ts)       | env path                                      |
| [`docs/development-roadmap.md`](../development-roadmap.md) | baseline + completed steps                    |
| [`docs/README.md`](../README.md)                           | lesson 005 link                               |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                 | next step 006                                 |
| [`docs/learning-path.md`](../learning-path.md)             | step 005 link                                 |
| [`README.md`](../../README.md)                             | comments for `api`                            |
| `docs/lessons/lesson-005-nest-apps-api-migration.md`       | this file                                     |

## Verification

From repository root:

```bash
npm install
npm run nx:show
npm run nx:build
npm run test
npm run test:e2e
```

Expected:

- `nx show projects` prints **`api`** (not `app`).
- Build and tests succeed.

If an **empty** `app/` folder remains (file lock), remove it manually or retry after closing processes; it must not be listed in `workspaces`.

## Definition of Done

- [ ] Nest code lives under `apps/api/`.
- [ ] Root `workspaces` includes only `apps/api` (plus future apps).
- [ ] `npm run build` and `npm run test` from root succeed.
- [ ] `nx run api:build` succeeds.

## Homework

Add a short note in your local notes: why `coverageDirectory` moved to `../../coverage` when the package moved one directory deeper.
