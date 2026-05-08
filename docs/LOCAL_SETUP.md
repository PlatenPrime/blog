# Local Setup

This file is the local setup entry point after steps 001-009.

## Toolchain

- Node.js: recommended `20.18.0` (see `.nvmrc`, `.node-version`)
- npm: `>=10`

## Version check

```bash
node -v
npm -v
```

## Install dependencies

Run from repository root:

```bash
npm install
```

## Common root commands

```bash
npm run start:dev
npm run test
npm run test:e2e
npm run build
npm run lint
npm run format
npm run format:check
```

`npm run build`, `npm run test`, `npm run lint`, and `npm run test:e2e` invoke **Nx** targets on the `api` project (`nx run api:build`, and so on), so you get Nx caching and the same entry points future CI will use.

## TanStack Start (`apps/web`)

The `web` workspace is a TanStack Start app (Vite + Nitro). From repository root:

```bash
npm run web:dev
npx nx run web:build
```

## Nx commands

```bash
npm run nx:show
npm run nx:graph
```

Explicit target form (equivalent to the npm scripts above):

```bash
npx nx run api:build
npx nx run api:test
npx nx run api:lint
npx nx run api:test:e2e
npx nx run web:build
npx nx run web:typecheck
```

## Next roadmap step

Step 012: create `libs/shared-contracts` — see [development-roadmap.md](./development-roadmap.md).
