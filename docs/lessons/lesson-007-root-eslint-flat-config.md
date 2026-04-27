# Lesson 007: Root ESLint flat config

## Learning Goal

Move the shared **flat ESLint** configuration to the repository root so the monorepo has one place for rules, plugins, and TypeScript-aware settings, while keeping `nx run api:lint` working from the `api` workspace.

## Implementation Scope

- Added root [`eslint.config.mjs`](../../eslint.config.mjs) with the same rule stack as before (recommended, `typescript-eslint` type-checked, Prettier integration) scoped to `apps/api/**/*.ts`.
- Removed [`apps/api/eslint.config.mjs`](../../apps/api/eslint.config.mjs): a one-line re-export from the root file was tried first, but ESLint resolves `files` glob patterns relative to the **discovered** config directory. With a config file under `apps/api`, patterns like `apps/api/**/*.ts` did not match `src/**/*.ts` passed from that folder, so the API-local stub was dropped in favor of **config discovery walking up** to the root.
- Updated [`nx.json`](../../nx.json) lint cache inputs to depend on `{workspaceRoot}/eslint.config.mjs`.
- Hoisted ESLint 9 flat-stack devDependencies to the root [`package.json`](../../package.json) and removed duplicates from [`apps/api/package.json`](../../apps/api/package.json).

## Dependencies

- npm workspaces, Nx, step 006 TypeScript base.
- ESLint 9 flat config, `typescript-eslint`, Prettier-related ESLint plugins.

## Step-by-Step Changes

1. Created root `eslint.config.mjs` with `tsconfigRootDir` pointing at `apps/api` for `projectService`.
2. Scoped type-checked configs with `files: ['apps/api/**/*.ts']` so future apps can get their own blocks in the same file.
3. Removed `apps/api/eslint.config.mjs` after verifying discovery from `apps/api` still loads the root config.
4. Pointed Nx lint inputs at the root ESLint config for correct cache invalidation.
5. Aligned `eslint` to v9 at the workspace root and hoisted shared lint packages; ran `npm install`.

## Verification

From repository root:

```bash
npm install
npx nx run api:lint
```

Expected:

- ESLint loads [`eslint.config.mjs`](../../eslint.config.mjs) from the workspace root.
- Lint completes successfully for the `api` project.

## Changed Files

| File                                                             | Action                                |
| ---------------------------------------------------------------- | ------------------------------------- |
| [`eslint.config.mjs`](../../eslint.config.mjs)                   | created                               |
| [`apps/api/eslint.config.mjs`](../../apps/api/eslint.config.mjs) | removed                               |
| [`nx.json`](../../nx.json)                                       | lint inputs → root ESLint config      |
| [`package.json`](../../package.json)                             | ESLint 9 + flat stack devDependencies |
| [`apps/api/package.json`](../../apps/api/package.json)           | removed hoisted lint devDependencies  |
| [`package-lock.json`](../../package-lock.json)                   | updated by `npm install`              |
| [`docs/development-roadmap.md`](../development-roadmap.md)       | baseline + completed steps            |
| [`docs/README.md`](../README.md)                                 | lesson 007 link                       |
| [`docs/learning-path.md`](../learning-path.md)                   | step 007                              |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                       | next step 008                         |
| `docs/lessons/lesson-007-root-eslint-flat-config.md`             | this file                             |

## Architecture Notes

- **Single root config**: new packages (`apps/web`, `libs/*`) can add additional `files` blocks or separate flat config fragments without copying Nest-specific parser options.
- **Why no `apps/api/eslint.config.mjs`**: ESLint’s base path for globs follows the config file location; a thin re-export still leaves the “home” directory at `apps/api`, which breaks monorepo-wide `apps/api/**` patterns when linting from that directory.
- **Dependencies at root**: the root config imports `@eslint/js`, `typescript-eslint`, etc., so those packages must live in the root `devDependencies` (npm resolves imports from the root package graph).

## Definition of Done

- [ ] Root `eslint.config.mjs` exists and lints `apps/api` TypeScript sources.
- [ ] No duplicate ESLint stack in `apps/api/package.json` for packages only the root config imports.
- [ ] `nx.json` lint inputs reference the root ESLint config.
- [ ] `npx nx run api:lint` succeeds from repository root.
