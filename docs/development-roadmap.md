# Development Roadmap: Fullstack Blog/CMS (NestJS + TanStack Start + Nx)

This document is the master implementation roadmap for this repository.
Every step is a sprint and must produce code changes + a lesson file in `docs/lessons/`.

## Target System

- Backend: NestJS API (auth, RBAC, CMS, moderation, validation, errors, observability)
- Frontend public: TanStack Start (SSR/SEO, post list, post page, metadata)
- Frontend admin: TanStack Start (editor studio, drafts, preview, publish)
- Monorepo: Nx (`apps/*`, `libs/*`, shared quality gates)

## Baseline Status

| Area                                  | Status                                     |
| ------------------------------------- | ------------------------------------------ |
| NestJS app                            | Exists in `apps/api/` (package name `api`) |
| Root workspace                        | Step 001 completed                         |
| Node/npm policy                       | Step 002 completed                         |
| Nx init                               | Step 003 completed                         |
| Nx target defaults                    | Step 004 completed                         |
| Nest in apps/api                      | Step 005 completed                         |
| Root tsconfig base + paths            | Step 006 completed                         |
| Root ESLint flat config               | Step 007 completed                         |
| Root Prettier + EditorConfig          | Step 008 completed                         |
| Root scripts via Nx (build/test/lint) | Step 009 completed                         |
| TanStack Start app in `apps/web`      | Step 010 completed                         |
| `web:typecheck` Nx target             | Step 011 completed                         |
| `libs/shared-contracts`               | Step 012 completed                         |
| Wire shared-contracts into API        | Step 013 completed                         |
| Wire shared-contracts into web        | Step 014 completed                         |
| CORS + dev origins                    | Step 015 completed                         |
| Local infra: Postgres compose         | Step 016 completed                         |
| `.env.example` files                  | Step 017 completed                         |
| Root README + API/web runbook         | Step 018 completed                         |
| CI pipeline baseline (GitHub Actions) | Step 019 completed                         |
| Nx cache in CI                        | Step 020 completed                         |
| Nx affected flow in CI                | Step 021 completed                         |
| Optional husky/lint-staged policy     | Step 022 completed                         |
| Lessons folder structure conventions  | Step 023 completed                         |
| Release stub and changelog policy     | Step 024 completed                         |
| Normalize `.gitignore`                | Step 025 completed                         |

## Step Contract (mandatory for every lesson)

Each `lesson-NNN-*.md` must include:

1. Learning Goal
2. Implementation Scope
3. Dependencies
4. Step-by-Step Changes
5. Verification (commands + expected result)
   - По умолчанию: сначала добавляем/обновляем тест (который сейчас падает/должен стать зелёным), затем пишем минимальный код чтобы тест прошёл, и только после этого (если применимо) делаем рефакторинг без изменения поведения.
   - Если шаг по контракту не подразумевает тестируемое поведение (например, миграции структуры/инфраструктуры), явно указать причину и какие проверки выполняются вместо unit-тестов.
6. Changed Files
7. Architecture Notes
8. Definition of Done

## Track Index

| Track | Name                          | Step Range |
| ----- | ----------------------------- | ---------- |
| 0     | Workspace Foundation          | 001-032    |
| 1     | Platform Core                 | 033-056    |
| 2     | Auth and Identity             | 057-104    |
| 3     | CMS Domain and Editor Backend | 105-164    |
| 4     | Public Site (TanStack Start)  | 165-200    |
| 5     | Admin Studio and Editor UX    | 201-252    |
| 6     | Data and Performance          | 253-278    |
| 7     | Reliability and Security      | 279-302    |
| 8     | Delivery and Productization   | 303-320    |

## Track 0 Detailed Steps

| Step | Title                                          | Verify                          |
| ---- | ---------------------------------------------- | ------------------------------- |
| 001  | Root package.json + npm workspaces             | `npm install`, `npm run test`   |
| 002  | Node/npm policy + LOCAL_SETUP                  | `node -v`, `npm install`        |
| 003  | Nx init in root                                | `npx nx show projects`          |
| 004  | `nx.json` target defaults + inference baseline | `npm run nx:show`               |
| 005  | Move Nest from `app/` to `apps/api`            | `nx run api:build`              |
| 006  | Add root tsconfig base + paths                 | `nx run api:build`              |
| 007  | Root ESLint flat config                        | `nx run api:lint`               |
| 008  | Root Prettier + editorconfig                   | `npm run format:check`          |
| 009  | Root scripts via Nx for build/test/lint        | `npm run build`                 |
| 010  | Create `apps/web` (TanStack Start scaffold)    | `nx run web:build`              |
| 011  | Add `web:typecheck` target                     | `nx run web:typecheck`          |
| 012  | Create `libs/shared-contracts`                 | `nx run shared-contracts:build` |
| 013  | Wire shared lib into API                       | `nx run api:build`              |
| 014  | Wire shared lib into web                       | `nx run web:build`              |
| 015  | Define CORS/dev origins                        | e2e smoke                       |
| 016  | Add PostgreSQL compose for local dev           | `docker compose up -d`          |
| 017  | Add `.env.example` files                       | docs check                      |
| 018  | Root README for API + web runbook              | review                          |
| 019  | CI pipeline baseline                           | green CI                        |
| 020  | Nx cache in CI                                 | cache hit evidence              |
| 021  | Nx affected flow in CI                         | `nx affected -t test`           |
| 022  | Optional husky/lint-staged policy              | commit hook                     |
| 023  | Lessons folder structure conventions           | file check                      |
| 024  | Release stub and changelog policy              | tag/doc                         |
| 025  | Normalize `.gitignore`                         | clean status                    |
| 026  | Optional VS Code recommendations               | file check                      |
| 027  | ADR-000: why Nx + TanStack Start               | ADR file                        |
| 028  | Threat model stub                              | markdown                        |
| 029  | Health smoke script                            | curl                            |
| 030  | Track 0 acceptance checklist                   | all DoD items                   |
| 031  | Reserve: CI matrix improvements                | green CI                        |
| 032  | Reserve: ADR updates for deviations            | ADR updates                     |

