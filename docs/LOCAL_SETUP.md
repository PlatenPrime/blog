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
npx nx run shared-contracts:build
```

## Environment variables

The API reads environment variables at bootstrap (and from a root `.env` file if present, loaded by `dotenv` in [`apps/api/src/main.ts`](../apps/api/src/main.ts)).

| Variable       | Default                 | Purpose                                                                                                                                                                         |
| -------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`         | `4000`                  | Initial port for the NestJS API. If busy, it auto-increments up to 20 times.                                                                                                    |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated whitelist of allowed origins. Use `*` (alone or with others) to reflect any origin. **Note:** combining `*` with `credentials: true` will be banned in Track 2. |

The TanStack Start app (`apps/web`) listens on `http://localhost:3000` by default (see [`apps/web/package.json`](../apps/web/package.json) `scripts.dev`).

Example dev session (two terminals):

```bash
npm run start:dev           # API on http://localhost:4000
npm run web:dev             # web on http://localhost:3000
```

Override the CORS whitelist:

```bash
CORS_ORIGINS="http://localhost:3000,http://localhost:5173" npm run start:dev
```

## Next roadmap step

Step 016: add PostgreSQL compose for local dev — see [development-roadmap.md](./development-roadmap.md).
