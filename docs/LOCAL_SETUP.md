# Local Setup

This file is the local setup entry point after steps 001-008.

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

## Nx commands

```bash
npm run nx:show
npm run nx:lint
npm run nx:test
npm run nx:e2e
npm run nx:build
npm run nx:graph
```

## Next roadmap step

Step 009: root scripts via Nx for build/test/lint (see roadmap).