## Remaining Tracks (high-level)

### Track 1: Platform Core (033-056)

- Config module, env validation, health modules
- Error contract, exception filters, validation pipe
- Structured logging and request tracing

### Track 2: Auth and Identity (057-104)

- Users, password hashing, login/register
- JWT access + refresh rotation
- Roles/permissions and route guards

### Track 3: CMS Backend (105-164)

- Posts lifecycle (draft/publish)
- Tags/categories/comments/moderation
- SEO fields and frontend contracts

### Track 4: Public Site (165-200)

- SSR routes and data loaders
- SEO metadata, sitemap, robots
- Search/filter/pagination

### Track 5: Admin Studio (201-252)

- Admin auth boundary
- Editor UX, autosave, preview, publish
- Moderation UI

### Track 6: Data and Performance (253-278)

- DB indexes and query tuning
- Caching and invalidation strategy
- Performance budgets

### Track 7: Reliability and Security (279-302)

- Throttling, hardening, headers
- Health/readiness/liveness
- Metrics/logging/alerting contracts

### Track 8: Delivery and Productization (303-320)

- Docker images for API and web
- Deployment/release strategy
- Capstone architecture review

## Completed Steps Snapshot

| Step | Lesson                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------ |
| 001  | [lesson-001-root-npm-workspaces.md](./lessons/lesson-001-root-npm-workspaces.md)                             |
| 002  | [lesson-002-local-setup-and-node-policy.md](./lessons/lesson-002-local-setup-and-node-policy.md)             |
| 003  | [lesson-003-nx-init.md](./lessons/lesson-003-nx-init.md)                                                     |
| 004  | [lesson-004-nx-targets-and-inference.md](./lessons/lesson-004-nx-targets-and-inference.md)                   |
| 005  | [lesson-005-nest-apps-api-migration.md](./lessons/lesson-005-nest-apps-api-migration.md)                     |
| 006  | [lesson-006-root-tsconfig-base-and-paths.md](./lessons/lesson-006-root-tsconfig-base-and-paths.md)           |
| 007  | [lesson-007-root-eslint-flat-config.md](./lessons/lesson-007-root-eslint-flat-config.md)                     |
| 008  | [lesson-008-root-prettier-and-editorconfig.md](./lessons/lesson-008-root-prettier-and-editorconfig.md)       |
| 009  | [lesson-009-root-scripts-via-nx.md](./lessons/lesson-009-root-scripts-via-nx.md)                             |
| 010  | [lesson-010-apps-web-tanstack-start.md](./lessons/lesson-010-apps-web-tanstack-start.md)                     |
| 011  | [lesson-011-web-typecheck-target.md](./lessons/lesson-011-web-typecheck-target.md)                           |
| 012  | [lesson-012-shared-contracts-lib.md](./lessons/lesson-012-shared-contracts-lib.md)                           |
| 013  | [lesson-013-wire-shared-contracts-api.md](./lessons/lesson-013-wire-shared-contracts-api.md)                 |
| 014  | [lesson-014-wire-shared-contracts-web.md](./lessons/lesson-014-wire-shared-contracts-web.md)                 |
| 015  | [lesson-015-cors-and-dev-origins.md](./lessons/lesson-015-cors-and-dev-origins.md)                           |
| 016  | [lesson-016-postgres-compose-local-dev.md](./lessons/lesson-016-postgres-compose-local-dev.md)               |
| 017  | [lesson-017-env-example-files.md](./lessons/lesson-017-env-example-files.md)                                 |
| 018  | [lesson-018-root-readme-runbook.md](./lessons/lesson-018-root-readme-runbook.md)                             |
| 019  | [lesson-019-ci-pipeline-baseline.md](./lessons/lesson-019-ci-pipeline-baseline.md)                           |
| 020  | [lesson-020-nx-cache-in-ci.md](./lessons/lesson-020-nx-cache-in-ci.md)                                       |
| 021  | [lesson-021-nx-affected-flow-in-ci.md](./lessons/lesson-021-nx-affected-flow-in-ci.md)                       |
| 022  | [lesson-022-optional-husky-lint-staged-policy.md](./lessons/lesson-022-optional-husky-lint-staged-policy.md) |
| 024  | [lesson-024-release-stub-and-changelog-policy.md](./lessons/lesson-024-release-stub-and-changelog-policy.md) |
| 025  | [lesson-025-normalize-gitignore.md](./lessons/lesson-025-normalize-gitignore.md)                             |

Entry point: [LOCAL_SETUP.md](./LOCAL_SETUP.md)
