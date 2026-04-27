# Lesson 008: Root Prettier + EditorConfig

## Learning Goal

Centralize **Prettier** at the repository root so the whole monorepo shares one formatter config and ignore rules, add **EditorConfig** for editor baseline behavior, and expose a **read-only** format gate (`format:check`) suitable for CI—aligned with the existing ESLint + Prettier integration from step 007.

## Implementation Scope

- Added root [`.prettierrc`](../../.prettierrc) (same style as the former API-local file, plus `endOfLine: "auto"` to match [`eslint.config.mjs`](../../eslint.config.mjs)).
- Added root [`.prettierignore`](../../.prettierignore) for `node_modules`, build/cache artifacts, and `package-lock.json`.
- Added root [`.editorconfig`](../../.editorconfig) without a global `end_of_line`, so Prettier’s `endOfLine: "auto"` is not overridden via EditorConfig resolution.
- Root [`package.json`](../../package.json) scripts: `format` → `prettier --write .`, `format:check` → `prettier --check .`.
- Removed [`apps/api/.prettierrc`](../../apps/api/.prettierrc) and the `format` script from [`apps/api/package.json`](../../apps/api/package.json) so formatting is invoked only from the workspace root.
- Extended [`nx.json`](../../nx.json) lint cache inputs with `{workspaceRoot}/.prettierrc` and `{workspaceRoot}/.prettierignore`.

## Dependencies

- npm workspaces, Nx, step 007 ESLint flat config (uses `eslint-plugin-prettier` / `eslint-config-prettier`).
- `prettier` already hoisted at the repository root.

## Step-by-Step Changes

1. Created `.prettierrc` and `.prettierignore` at the repo root; deleted `apps/api/.prettierrc`.
2. Added `.editorconfig` with charset, final newline, trim rules, and 2-space indent for common code extensions; disabled `trim_trailing_whitespace` for Markdown.
3. Replaced root `format` script (previously `npm run format -w api`) with root Prettier on `.`; added `format:check`.
4. Removed the `format` script from the `api` workspace package.
5. Added Prettier config paths to Nx `lint` target inputs for correct cache invalidation when only formatting policy changes.
6. Ran `npm run format` once to normalize files touched by the wider root scope; verified `npm run format:check` and `nx run api:lint`.

## Verification

From repository root:

```bash
npm install
npm run format:check
```

Expected:

- Prettier reports all matched files use the configured style (exit code 0).

Optional fix-up after editing many files:

```bash
npm run format
```

## Changed Files

| File                                                        | Action                              |
| ----------------------------------------------------------- | ----------------------------------- |
| [`.prettierrc`](../../.prettierrc)                          | created                             |
| [`.prettierignore`](../../.prettierignore)                  | created                             |
| [`.editorconfig`](../../.editorconfig)                      | created                             |
| [`package.json`](../../package.json)                        | `format`, `format:check`            |
| [`apps/api/package.json`](../../apps/api/package.json)      | removed `format` script             |
| [`apps/api/.prettierrc`](../../apps/api/.prettierrc)        | removed                             |
| [`nx.json`](../../nx.json)                                  | lint inputs + Prettier files        |
| [`docs/development-roadmap.md`](../development-roadmap.md)  | baseline + completed steps          |
| [`docs/README.md`](../README.md)                            | lesson 008 link                     |
| [`docs/learning-path.md`](../learning-path.md)              | step 008                            |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                  | format commands; next step 009      |
| `docs/lessons/lesson-008-root-prettier-and-editorconfig.md` | this file                           |
| Various `docs/**/*.md` and related                          | formatted by first `npm run format` |

## Architecture Notes

- **Single root formatter**: new apps and libs under `apps/*` and `libs/*` are included automatically when they land in the tree; `.prettierignore` keeps generated output and caches out of scope.
- **EditorConfig vs Prettier**: Prettier can incorporate EditorConfig; omitting `end_of_line` in `[*]` avoids forcing `lf` and conflicting with `prettier/prettier`’s `endOfLine: "auto"` in ESLint on Windows-centric checkouts.
- **Nx lint inputs**: ESLint enforces Prettier via rules; listing `.prettierrc` / `.prettierignore` on lint inputs prevents stale Nx cache when only style config changes.

## Definition of Done

- [ ] Root `.prettierrc` and `.prettierignore` exist; no stray `apps/api/.prettierrc`.
- [ ] Root `.editorconfig` exists and does not set a global `end_of_line`.
- [ ] `npm run format:check` passes from the repository root.
- [ ] `npx nx run api:lint` still passes (Prettier options stay consistent with ESLint).
