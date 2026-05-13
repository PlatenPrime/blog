# ADR-000: Nx + TanStack Start for this monorepo

## Status

Accepted — reflects the baseline chosen in Track 0 (steps 003–014) and documented in lessons [003](../lessons/lesson-003-nx-init.md), [004](../lessons/lesson-004-nx-targets-and-inference.md), [009](../lessons/lesson-009-root-scripts-via-nx.md), [010](../lessons/lesson-010-apps-web-tanstack-start.md), [020](../lessons/lesson-020-nx-cache-in-ci.md), [021](../lessons/lesson-021-nx-affected-flow-in-ci.md).

## Context

This repository is a **practice monorepo** for a blog/CMS: a **NestJS** API in `apps/api`, a **TanStack Start** app in `apps/web`, and shared TypeScript contracts in `libs/shared-contracts`. The target system (see [development-roadmap.md](../development-roadmap.md)) requires:

- Multiple deployable units and libraries in one workspace (`apps/*`, `libs/*`).
- Consistent **build / test / lint / typecheck** entry points for humans and CI.
- A **fullstack React** layer with **SSR and SEO** for the public site and a future admin studio.

npm workspaces alone provide package linking and script isolation per package, but they do not define a **task graph**, **cross-project dependencies**, or **remote/local task caching** out of the box. As the number of apps and libs grows, ad-hoc root `package.json` scripts become brittle.

For the frontend, we need a stack that supports **server rendering**, **clear server/client boundaries** (env and secrets), and **file-based routing** familiar to React teams, while staying aligned with the rest of the curriculum (Vite-based tooling, Nitro deployment story introduced at scaffold time).

## Decision

1. **Use Nx** as the monorepo task runner and graph layer on top of npm workspaces.
   - Nx discovers projects (`api`, `web`, `shared-contracts`) and wires targets via inference plugins (for example `@nx/vite/plugin` and `@nx/eslint/plugin` in [nx.json](../../nx.json)).
   - `targetDefaults` centralize caching semantics for `build`, `test`, `lint`, and related targets.
   - CI uses Nx **cache restore** and **`nx affected`** so unchanged subgraphs skip redundant work (lessons 020–021).

2. **Use TanStack Start** (Vite + Nitro, React) for `apps/web` as the single frontend application pattern for both **public SSR/SEO** and **admin** tracks described in the roadmap.
   - One framework surface reduces context switching and duplicate bundler/config stacks.
   - Shared DTO/types flow from `libs/shared-contracts` into the web app alongside the API (lessons 012–014).

**Out of scope for this ADR:** why NestJS is the API framework (that choice is anchored in the roadmap’s target system and step 005; it is not re-decided here).

## Alternatives considered

| Alternative                               | Why not chosen (summary)                                                                                                                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **npm/pnpm scripts only** (no Nx)         | Works for a tiny repo; scales poorly for multiple apps/libs, cacheable CI slices, and explicit dependency edges. We would re-implement affected detection and cache keys by hand.                                     |
| **Turborepo** instead of Nx               | Strong pipeline caching; weaker first-class **project graph** and inference integration for our Nx plugin ecosystem already adopted in steps 003–004. Switching would be a lateral move without a pressing repo pain. |
| **Next.js (App Router)** for SSR/SEO      | Mature ecosystem; overlaps with TanStack Start’s goals. We standardized on **TanStack Start** early in the track for cohesion with TanStack Router/Start docs and the scaffold we committed in step 010.              |
| **Separate repositories** for API and web | Simplifies ownership boundaries but breaks **shared-contracts** as a single source of truth and complicates coordinated refactors for a learning monorepo.                                                            |

## Consequences

### Positive

- One CLI mental model: `nx run <project>:<target>` and root npm scripts that delegate to Nx where appropriate.
- CI can key off the same graph developers use locally (`affected`, cacheable inputs in [nx.json](../../nx.json)).
- Frontend remains one Vite/Nitro app; onboarding paths stay consistent with upstream TanStack Start documentation.

### Negative / costs

- **Tooling surface area:** Nx major upgrades and plugin alignment must be planned; drift between workspace packages and Nx plugins is possible.
- **Cognitive load:** contributors must understand when to use `nx run` vs direct `npm run … -w <pkg>` (documented in the root [README.md](../../README.md)).
- **Opinionated defaults:** `targetDefaults` and named inputs encode policy; changing them affects all projects.

### Follow-up

- Deviations from this ADR (for example replacing TanStack Start or removing Nx) must be recorded as a **new ADR** and reflected in the roadmap (see step 032 — reserve for ADR updates).

## References

- [development-roadmap.md](../development-roadmap.md) — target system and step order.
- [nx.json](../../nx.json) — plugins and target defaults.
- [lesson-003](../lessons/lesson-003-nx-init.md), [lesson-010](../lessons/lesson-010-apps-web-tanstack-start.md) — implementation narrative for this decision.
