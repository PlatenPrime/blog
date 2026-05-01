# Lesson 010: `apps/web` (TanStack Start) in the monorepo

## Learning Goal

Add a **TanStack Start** frontend at [`apps/web`](../../apps/web) as an npm workspace package named **`web`**, register it with **Nx** via the **Vite** inference plugin so `nx run web:build` works from the repository root, and keep root quality scripts (`npm run build`, and so on) unchanged on **`api`** until a later step introduces `run-many` / `affected` orchestration.

## Implementation Scope

- Scaffolded TanStack Start using the official CLI (non-interactive): `npx @tanstack/cli@latest create web -y --non-interactive --package-manager npm --target-dir apps/web --no-git --toolchain eslint --deployment nitro --no-examples`.
- Root [`package.json`](../../package.json): added workspace `apps/web`, devDependency `@nx/vite` **22.7.0** (aligned with other `@nx/*` packages), script `web:dev` → `npm run dev -w web`.
- Root [`nx.json`](../../nx.json): registered `@nx/vite/plugin` with `serveTargetName` mapped to the npm script **`dev`** (`vite dev`).
- Removed the per-app `package-lock.json` under `apps/web` so **one** root `npm install` owns the lockfile for the whole workspace; deleted the CLI-created local `node_modules` under `apps/web` before reinstalling from the root.
- [`.prettierignore`](../../.prettierignore): ignore TanStack/Vite output (`.output`, nested patterns) so generated bundles are not formatted.
- Root `format` / `format:check` scripts: switched from `prettier (.)` to **explicit path lists** that include `docs`, `apps/api`, and selected `apps/web` paths (source + public + top-level config). This avoids Prettier traversing `apps/web/.output` after a production build; on some Windows setups that directory can be temporarily unreadable (`EPERM` on `scandir`), which would break `npm run format`.
- Documentation updates: [`docs/development-roadmap.md`](../development-roadmap.md), [`docs/learning-path.md`](../learning-path.md), [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md), [`docs/README.md`](../README.md), root [`README.md`](../../README.md).

## Dependencies

- npm workspaces and Nx baseline (steps 001–004).
- Root scripts via Nx for `api` (step 009).

## Step-by-Step Changes

1. Ran TanStack CLI to create the app under `apps/web` with Nitro deployment, ESLint toolchain, npm, no nested git repository, and demo routes omitted (`--no-examples`).
2. Added `apps/web` to root `workspaces` and `@nx/vite` to root `devDependencies`.
3. Extended `nx.json` `plugins` with `@nx/vite/plugin` options so inferred targets match npm scripts (`build`, `test`, `dev`, `preview`).
4. Ran `npm install` from the repository root after removing `apps/web/node_modules` and `apps/web/package-lock.json`.
5. Adjusted Prettier ignore patterns and root Prettier scripts as described in Implementation Scope.
6. Updated roadmap, learning path, local setup, and README files; added this lesson.

## Verification

From repository root:

```bash
npm install
npx nx show projects
npx nx run web:build
npx nx run api:build
npm run format:check
```

Expected:

- `nx show projects` lists **`api`** and **`web`**.
- `nx run web:build` completes successfully (Vite client + SSR + Nitro; output under `apps/web/.output`, gitignored).
- `nx run api:build` still succeeds.
- `npm run format:check` passes.

Optional local dev:

```bash
npm run web:dev
```

## Changed Files

| File                                                       | Action                        |
| ---------------------------------------------------------- | ----------------------------- |
| [`apps/web/`](../../apps/web) (TanStack Start scaffold)    | added                         |
| [`package.json`](../../package.json)                       | workspaces, scripts, devDeps  |
| [`package-lock.json`](../../package-lock.json)             | updated by `npm install`      |
| [`nx.json`](../../nx.json)                                 | `@nx/vite/plugin`             |
| [`.prettierignore`](../../.prettierignore)                 | `.output` patterns            |
| [`docs/development-roadmap.md`](../development-roadmap.md) | baseline + completed snapshot |
| [`docs/learning-path.md`](../learning-path.md)             | step 010                      |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                 | web section + next step 011   |
| [`docs/README.md`](../README.md)                           | lesson 010 + Nx projects note |
| [`README.md`](../../README.md) (repo root)                 | `web:dev`, `nx:show` note     |
| `docs/lessons/lesson-010-apps-web-tanstack-start.md`       | this file                     |

## Architecture Notes

- **Nx project identity**: the workspace package name is `web` (see [`apps/web/package.json`](../../apps/web/package.json)), matching the roadmap verify command `nx run web:build`.
- **Inference**: `@nx/vite/plugin` reads Vite-oriented npm scripts and wires Nx targets without a hand-authored `project.json` in `apps/web`.
- **API vs web TypeScript**: `web` may resolve a newer TypeScript major than `api` via the workspace hoisting graph; that is acceptable for this step. A future lesson can align versions if tooling requires it.
- **Root ESLint**: the repository root [`eslint.config.mjs`](../../eslint.config.mjs) still targets **`apps/api` only**; `apps/web` ships its own `eslint.config.js` and `npm run lint` inside the `web` workspace. Root `npm run lint` remains `nx run api:lint` by design (step 009 contract).

## Definition of Done

- [ ] `apps/web` exists with a working TanStack Start app (`name`: `web`).
- [ ] `npx nx run web:build` succeeds from the repository root.
- [ ] `npx nx show projects` includes `web`.
- [ ] Roadmap baseline lists step 010 for the TanStack Start app; completed snapshot links this lesson.
- [ ] `npm run format:check` succeeds after a `web` production build (no mandatory Prettier pass over `apps/web/.output`).
