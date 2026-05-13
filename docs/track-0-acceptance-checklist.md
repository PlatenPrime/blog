# Track 0 acceptance checklist (steps 001–032)

Use this list before treating **Track 0 — Workspace Foundation** as closed. Commands run from the repository root unless noted.

## Toolchain and workspace

- [ ] Node matches [`.nvmrc`](./.nvmrc) / [`.node-version`](./.node-version) (`node -v`).
- [ ] `npm install` succeeds at repo root (workspaces resolve).
- [ ] `npm run format:check` passes.
- [ ] `npx nx show projects` lists `api`, `web`, `shared-contracts`.

## Build, types, lint, tests

- [ ] `npm run build` (API build via Nx) succeeds.
- [ ] `npx nx run web:build` succeeds.
- [ ] `npx nx run web:typecheck` succeeds.
- [ ] `npm run lint:ci` succeeds (API + web lint without `--fix`).
- [ ] `npm test` and `npm run test:e2e` succeed.

## Local infra and env

- [ ] `npm run db:up` brings Postgres to healthy (see [`LOCAL_SETUP.md`](./LOCAL_SETUP.md)).
- [ ] Fresh copy: `cp .env.example .env` and `cp apps/web/.env.example apps/web/.env` matches documented defaults ([`lesson-017`](./lessons/lesson-017-env-example-files.md)).

## CI parity (optional but recommended before Track 1)

- [ ] `npm run ci` passes locally (same ordering as GitHub Actions baseline).

## Documentation and governance

- [ ] [`development-roadmap.md`](./development-roadmap.md) baseline reflects completed steps through **032**.
- [ ] ADR index [`adr/README.md`](./adr/README.md) lists **000** (stack) and **001** (deviation process).
- [ ] Threat model stub [`security/threat-model-stub.md`](./security/threat-model-stub.md) present for Track 7 follow-up.
- [ ] Health smoke script documented: [`lesson-029`](./lessons/lesson-029-health-smoke-script.md).

## Manual smoke (two terminals)

With `npm run db:up`, `npm run start:dev`, and `npm run web:dev` running:

- [ ] `npm run health:smoke` exits `0` (or equivalent `curl` checks from [`lesson-029`](./lessons/lesson-029-health-smoke-script.md)).

## Sign-off

- [ ] Owner reviewed Track 0 lessons **028–032** for link rot against this checklist.
- [ ] Next work item is **Track 1 — Platform Core** starting at step **033** ([`development-roadmap.md`](./development-roadmap.md)).
