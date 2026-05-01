# Lesson 009: Root scripts via Nx (build / test / lint)

## Learning Goal

Make **build**, **test**, **lint**, and **e2e tests** the primary scripts at the repository root run **through Nx** (`nx run api:*`), so day-to-day commands and future CI share one path, Nx **caching** applies, and duplicate `nx:*` aliases for the same targets are removed.

## Implementation Scope

- Root [`package.json`](../../package.json): `build`, `test`, `lint`, `test:e2e` → `nx run api:build`, `nx run api:test`, `nx run api:lint`, `nx run api:test:e2e`.
- Removed root scripts `nx:build`, `nx:test`, `nx:lint`, `nx:e2e` (redundant with the scripts above).
- Left unchanged: `start` / `start:dev` / `start:prod` (still `npm run … -w api`), `format` / `format:check`, `nx`, `nx:show`, `nx:graph`.
- Updated [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md), [`docs/README.md`](../README.md), [`docs/development-roadmap.md`](../development-roadmap.md), [`docs/learning-path.md`](../learning-path.md), root [`README.md`](../../README.md) (removed obsolete `nx:build` line).

## Dependencies

- npm workspaces, Nx project `api` with inferred targets (steps 003–005).
- [`nx.json`](../../nx.json) `targetDefaults` for `build`, `test`, `lint` (step 004).

## Step-by-Step Changes

1. Replaced root `build`, `test`, `lint`, `test:e2e` scripts to call `nx run api:<target>` instead of `npm run … -w api`.
2. Deleted duplicate `nx:build`, `nx:test`, `nx:lint`, `nx:e2e` entries from root `package.json`.
3. Documented in LOCAL_SETUP that quality scripts are Nx-backed; listed `nx:show`, `nx:graph`, and optional explicit `npx nx run api:*` examples.
4. Updated [`docs/README.md`](../README.md), [`docs/development-roadmap.md`](../development-roadmap.md) (baseline + completed snapshot), and [`docs/learning-path.md`](../learning-path.md) step 009.
5. Updated repo root [`README.md`](../../README.md): removed `npm run nx:build`; added `nx:graph` and a short note that quality scripts use Nx.

## Verification

From repository root:

```bash
npm install
npm run build
npm run test
npm run lint
```

Expected:

- Nx runs the `api` project targets successfully (exit code 0).
- `npm run build` produces `apps/api/dist` as before.

Optional:

```bash
npm run test:e2e
```

## Changed Files

| File                                                       | Action                     |
| ---------------------------------------------------------- | -------------------------- |
| [`package.json`](../../package.json)                       | scripts: Nx-backed gates   |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                 | Nx section + next step 010 |
| [`docs/README.md`](../README.md)                           | lesson 009 + Nx blurb      |
| [`docs/development-roadmap.md`](../development-roadmap.md) | baseline + snapshot        |
| [`docs/learning-path.md`](../learning-path.md)             | step 009                   |
| [`README.md`](../../README.md) (repo root)                 | команды без `nx:build`     |
| `docs/lessons/lesson-009-root-scripts-via-nx.md`           | this file                  |

## Architecture Notes

- **Single quality entry**: `npm run build|test|lint` from root is the supported path; when `web` and libs land, these scripts can evolve to `nx run-many` or `nx affected` without changing contributor muscle memory at the npm layer.
- **Dev servers stay on workspace**: Nest `start` / `start:dev` remain `-w api` so long-running watch processes do not require an extra Nx wrapper for this track.
- **Explicit Nx**: `npx nx run api:build` remains valid for docs and CI snippets; it matches what the npm scripts execute.

## Definition of Done

- [ ] `npm run build` from repository root succeeds and uses Nx.
- [ ] `npm run test` and `npm run lint` from root succeed.
- [ ] No duplicate `nx:build` / `nx:test` / `nx:lint` / `nx:e2e` scripts in root `package.json`.
- [ ] Roadmap, learning-path, and this lesson reflect step 009.
