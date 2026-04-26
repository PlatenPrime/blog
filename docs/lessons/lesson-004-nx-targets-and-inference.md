# Lesson 004: Nx target defaults and inference baseline

## Learning Goal

Stabilize Nx configuration after `nx init`: define target defaults, add root Nx scripts, and verify inferred targets still work for the API workspace (was `app`, now `api` after step 005).

## Implementation Scope

- Update `nx.json` with `namedInputs` and `targetDefaults`.
- Normalize ESLint plugin target name to `lint`.
- Add root scripts: `nx:lint`, `nx:test`, `nx:e2e`.
- Fix lint warning in `apps/api/src/main.ts` (`void bootstrap();`).

## Dependencies

- Nx 22.7.0 from step 003.

## Step-by-Step Changes

1. Add `namedInputs` and `targetDefaults` in `nx.json`.
2. Keep `test:e2e` cache disabled.
3. Add root helper scripts for common Nx targets.
4. Fix floating promise warning in bootstrap entry.

## Changed Files

- `nx.json`
- `package.json`
- `apps/api/src/main.ts`
- `docs/development-roadmap.md`
- `docs/README.md`
- `docs/LOCAL_SETUP.md`
- `docs/learning-path.md`
- `docs/lessons/lesson-004-nx-targets-and-inference.md`

## Verification

```bash
npm run nx:show
npm run nx:lint
npm run nx:test
npm run nx:e2e
npm run nx:build
```

Expected: all commands succeed; a single API Nx project remains until `web` is added.

## Definition of Done

- [ ] `nx.json` has target defaults.
- [ ] root Nx scripts work.
- [ ] lint warning in `main.ts` is removed.
- [ ] docs are updated.

## Homework

Run `npm run nx:test` twice and compare execution time/cached output.
