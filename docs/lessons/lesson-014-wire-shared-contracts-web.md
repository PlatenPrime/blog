# Lesson 014: Wire `shared-contracts` into `web`

## Learning Goal

Make the TanStack Start app consume the shared library as a real npm workspace dependency, align Nx so the library builds before `web:build`, and prove the import path works in the UI, typecheck, Vitest, and Vite production build.

## Implementation Scope

- Declared [`@nestjs-st/shared-contracts`](../../libs/shared-contracts/package.json) in [`apps/web/package.json`](../../apps/web/package.json) via `file:../../libs/shared-contracts` and Nx `dependsOn: ["shared-contracts:build"]` on the inferred `build` target (mirror of lesson 013 for `api`).
- Mapped [`@nestjs-st/shared-contracts`](../../libs/shared-contracts/src/index.ts) to library **source** in [`apps/web/tsconfig.json`](../../apps/web/tsconfig.json) so `web:typecheck` and Vite (`resolve.tsconfigPaths`) do not require a pre-existing `dist/` for editor/tsc resolution.
- Imported [`SHARED_CONTRACTS_VERSION`](../../libs/shared-contracts/src/index.ts) in [`apps/web/src/routes/index.tsx`](../../apps/web/src/routes/index.tsx).
- Added [`apps/web/src/shared-contracts-import.test.ts`](../../apps/web/src/shared-contracts-import.test.ts) (Vitest) asserting the shared constant.

## Dependencies

- Lesson 012: buildable `shared-contracts` library and workspace package metadata.
- Lesson 013: same linking pattern as the API (`file:` dependency + Nx ordering).

## Step-by-Step Changes

1. Added the workspace dependency and Nx `build.dependsOn` in `apps/web/package.json`.
2. Extended `apps/web/tsconfig.json` `paths` with a direct mapping to `libs/shared-contracts/src/index.ts`.
3. Rendered the shared version string on the home route.
4. Added a minimal Vitest test that imports from `@nestjs-st/shared-contracts`.
5. Ran `npm install`, `web:typecheck`, `web:test`, and `web:build` from the repository root.
6. Registered step 014 in roadmap and documentation indexes.

## Verification

From repository root:

```bash
npm install
npx nx run web:typecheck
npx nx run web:test
npx nx run web:build
```

Expected:

- `web:build` runs `shared-contracts:build` first, then `vite build` succeeds.
- `web:typecheck` and `web:test` succeed.

## Changed Files

| File                                                                                 | Action                                      |
| ------------------------------------------------------------------------------------ | ------------------------------------------- |
| [`apps/web/package.json`](../../apps/web/package.json)                               | dependency + `nx.targets.build.dependsOn`   |
| [`apps/web/tsconfig.json`](../../apps/web/tsconfig.json)                             | `paths` for `@nestjs-st/shared-contracts`   |
| [`apps/web/src/routes/index.tsx`](../../apps/web/src/routes/index.tsx)               | import + display `SHARED_CONTRACTS_VERSION` |
| [`apps/web/src/shared-contracts-import.test.ts`](../../apps/web/src/shared-contracts-import.test.ts) | Vitest import smoke                         |
| [`package-lock.json`](../../package-lock.json)                                       | workspace link for `web`                    |
| [`docs/development-roadmap.md`](../development-roadmap.md)                           | step 014 in completed snapshot              |
| [`docs/learning-path.md`](../learning-path.md)                                       | step 014 lesson link                        |
| [`docs/README.md`](../README.md)                                                     | step 014 in completed lessons               |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                                           | next step → 015                             |
| `docs/lessons/lesson-014-wire-shared-contracts-web.md`                               | this file                                   |

## Architecture Notes

- **Workspace package** remains the install/link contract; **TypeScript `paths`** points at source so `tsc --noEmit` matches the API’s Jest `moduleNameMapper` rationale (no implicit dependency on `dist` for static checks).
- **Vite** picks up the same mapping via `tsconfigPaths: true` in [`apps/web/vite.config.ts`](../../apps/web/vite.config.ts).
- **Nx** enforces `shared-contracts:build` before `web:build` so Node-style consumers of the package (and any tooling that reads `package.json` `exports` → `dist`) stay consistent with CI and production bundles.

## Definition of Done

- [ ] `npx nx run web:build` succeeds and triggers `shared-contracts:build`.
- [ ] `npx nx run web:typecheck` and `npx nx run web:test` succeed.
- [ ] Step 014 is linked in roadmap and lesson indexes.
