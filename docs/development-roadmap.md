# Development Roadmap: Fullstack Blog/CMS (NestJS + TanStack Start + Nx)

This document is the master implementation roadmap for this repository.
Every step is a sprint and must produce code changes + a lesson file in `docs/lessons/`, and **sync all documentation indexes** including [`docs/storytelling.md`](./storytelling.md) (see [lesson-authoring-guide.md](./lesson-authoring-guide.md#documentation-sync-checklist) and [`.cursor/rules/documentation-sync.mdc`](../.cursor/rules/documentation-sync.mdc)).

## Target System

- Backend: NestJS API (auth, RBAC, CMS, moderation, validation, errors, observability)
- Frontend public: TanStack Start (SSR/SEO, post list, post page, metadata)
- Frontend admin: TanStack Start (editor studio, drafts, preview, publish)
- Monorepo: Nx (`apps/*`, `libs/*`, shared quality gates)

## Baseline Status

| Area                                                    | Status                                             |
| ------------------------------------------------------- | -------------------------------------------------- |
| Track 2 (Auth and identity)                             | Steps 057–098 completed; next: **099** (MFA brief) |
| NestJS app                                              | Exists in `apps/api/` (package name `api`)         |
| Root workspace                                          | Step 001 completed                                 |
| Node/npm policy                                         | Step 002 completed                                 |
| Nx init                                                 | Step 003 completed                                 |
| Nx target defaults                                      | Step 004 completed                                 |
| Nest in apps/api                                        | Step 005 completed                                 |
| Root tsconfig base + paths                              | Step 006 completed                                 |
| Root ESLint flat config                                 | Step 007 completed                                 |
| Root Prettier + EditorConfig                            | Step 008 completed                                 |
| Root scripts via Nx (build/test/lint)                   | Step 009 completed                                 |
| TanStack Start app in `apps/web`                        | Step 010 completed                                 |
| `web:typecheck` Nx target                               | Step 011 completed                                 |
| `libs/shared-contracts`                                 | Step 012 completed                                 |
| Wire shared-contracts into API                          | Step 013 completed                                 |
| Wire shared-contracts into web                          | Step 014 completed                                 |
| CORS + dev origins                                      | Step 015 completed                                 |
| Local infra: Postgres compose                           | Step 016 completed                                 |
| `.env.example` files                                    | Step 017 completed                                 |
| Root README + API/web runbook                           | Step 018 completed                                 |
| CI pipeline baseline (GitHub Actions)                   | Step 019 completed                                 |
| Nx cache in CI                                          | Step 020 completed                                 |
| Nx affected flow in CI                                  | Step 021 completed                                 |
| Optional husky/lint-staged policy                       | Step 022 completed                                 |
| Lessons folder structure conventions                    | Step 023 completed                                 |
| Release stub and changelog policy                       | Step 024 completed                                 |
| Normalize `.gitignore`                                  | Step 025 completed                                 |
| Optional VS Code recommendations                        | Step 026 completed                                 |
| ADR-000 (Nx + TanStack Start)                           | Step 027 completed                                 |
| Threat model stub                                       | Step 028 completed                                 |
| Health smoke script                                     | Step 029 completed                                 |
| Track 0 acceptance checklist                            | Step 030 completed                                 |
| CI matrix improvements (reserve)                        | Step 031 completed                                 |
| ADR process for deviations (reserve)                    | Step 032 completed                                 |
| Config module + env validation (Zod)                    | Step 033 completed                                 |
| Terminus `/health` liveness                             | Step 034 completed                                 |
| Readiness probe `/health/ready`                         | Step 035 completed                                 |
| Health response DTOs (shared-contracts)                 | Step 036 completed                                 |
| API error envelope types (shared-contracts)             | Step 037 completed                                 |
| Global exception filter + HTTP error mapping            | Step 038 completed                                 |
| Global ValidationPipe (whitelist, transform)            | Step 039 completed                                 |
| DTO validation conventions + sample resource            | Step 040 completed                                 |
| Problem Details (`problem+json`) alignment              | Step 041 completed                                 |
| Safe unknown errors (no stack leak)                     | Step 042 completed                                 |
| Request ID middleware + ALS context                     | Step 043 completed                                 |
| Structured logging (nestjs-pino)                        | Step 044 completed                                 |
| Request logging interceptor                             | Step 045 completed                                 |
| Correlation ID in response headers                      | Step 046 completed                                 |
| Redact sensitive fields in logs                         | Step 047 completed                                 |
| OpenTelemetry noop tracer provider                      | Step 048 completed                                 |
| Trace context propagation (W3C)                         | Step 049 completed                                 |
| Prometheus `/metrics` stub                              | Step 050 completed                                 |
| Global API prefix + URI versioning (`/api/v1`)          | Step 051 completed                                 |
| Graceful shutdown hooks (SIGTERM)                       | Step 052 completed                                 |
| Request timeout / abort + shutdown grace                | Step 053 completed                                 |
| Contract tests for error JSON shape                     | Step 054 completed                                 |
| Track 1 acceptance checklist                            | Step 055 completed                                 |
| Platform observability follow-ups (OTLP, logs, metrics) | Step 056 completed                                 |
| Database module (Postgres + TypeORM bootstrap)          | Step 057 completed                                 |
| Datasource config from validated env (`DATABASE_URL`)   | Step 058 completed                                 |
| Migration workflow + baseline schema                    | Step 059 completed                                 |
| `User` entity + indexes (`users` table)                 | Step 060 completed                                 |
| Password hasher service (Argon2id)                      | Step 061 completed                                 |
| `UserService` create/find by email                      | Step 062 completed                                 |
| `POST /auth/register` + DTO                             | Step 063 completed                                 |
| Unique email + friendly CONFLICT on register            | Step 064 completed                                 |
| `POST /auth/login` with credential verification         | Step 065 completed                                 |
| JWT access token issuance + verify service              | Step 066 completed                                 |
| `JwtStrategy` + `AuthGuard`                             | Step 067 completed                                 |
| `@CurrentUser()` decorator                              | Step 068 completed                                 |
| Refresh token entity + persistence                      | Step 069 completed                                 |
| `POST /auth/refresh` + rotation semantics               | Step 070 completed                                 |
| `POST /auth/logout` + revoke refresh                    | Step 071 completed                                 |
| Refresh token reuse detection policy                    | Step 072 completed                                 |
| Token TTL configuration + documentation                 | Step 073 completed                                 |
| Login brute-force throttle / basic lockout              | Step 074 completed                                 |
| Email verification token model                          | Step 075 completed                                 |
| `POST /auth/verify-email`                               | Step 076 completed                                 |
| Password reset request flow                             | Step 077 completed                                 |
| Password reset completion                               | Step 078 completed                                 |
| Roles + permissions schema (tables/enums)               | Step 079 completed                                 |
| Seed default roles (admin, editor, viewer)              | Step 080 completed                                 |
| `RolesGuard` + `@Roles()`                               | Step 081 completed                                 |
| Fine-grained `PermissionsGuard` + constants             | Step 082 completed                                 |
| Sample CMS route protected by RBAC                      | Step 083 completed                                 |
| JWT payload shape in `shared-contracts`                 | Step 084 completed                                 |
| Auth e2e: register → login happy path                   | Step 085 completed                                 |
| Auth e2e: refresh rotation                              | Step 086 completed                                 |
| Auth e2e: RBAC forbidden cases                          | Step 087 completed                                 |
| Security audit log table                                | Step 088 completed                                 |
| Audit events for auth mutations                         | Step 089 completed                                 |

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
9. **Storytelling sync** — по [`.cursor/rules/storytelling.mdc`](../.cursor/rules/storytelling.mdc): строка в «Уроки этой главы» (I–XIII или новая глава) + 2–4 предложения к **арке** (не changelog `NNN — …`); «Где мы сейчас» / «Что дальше» кратко. Без `### Шаг NNN`, без списков из урока.
10. **External operations (outside the repo)** — по [lesson-authoring-guide § External operations](./lesson-authoring-guide.md#external-operations-вне-репозитория) и [`.cursor/rules/external-operations-lessons.mdc`](../.cursor/rules/external-operations-lessons.mdc): таблица действий вне IDE (Docker, Railway, Vercel, Supabase, DNS, dashboards) + короткий architecture sketch; если внешних шагов нет — явная фраза об этом. Облачный deploy не смешивать с локальным compose без пояснения.

## Track Index

| Track | Name                          | Step Range |
| ----- | ----------------------------- | ---------- |
| 0     | Workspace Foundation          | 001-032    |
| 1     | Platform Core                 | 033-056    |
| 2     | Auth and Identity             | 057-109    |
| 3     | CMS Domain and Editor Backend | 110-174    |
| 4     | Public Site (TanStack Start)  | 175-212    |
| 5     | Admin Studio and Editor UX    | 213-264    |
| 6     | Data and Performance          | 265-291    |
| 7     | Reliability and Security      | 292-315    |
| 8     | Delivery and Productization   | 316-334    |

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

Detailed steps for Tracks 1–8 follow. High-level themes: **Track 1** — platform API surface (health, errors, validation, logging, tracing); **Track 2** — identity and RBAC; **Track 3** — CMS domain on the API; **Track 4** — public TanStack Start site; **Track 5** — admin studio UX; **Track 6** — data layer performance and caching; **Track 7** — security and reliability operations; **Track 8** — containerization and delivery.

## Track 1 Detailed Steps (033-056)

| Step | Title                                                   | Verify                            |
| ---- | ------------------------------------------------------- | --------------------------------- |
| 033  | NestJS ConfigModule + Zod env validation                | `nx run api:test`                 |
| 034  | Terminus health module + `/health` liveness             | curl `/health`                    |
| 035  | Readiness probe + dependency indicators                 | curl `/health/ready`              |
| 036  | Health response DTOs in `shared-contracts`              | `nx run shared-contracts:build`   |
| 037  | API error envelope types in `shared-contracts`          | `nx run shared-contracts:build`   |
| 038  | Global exception filter + HTTP error mapping            | `nx run api:test`                 |
| 039  | Global `ValidationPipe` (whitelist, transform)          | e2e smoke                         |
| 040  | DTO validation conventions + sample resource            | `nx run api:lint`                 |
| 041  | Problem Details (`problem+json`) alignment (optional)   | contract test — done              |
| 042  | Safe handling of unknown errors (no stack leak)         | unit test — done                  |
| 043  | Request ID middleware / `AsyncLocalStorage` context     | header present in response — done |
| 044  | Structured logging module (pino or Nest logger adapter) | log JSON shape check — done       |
| 045  | Request logging interceptor                             | manual request log — done         |
| 046  | Correlation ID in response headers                      | e2e assertion — done              |
| 047  | Redact sensitive fields in logs                         | unit test — done                  |
| 048  | OpenTelemetry wiring + noop tracer provider             | `nx run api:build` — done         |
| 049  | Trace context propagation for incoming HTTP             | manual trace check — done         |
| 050  | Metrics endpoint stub (Prometheus exposition)           | curl `/metrics` — done            |
| 051  | Global API prefix + versioning strategy (URI or header) | docs review — done                |
| 052  | Graceful shutdown hooks                                 | SIGTERM smoke — done              |
| 053  | Request timeout / abort interceptor                     | unit/e2e — done                   |
| 054  | Contract tests for error JSON shape                     | `nx run api:test` — done          |
| 055  | Track 1 acceptance checklist                            | all DoD items — done              |
| 056  | Reserve: platform observability follow-ups              | ADR or docs check — done          |

## Track 2 Detailed Steps (057-109)

| Step | Title                                                                       | Verify                                 |
| ---- | --------------------------------------------------------------------------- | -------------------------------------- |
| 057  | Database module: Postgres + ORM bootstrap                                   | `nx run api:build` — done              |
| 058  | Datasource config from validated env (`DATABASE_URL`)                       | `nx run api:test` — done               |
| 059  | Migration workflow + baseline schema                                        | migrate up/down smoke — done           |
| 060  | `User` entity + indexes                                                     | `nx run api:test` — done               |
| 061  | Password hasher service (argon2 or bcrypt)                                  | unit test — done                       |
| 062  | `UserService` create/find by email                                          | unit test — done                       |
| 063  | `POST /auth/register` + DTO                                                 | e2e — done                             |
| 064  | Unique email constraint + friendly error mapping                            | e2e — done                             |
| 065  | `POST /auth/login`                                                          | e2e — done                             |
| 066  | JWT access token issuance + verify service                                  | unit test — done                       |
| 067  | `JwtStrategy` + `AuthGuard`                                                 | e2e — done                             |
| 068  | `@CurrentUser()` decorator                                                  | unit test — done                       |
| 069  | Refresh token entity + persistence                                          | migration — done                       |
| 070  | `POST /auth/refresh` + rotation semantics                                   | e2e — done                             |
| 071  | `POST /auth/logout` + revoke refresh                                        | e2e — done                             |
| 072  | Refresh token reuse detection policy                                        | unit/e2e — done                        |
| 073  | Token TTL configuration + documentation                                     | docs check — done                      |
| 074  | Login brute-force throttle / basic lockout                                  | e2e — done                             |
| 075  | Email verification token model (optional minimal)                           | unit test — done                       |
| 076  | `POST /auth/verify-email`                                                   | e2e — done                             |
| 077  | Password reset request flow                                                 | e2e — done                             |
| 078  | Password reset completion                                                   | e2e — done                             |
| 079  | Roles + permissions schema (tables/enums)                                   | migration — done                       |
| 080  | Seed default roles (admin, editor, viewer)                                  | seed script — done                     |
| 081  | `RolesGuard` + `@Roles()`                                                   | e2e — done                             |
| 082  | Fine-grained `PermissionsGuard` + constants                                 | e2e — done                             |
| 083  | Sample CMS route protected by RBAC                                          | e2e forbidden case — done              |
| 084  | JWT payload shape documented in `shared-contracts`                          | `nx run shared-contracts:build` — done |
| 085  | Auth e2e: register → login happy path                                       | e2e — done                             |
| 086  | Auth e2e: refresh rotation                                                  | e2e — done                             |
| 087  | Auth e2e: RBAC forbidden cases                                              | e2e — done                             |
| 088  | Security audit log table                                                    | migration — done                       |
| 089  | Audit events for auth mutations                                             | unit test — done                       |
| 090  | Email channel: MailDev in compose + `EmailService` + verify/reset templates | compose + unit — done                  |
| 091  | Rate limits on `request-password-reset` and resend verify (email + IP)      | e2e — done                             |
| 092  | API security baseline: Helmet + global `@nestjs/throttler`                  | e2e / header scan — done               |
| 093  | `REQUIRE_EMAIL_VERIFIED` policy (env) for login and sensitive routes        | unit + e2e — done                      |
| 094  | OpenAPI/Swagger (`/api/docs`) + schema export for review                    | `nx run api:build` — done              |
| 095  | Session/device metadata (optional minimal)                                  | docs + unit — done                     |
| 096  | Map auth failures to API error envelope                                     | contract test — done                   |
| 097  | Service/API key auth stub (optional)                                        | unit test — done                       |
| 098  | OAuth/social login deferred ADR                                             | ADR file — done                        |
| 099  | MFA roadmap note + threat model touch-up                                    | markdown review                        |
| 100  | Account recovery edge-case tests                                            | `nx run api:test`                      |
| 101  | Password rotation policy (optional)                                         | policy doc                             |
| 102  | User soft-delete / anonymization stub                                       | migration + unit                       |
| 103  | Auth integration test matrix doc                                            | docs check                             |
| 104  | Cross-service auth header conventions                                       | ADR snippet                            |
| 105  | Token rotation observability hook (counter/log)                             | manual verify                          |
| 106  | Auth module README + operator runbook                                       | review                                 |
| 107  | Track 2 acceptance checklist                                                | all DoD items                          |
| 108  | Reserve: OIDC / SSO integration spike                                       | spike doc                              |
| 109  | Reserve: WebAuthn / passkeys spike                                          | spike doc                              |

## Track 3 Detailed Steps (110-174)

| Step | Title                                                                    | Verify             |
| ---- | ------------------------------------------------------------------------ | ------------------ |
| 110  | Dev seed: admin/editor users, sample draft post, tags                    | seed script        |
| 111  | `Post` entity + lifecycle enum + migration                               | migrate smoke      |
| 112  | Slug field + unique index strategy                                       | DB constraint test |
| 113  | `PostService`: create draft                                              | unit test          |
| 114  | Author ownership rules (`authorId`)                                      | unit/e2e           |
| 115  | `PATCH` draft fields validation                                          | e2e                |
| 116  | Post `version` + `If-Match` on `PATCH` (412 on conflict)                 | e2e                |
| 117  | Publish rules: required fields checklist                                 | unit test          |
| 118  | Publish transition + `publishedAt`                                       | e2e                |
| 119  | Atomic publish: transaction for `status` + `publishedAt` + revision hook | e2e                |
| 120  | Unpublish + state machine tests                                          | e2e                |
| 121  | SEO title/description columns                                            | migration          |
| 122  | Open Graph / Twitter card fields                                         | migration          |
| 123  | Canonical URL + redirect policy                                          | unit test          |
| 124  | `shared-contracts`: `PublicPostSummary`                                  | build              |
| 125  | `shared-contracts`: `PublicPostDetail`                                   | build              |
| 126  | `shared-contracts`: admin post write payload                             | build              |
| 127  | Pagination and list contracts ADR (offset vs keyset)                     | ADR                |
| 128  | List published posts query (pagination)                                  | e2e                |
| 129  | Get public post by slug                                                  | e2e                |
| 130  | `Tag` entity + migration                                                 | migrate smoke      |
| 131  | Post–tag many-to-many                                                    | unit test          |
| 132  | `Category` entity (+ optional hierarchy)                                 | migrate smoke      |
| 133  | Post–category relation                                                   | unit test          |
| 134  | Admin list posts with tag/category filters                               | e2e                |
| 135  | Public posts-by-tag contract                                             | e2e                |
| 136  | Tag slug uniqueness                                                      | DB test            |
| 137  | Bulk add/remove tags endpoints                                           | e2e                |
| 138  | `Comment` entity + migration                                             | migrate smoke      |
| 139  | Comment threading (`parentId`)                                           | unit test          |
| 140  | `POST` public comment (pending moderation)                               | e2e                |
| 141  | Admin moderation queue list                                              | e2e                |
| 142  | Approve comment action                                                   | e2e                |
| 143  | Reject/delete comment action                                             | e2e                |
| 144  | Moderation audit log entries                                             | unit test          |
| 145  | Comment anti-spam: throttle + honeypot (depends on step 092)             | e2e                |
| 146  | Safe URL validation for media/canonical/OG fields (SSRF prep)            | unit test          |
| 147  | Featured media metadata fields on post (upload in step 265)              | migration          |
| 148  | Attachment metadata table stub (no binary upload)                        | migration          |
| 149  | HTML/Markdown sanitization pipeline                                      | XSS unit tests     |
| 150  | XSS regression tests for user content                                    | `nx run api:test`  |
| 151  | Reading time / word-count utility                                        | unit test          |
| 152  | RSS/Atom XML public endpoint                                             | curl               |
| 153  | Related posts by shared tags                                             | unit test          |
| 154  | Internal sitemap data provider service                                   | unit test          |
| 155  | Revision snapshots on publish                                            | e2e                |
| 156  | Admin diff between two revisions                                         | e2e                |
| 157  | Preview token model + TTL                                                | unit test          |
| 158  | Preview token middleware (scope-limited)                                 | e2e                |
| 159  | Scheduled publish fields + worker stub (depends on step 281 queue)       | docs + unit        |
| 160  | Soft-delete posts + trash list (admin)                                   | e2e                |
| 161  | Restore post from trash                                                  | e2e                |
| 162  | Hard delete (admin-only) + cascade rules                                 | e2e                |
| 163  | Search phase 1 (ILIKE / simple query)                                    | e2e                |
| 164  | Search-supporting index migration                                        | explain smoke      |
| 165  | Import post JSON validation stub                                         | unit test          |
| 166  | Export post JSON stub endpoint                                           | curl               |
| 167  | Co-authors relation (optional)                                           | migration          |
| 168  | Report comment endpoint                                                  | e2e                |
| 169  | Block user moderation endpoint                                           | e2e                |
| 170  | Newsletter subscribe API stub                                            | e2e                |
| 171  | CMS contract tests ↔ `shared-contracts`                                  | `nx run api:test`  |
| 172  | List/detail query performance guidelines                                 | docs review        |
| 173  | Track 3 acceptance checklist                                             | all DoD items      |
| 174  | Reserve: CMS extensions ADR                                              | ADR file           |

## Track 4 Detailed Steps (175-212)

| Step | Title                                                        | Verify                        |
| ---- | ------------------------------------------------------------ | ----------------------------- |
| 175  | `libs/web-api`: fetch + Problem Details + auth header policy | `nx run web:build`            |
| 176  | Web Vitest + RTL harness + MSW/fixtures                      | `nx run web:test`             |
| 177  | Public route tree scaffold (`/`, `/posts`)                   | `nx run web:build`            |
| 178  | Post list route + layout                                     | `nx run web:typecheck`        |
| 179  | Server loader: fetch published posts page                    | manual SSR check              |
| 180  | Post card component + accessibility pass                     | RTL smoke optional            |
| 181  | Post detail route `/posts/$slug`                             | `nx run web:build`            |
| 182  | Loader: fetch post by slug + 404 mapping                     | manual                        |
| 183  | Shared typography / prose styles for content                 | visual review                 |
| 184  | `<title>` + description meta from loader                     | view-source check             |
| 185  | Open Graph meta component                                    | social debugger               |
| 186  | Twitter card meta helper                                     | view-source check             |
| 187  | Canonical `<link rel="canonical">` strategy                  | view-source check             |
| 188  | `robots.txt` route                                           | curl                          |
| 189  | `sitemap.xml` generation route                               | curl                          |
| 190  | Pagination UI + URL state                                    | manual                        |
| 191  | Tag filter page `/tags/$slug`                                | manual                        |
| 192  | Category archive route (optional)                            | manual                        |
| 193  | Search page `/search?q=`                                     | manual                        |
| 194  | Empty-state UX for list/search                               | visual review                 |
| 195  | Error boundary mapped to API error envelope                  | manual                        |
| 196  | JSON-LD `<script type="application/ld+json">` for articles   | validator                     |
| 197  | RSS `<link rel="alternate">` in layout                       | view-source check             |
| 198  | Image `width`/`height` + lazy loading                        | Lighthouse note               |
| 199  | Loading skeletons for list/detail                            | visual review                 |
| 200  | Consume cache headers from API where applicable              | docs + manual                 |
| 201  | Data caching policy doc (TanStack Query / loaders)           | docs check                    |
| 202  | Playwright e2e: list + detail smoke                          | `nx run web:e2e` (if present) |
| 203  | Lighthouse performance budget doc                            | markdown                      |
| 204  | Optional: Lighthouse CI hook                                 | green CI                      |
| 205  | Track 4 acceptance checklist                                 | all DoD items                 |
| 206  | Reserve: i18n routing                                        | ADR/spike                     |
| 207  | Reserve: AMP or alternate representation                     | ADR                           |
| 208  | Reserve: CDN / edge caching notes                            | ADR                           |
| 209  | Reserve: read-only comments embed                            | spike doc                     |
| 210  | Reserve: public analytics hook                               | ADR                           |
| 211  | Reserve: theme + a11y polish                                 | checklist                     |
| 212  | Reserve: CSP for third-party embeds                          | ADR                           |

## Track 5 Detailed Steps (213-264)

| Step | Title                                                      | Verify             |
| ---- | ---------------------------------------------------------- | ------------------ |
| 213  | Admin shell layout + navigation                            | `nx run web:build` |
| 214  | Auth gate for `/admin/*` routes                            | e2e                |
| 215  | Admin login page + token storage policy                    | e2e                |
| 216  | Silent refresh on navigation                               | manual             |
| 217  | Dashboard home (metrics stubs)                             | visual             |
| 218  | Admin posts table + server loader                          | manual             |
| 219  | “New post” flow entry                                      | e2e                |
| 220  | Draft editor layout (two-column)                           | visual             |
| 221  | Editor stack ADR (MDX vs rich text)                        | ADR file           |
| 222  | Autosave debounce → `PATCH` draft                          | e2e                |
| 223  | Autosave status indicator                                  | visual             |
| 224  | Optimistic concurrency / conflict UI (depends on step 126) | e2e                |
| 225  | Preview panel (iframe or embedded)                         | manual             |
| 226  | Preview route `/admin/posts/:id/preview`                   | e2e                |
| 227  | Publish dialog + confirmation                              | e2e                |
| 228  | Inline validation for publish requirements                 | e2e                |
| 229  | Unpublish action                                           | e2e                |
| 230  | Tags editor (multi-select)                                 | manual             |
| 231  | Categories editor (tree optional)                          | manual             |
| 232  | Featured image picker UI stub                              | manual             |
| 233  | Media library modal stub                                   | manual             |
| 234  | SEO fields form section                                    | manual             |
| 235  | Slug field + availability check API                        | e2e                |
| 236  | Comments moderation queue page                             | e2e                |
| 237  | Bulk moderation actions                                    | e2e                |
| 238  | Role-based navigation visibility                           | e2e                |
| 239  | Admin-specific 403/404 pages                               | manual             |
| 240  | Toast mapping from API errors                              | manual             |
| 241  | Editor keyboard shortcuts (optional)                       | docs               |
| 242  | Draft list filters + pagination                            | e2e                |
| 243  | Trash management UI                                        | e2e                |
| 244  | Revision timeline UI                                       | manual             |
| 245  | Revision diff view                                         | manual             |
| 246  | Restore revision action                                    | e2e                |
| 247  | Scheduled publish datetime control                         | e2e                |
| 248  | Co-authors selector (optional)                             | manual             |
| 249  | Audit log viewer stub                                      | manual             |
| 250  | Admin site settings stub page                              | manual             |
| 251  | Admin e2e: login → create draft                            | e2e                |
| 252  | Admin e2e: publish happy path                              | e2e                |
| 253  | Admin accessibility checklist                              | manual audit       |
| 254  | Track 5 acceptance checklist                               | all DoD items      |
| 255  | Reserve: collaborative editing research                    | doc                |
| 256  | Reserve: plugins/extensions architecture                   | ADR                |
| 257  | Reserve: admin dark mode tokens                            | design doc         |
| 258  | Reserve: admin i18n                                        | ADR                |
| 259  | Reserve: MDX vs WYSIWYG toggle                             | spike              |
| 260  | Reserve: image CDN integration                             | ADR                |
| 261  | Reserve: editor performance profiling                      | notes              |
| 262  | Reserve: mobile read-only admin                            | spike              |
| 263  | Reserve: staging/preview environments workflow             | runbook            |
| 264  | Reserve: SaaS billing gate variant                         | ADR                |

## Track 6 Detailed Steps (265-291)

| Step | Title                                                                 | Verify              |
| ---- | --------------------------------------------------------------------- | ------------------- |
| 265  | Media object storage (local disk or S3-compatible) + MIME/size limits | e2e                 |
| 266  | DB index review for posts/slugs/tags/comments                         | migration review    |
| 267  | Capture `EXPLAIN (ANALYZE)` baselines doc                             | SQL artifact        |
| 268  | Remove N+1 on post list queries                                       | `nx run api:test`   |
| 269  | Optimize comment thread reads                                         | explain smoke       |
| 270  | Connection pool tuning notes                                          | docs                |
| 271  | Read replica ADR (optional stub)                                      | ADR                 |
| 272  | Add Redis service to local compose                                    | `docker compose up` |
| 273  | Redis cache module in API                                             | unit test           |
| 274  | Cache-aside: public post by slug                                      | e2e                 |
| 275  | Invalidate cache on publish/unpublish/delete                          | e2e                 |
| 276  | Align HTTP cache headers API → web consumers                          | manual              |
| 277  | Surrogate key / tag invalidation design note                          | ADR                 |
| 278  | Query timeouts + circuit breaker stub                                 | unit test           |
| 279  | Keyset vs offset pagination ADR (supersedes step 127 if adopted)      | ADR                 |
| 280  | Materialized view for tag counts (optional)                           | migration           |
| 281  | Background job queue stub (optional BullMQ)                           | smoke               |
| 282  | Warm-cache hook on deploy (optional)                                  | script              |
| 283  | Measure Web Vitals on public home                                     | RUM note            |
| 284  | Performance budget thresholds (doc)                                   | markdown            |
| 285  | Optional k6 load smoke script                                         | local run           |
| 286  | Track 6 acceptance checklist                                          | all DoD items       |
| 287  | Reserve: sharding notes                                               | ADR                 |
| 288  | Reserve: cold storage / archives                                      | ADR                 |
| 289  | Reserve: image processing pipeline                                    | ADR                 |
| 290  | Reserve: query fan-out guardrails                                     | doc                 |
| 291  | Reserve: autoscaling signals                                          | doc                 |

## Track 7 Detailed Steps (292-315)

| Step | Title                                                                       | Verify          |
| ---- | --------------------------------------------------------------------------- | --------------- |
| 292  | Production HTTP rate limit tuning (Redis/per-route; baseline in step 092)   | e2e             |
| 293  | Stricter production throttles on `/auth/*`                                  | e2e             |
| 294  | Production security headers review (Helmet hardening; baseline in step 092) | header scan     |
| 295  | Production CORS tightening review                                           | checklist       |
| 296  | Content-Security-Policy baseline for `web`                                  | browser console |
| 297  | HSTS + secure cookie policy doc                                             | docs            |
| 298  | SSRF protections for outbound hooks (extends step 156)                      | unit test       |
| 299  | CSRF strategy for cookie-based sessions                                     | ADR             |
| 300  | Secrets scanning in CI (optional gitleaks)                                  | green CI        |
| 301  | Dependency update policy + `npm audit` gate                                 | policy doc      |
| 302  | Optional SAST / CodeQL workflow                                             | green CI        |
| 303  | Penetration test checklist → threat model                                   | markdown        |
| 304  | Kubernetes-style liveness/readiness finalization                            | curl probes     |
| 305  | Degraded mode when Redis unavailable                                        | e2e/manual      |
| 306  | Security-denied structured logs                                             | log review      |
| 307  | Alerting skeleton (e.g. Slack webhook stub)                                 | manual          |
| 308  | API latency SLO definitions                                                 | doc             |
| 309  | Synthetic uptime check script                                               | cron-ready      |
| 310  | Track 7 acceptance checklist                                                | all DoD items   |
| 311  | Reserve: WAF integration notes                                              | ADR             |
| 312  | Reserve: mTLS for internal services                                         | ADR             |
| 313  | Reserve: KMS / envelope encryption                                          | ADR             |
| 314  | Reserve: SOC2 control mapping stub                                          | doc             |
| 315  | Reserve: incident response drill runbook                                    | doc             |

## Track 8 Detailed Steps (316-334)

| Step | Title                                               | Verify           |
| ---- | --------------------------------------------------- | ---------------- |
| 316  | Multi-stage `Dockerfile` for `api`                  | `docker build`   |
| 317  | Multi-stage `Dockerfile` for `web` (SSR)            | `docker build`   |
| 318  | Production-like `docker compose` stack              | compose up smoke |
| 319  | Container image scanning in CI (optional Trivy)     | green CI         |
| 320  | Deploy workflow skeleton (GitHub Actions)           | dry run          |
| 321  | Environment promotion doc (dev/stage/prod)          | review           |
| 322  | Release versioning + changelog gate                 | tag policy       |
| 323  | DB migrations in deploy sequence                    | runbook          |
| 324  | DB backup/restore drill (local) + operator runbook  | drill note       |
| 325  | Documented rollback procedure                       | drill note       |
| 326  | Observability stack compose (logs/metrics optional) | compose smoke    |
| 327  | Capstone: architecture review checklist             | review meeting   |
| 328  | Capstone: threat model refresh                      | markdown         |
| 329  | Production one-page runbook                         | doc              |
| 330  | Reserve: Kubernetes manifests stub                  | YAML lint        |
| 331  | Reserve: Terraform module stub                      | fmt/validate     |
| 332  | Reserve: blue/green deployment                      | ADR              |
| 333  | Reserve: secrets manager integration                | ADR              |
| 334  | Reserve: cost/usage observability dashboard         | doc              |

## Roadmap step migration (090+ renumber, 2026-05) {#roadmap-step-migration-090-renumber-2026-05}

Steps **001–089** and completed lessons are unchanged. Former steps **090–320** map to new numbers below. **New steps** (no old number): **090–094**, **110** (dev seed), **116**, **119**, **127**, **146**, **175–176**, **265** (media storage), **324** (backup drill). Former **105** is now **111** (seed occupies **110**).

See [ADR-003](../adr/003-roadmap-renumber-090-plus.md) for rationale.

| Old step | New step |
| -------- | -------- |
| 090      | 095      |
| 091      | 096      |
| 092      | 097      |
| 093      | 098      |
| 094      | 099      |
| 095      | 100      |
| 096      | 101      |
| 097      | 102      |
| 098      | 103      |
| 099      | 104      |
| 100      | 105      |
| 101      | 106      |
| 102      | 107      |
| 103      | 108      |
| 104      | 109      |
| 105      | 111      |
| 106      | 112      |
| 107      | 113      |
| 108      | 114      |
| 109      | 115      |
| 110      | 117      |
| 111      | 118      |
| 112      | 120      |
| 113      | 121      |
| 114      | 122      |
| 115      | 123      |
| 116      | 124      |
| 117      | 125      |
| 118      | 126      |
| 119      | 128      |
| 120      | 129      |
| 121      | 130      |
| 122      | 131      |
| 123      | 132      |
| 124      | 133      |
| 125      | 134      |
| 126      | 135      |
| 127      | 136      |
| 128      | 137      |
| 129      | 138      |
| 130      | 139      |
| 131      | 140      |
| 132      | 141      |
| 133      | 142      |
| 134      | 143      |
| 135      | 144      |
| 136      | 145      |
| 137      | 147      |
| 138      | 148      |
| 139      | 149      |
| 140      | 150      |
| 141      | 151      |
| 142      | 152      |
| 143      | 153      |
| 144      | 154      |
| 145      | 155      |
| 146      | 156      |
| 147      | 157      |
| 148      | 158      |
| 149      | 159      |
| 150      | 160      |
| 151      | 161      |
| 152      | 162      |
| 153      | 163      |
| 154      | 164      |
| 155      | 165      |
| 156      | 166      |
| 157      | 167      |
| 158      | 168      |
| 159      | 169      |
| 160      | 170      |
| 161      | 171      |
| 162      | 172      |
| 163      | 173      |
| 164      | 174      |
| 165      | 177      |
| 166      | 178      |
| 167      | 179      |
| 168      | 180      |
| 169      | 181      |
| 170      | 182      |
| 171      | 183      |
| 172      | 184      |
| 173      | 185      |
| 174      | 186      |
| 175      | 187      |
| 176      | 188      |
| 177      | 189      |
| 178      | 190      |
| 179      | 191      |
| 180      | 192      |
| 181      | 193      |
| 182      | 194      |
| 183      | 195      |
| 184      | 196      |
| 185      | 197      |
| 186      | 198      |
| 187      | 199      |
| 188      | 200      |
| 189      | 201      |
| 190      | 202      |
| 191      | 203      |
| 192      | 204      |
| 193      | 205      |
| 194      | 206      |
| 195      | 207      |
| 196      | 208      |
| 197      | 209      |
| 198      | 210      |
| 199      | 211      |
| 200      | 212      |
| 201      | 213      |
| 202      | 214      |
| 203      | 215      |
| 204      | 216      |
| 205      | 217      |
| 206      | 218      |
| 207      | 219      |
| 208      | 220      |
| 209      | 221      |
| 210      | 222      |
| 211      | 223      |
| 212      | 224      |
| 213      | 225      |
| 214      | 226      |
| 215      | 227      |
| 216      | 228      |
| 217      | 229      |
| 218      | 230      |
| 219      | 231      |
| 220      | 232      |
| 221      | 233      |
| 222      | 234      |
| 223      | 235      |
| 224      | 236      |
| 225      | 237      |
| 226      | 238      |
| 227      | 239      |
| 228      | 240      |
| 229      | 241      |
| 230      | 242      |
| 231      | 243      |
| 232      | 244      |
| 233      | 245      |
| 234      | 246      |
| 235      | 247      |
| 236      | 248      |
| 237      | 249      |
| 238      | 250      |
| 239      | 251      |
| 240      | 252      |
| 241      | 253      |
| 242      | 254      |
| 243      | 255      |
| 244      | 256      |
| 245      | 257      |
| 246      | 258      |
| 247      | 259      |
| 248      | 260      |
| 249      | 261      |
| 250      | 262      |
| 251      | 263      |
| 252      | 264      |
| 253      | 266      |
| 254      | 267      |
| 255      | 268      |
| 256      | 269      |
| 257      | 270      |
| 258      | 271      |
| 259      | 272      |
| 260      | 273      |
| 261      | 274      |
| 262      | 275      |
| 263      | 276      |
| 264      | 277      |
| 265      | 278      |
| 266      | 279      |
| 267      | 280      |
| 268      | 281      |
| 269      | 282      |
| 270      | 283      |
| 271      | 284      |
| 272      | 285      |
| 273      | 286      |
| 274      | 287      |
| 275      | 288      |
| 276      | 289      |
| 277      | 290      |
| 278      | 291      |
| 279      | 292      |
| 280      | 293      |
| 281      | 294      |
| 282      | 295      |
| 283      | 296      |
| 284      | 297      |
| 285      | 298      |
| 286      | 299      |
| 287      | 300      |
| 288      | 301      |
| 289      | 302      |
| 290      | 303      |
| 291      | 304      |
| 292      | 305      |
| 293      | 306      |
| 294      | 307      |
| 295      | 308      |
| 296      | 309      |
| 297      | 310      |
| 298      | 311      |
| 299      | 312      |
| 300      | 313      |
| 301      | 314      |
| 302      | 315      |
| 303      | 316      |
| 304      | 317      |
| 305      | 318      |
| 306      | 319      |
| 307      | 320      |
| 308      | 321      |
| 309      | 322      |
| 310      | 323      |
| 311      | 325      |
| 312      | 326      |
| 313      | 327      |
| 314      | 328      |
| 315      | 329      |
| 316      | 330      |
| 317      | 331      |
| 318      | 332      |
| 319      | 333      |
| 320      | 334      |

## Completed Steps Snapshot

| Step | Lesson                                                                                                                 |
| ---- | ---------------------------------------------------------------------------------------------------------------------- |
| 001  | [lesson-001-root-npm-workspaces.md](./lessons/lesson-001-root-npm-workspaces.md)                                       |
| 002  | [lesson-002-local-setup-and-node-policy.md](./lessons/lesson-002-local-setup-and-node-policy.md)                       |
| 003  | [lesson-003-nx-init.md](./lessons/lesson-003-nx-init.md)                                                               |
| 004  | [lesson-004-nx-targets-and-inference.md](./lessons/lesson-004-nx-targets-and-inference.md)                             |
| 005  | [lesson-005-nest-apps-api-migration.md](./lessons/lesson-005-nest-apps-api-migration.md)                               |
| 006  | [lesson-006-root-tsconfig-base-and-paths.md](./lessons/lesson-006-root-tsconfig-base-and-paths.md)                     |
| 007  | [lesson-007-root-eslint-flat-config.md](./lessons/lesson-007-root-eslint-flat-config.md)                               |
| 008  | [lesson-008-root-prettier-and-editorconfig.md](./lessons/lesson-008-root-prettier-and-editorconfig.md)                 |
| 009  | [lesson-009-root-scripts-via-nx.md](./lessons/lesson-009-root-scripts-via-nx.md)                                       |
| 010  | [lesson-010-apps-web-tanstack-start.md](./lessons/lesson-010-apps-web-tanstack-start.md)                               |
| 011  | [lesson-011-web-typecheck-target.md](./lessons/lesson-011-web-typecheck-target.md)                                     |
| 012  | [lesson-012-shared-contracts-lib.md](./lessons/lesson-012-shared-contracts-lib.md)                                     |
| 013  | [lesson-013-wire-shared-contracts-api.md](./lessons/lesson-013-wire-shared-contracts-api.md)                           |
| 014  | [lesson-014-wire-shared-contracts-web.md](./lessons/lesson-014-wire-shared-contracts-web.md)                           |
| 015  | [lesson-015-cors-and-dev-origins.md](./lessons/lesson-015-cors-and-dev-origins.md)                                     |
| 016  | [lesson-016-postgres-compose-local-dev.md](./lessons/lesson-016-postgres-compose-local-dev.md)                         |
| 017  | [lesson-017-env-example-files.md](./lessons/lesson-017-env-example-files.md)                                           |
| 018  | [lesson-018-root-readme-runbook.md](./lessons/lesson-018-root-readme-runbook.md)                                       |
| 019  | [lesson-019-ci-pipeline-baseline.md](./lessons/lesson-019-ci-pipeline-baseline.md)                                     |
| 020  | [lesson-020-nx-cache-in-ci.md](./lessons/lesson-020-nx-cache-in-ci.md)                                                 |
| 021  | [lesson-021-nx-affected-flow-in-ci.md](./lessons/lesson-021-nx-affected-flow-in-ci.md)                                 |
| 022  | [lesson-022-optional-husky-lint-staged-policy.md](./lessons/lesson-022-optional-husky-lint-staged-policy.md)           |
| 023  | [lesson-023-lessons-folder-structure-conventions.md](./lessons/lesson-023-lessons-folder-structure-conventions.md)     |
| 024  | [lesson-024-release-stub-and-changelog-policy.md](./lessons/lesson-024-release-stub-and-changelog-policy.md)           |
| 025  | [lesson-025-normalize-gitignore.md](./lessons/lesson-025-normalize-gitignore.md)                                       |
| 026  | [lesson-026-optional-vscode-recommendations.md](./lessons/lesson-026-optional-vscode-recommendations.md)               |
| 027  | [lesson-027-adr-000-nx-tanstack-start.md](./lessons/lesson-027-adr-000-nx-tanstack-start.md)                           |
| 028  | [lesson-028-threat-model-stub.md](./lessons/lesson-028-threat-model-stub.md)                                           |
| 029  | [lesson-029-health-smoke-script.md](./lessons/lesson-029-health-smoke-script.md)                                       |
| 030  | [lesson-030-track-0-acceptance-checklist.md](./lessons/lesson-030-track-0-acceptance-checklist.md)                     |
| 031  | [lesson-031-ci-matrix-improvements.md](./lessons/lesson-031-ci-matrix-improvements.md)                                 |
| 032  | [lesson-032-adr-process-deviations.md](./lessons/lesson-032-adr-process-deviations.md)                                 |
| 033  | [lesson-033-nest-config-and-env-validation.md](./lessons/lesson-033-nest-config-and-env-validation.md)                 |
| 034  | [lesson-034-terminus-health-liveness.md](./lessons/lesson-034-terminus-health-liveness.md)                             |
| 035  | [lesson-035-readiness-probe-dependencies.md](./lessons/lesson-035-readiness-probe-dependencies.md)                     |
| 036  | [lesson-036-health-response-dtos.md](./lessons/lesson-036-health-response-dtos.md)                                     |
| 037  | [lesson-037-api-error-envelope-types.md](./lessons/lesson-037-api-error-envelope-types.md)                             |
| 038  | [lesson-038-global-exception-filter.md](./lessons/lesson-038-global-exception-filter.md)                               |
| 039  | [lesson-039-global-validation-pipe.md](./lessons/lesson-039-global-validation-pipe.md)                                 |
| 040  | [lesson-040-dto-validation-conventions.md](./lessons/lesson-040-dto-validation-conventions.md)                         |
| 041  | [lesson-041-problem-details-alignment.md](./lessons/lesson-041-problem-details-alignment.md)                           |
| 042  | [lesson-042-safe-unknown-errors.md](./lessons/lesson-042-safe-unknown-errors.md)                                       |
| 043  | [lesson-043-request-id-middleware.md](./lessons/lesson-043-request-id-middleware.md)                                   |
| 044  | [lesson-044-structured-logging.md](./lessons/lesson-044-structured-logging.md)                                         |
| 045  | [lesson-045-request-logging-interceptor.md](./lessons/lesson-045-request-logging-interceptor.md)                       |
| 046  | [lesson-046-correlation-id.md](./lessons/lesson-046-correlation-id.md)                                                 |
| 047  | [lesson-047-log-redaction.md](./lessons/lesson-047-log-redaction.md)                                                   |
| 048  | [lesson-048-opentelemetry-noop.md](./lessons/lesson-048-opentelemetry-noop.md)                                         |
| 049  | [lesson-049-trace-context-propagation.md](./lessons/lesson-049-trace-context-propagation.md)                           |
| 050  | [lesson-050-metrics-endpoint-stub.md](./lessons/lesson-050-metrics-endpoint-stub.md)                                   |
| 051  | [lesson-051-api-prefix-and-versioning.md](./lessons/lesson-051-api-prefix-and-versioning.md)                           |
| 052  | [lesson-052-graceful-shutdown-hooks.md](./lessons/lesson-052-graceful-shutdown-hooks.md)                               |
| 053  | [lesson-053-request-timeout-abort.md](./lessons/lesson-053-request-timeout-abort.md)                                   |
| 054  | [lesson-054-error-json-contract-tests.md](./lessons/lesson-054-error-json-contract-tests.md)                           |
| 055  | [lesson-055-track-1-acceptance-checklist.md](./lessons/lesson-055-track-1-acceptance-checklist.md)                     |
| 056  | [lesson-056-platform-observability-follow-ups.md](./lessons/lesson-056-platform-observability-follow-ups.md)           |
| 057  | [lesson-057-database-module-postgres-orm-bootstrap.md](./lessons/lesson-057-database-module-postgres-orm-bootstrap.md) |
| 058  | [lesson-058-datasource-config-database-url.md](./lessons/lesson-058-datasource-config-database-url.md)                 |
| 059  | [lesson-059-migration-workflow-baseline-schema.md](./lessons/lesson-059-migration-workflow-baseline-schema.md)         |
| 060  | [lesson-060-user-entity-indexes.md](./lessons/lesson-060-user-entity-indexes.md)                                       |
| 061  | [lesson-061-password-hasher-service.md](./lessons/lesson-061-password-hasher-service.md)                               |
| 062  | [lesson-062-user-service-create-find-by-email.md](./lessons/lesson-062-user-service-create-find-by-email.md)           |
| 063  | [lesson-063-auth-register-dto.md](./lessons/lesson-063-auth-register-dto.md)                                           |
| 064  | [lesson-064-unique-email-friendly-conflict.md](./lessons/lesson-064-unique-email-friendly-conflict.md)                 |
| 065  | [lesson-065-auth-login.md](./lessons/lesson-065-auth-login.md)                                                         |
| 066  | [lesson-066-jwt-access-token-service.md](./lessons/lesson-066-jwt-access-token-service.md)                             |
| 067  | [lesson-067-jwt-strategy-auth-guard.md](./lessons/lesson-067-jwt-strategy-auth-guard.md)                               |
| 068  | [lesson-068-current-user-decorator.md](./lessons/lesson-068-current-user-decorator.md)                                 |
| 069  | [lesson-069-refresh-token-entity-persistence.md](./lessons/lesson-069-refresh-token-entity-persistence.md)             |
| 070  | [lesson-070-auth-refresh-rotation.md](./lessons/lesson-070-auth-refresh-rotation.md)                                   |
| 071  | [lesson-071-auth-logout-revoke-refresh.md](./lessons/lesson-071-auth-logout-revoke-refresh.md)                         |
| 072  | [lesson-072-auth-refresh-reuse-detection.md](./lessons/lesson-072-auth-refresh-reuse-detection.md)                     |
| 073  | [lesson-073-token-ttl-configuration.md](./lessons/lesson-073-token-ttl-configuration.md)                               |
| 074  | [lesson-074-login-brute-force-lockout.md](./lessons/lesson-074-login-brute-force-lockout.md)                           |
| 075  | [lesson-075-email-verification-token-model.md](./lessons/lesson-075-email-verification-token-model.md)                 |
| 076  | [lesson-076-auth-verify-email.md](./lessons/lesson-076-auth-verify-email.md)                                           |
| 077  | [lesson-077-password-reset-request-flow.md](./lessons/lesson-077-password-reset-request-flow.md)                       |
| 078  | [lesson-078-password-reset-completion.md](./lessons/lesson-078-password-reset-completion.md)                           |
| 079  | [lesson-079-roles-permissions-schema.md](./lessons/lesson-079-roles-permissions-schema.md)                             |
| 080  | [lesson-080-seed-default-roles.md](./lessons/lesson-080-seed-default-roles.md)                                         |
| 081  | [lesson-081-roles-guard.md](./lessons/lesson-081-roles-guard.md)                                                       |
| 082  | [lesson-082-permissions-guard.md](./lessons/lesson-082-permissions-guard.md)                                           |
| 083  | [lesson-083-sample-cms-route-rbac.md](./lessons/lesson-083-sample-cms-route-rbac.md)                                   |
| 084  | [lesson-084-jwt-payload-shared-contracts.md](./lessons/lesson-084-jwt-payload-shared-contracts.md)                     |
| 085  | [lesson-085-auth-register-login-e2e-flow.md](./lessons/lesson-085-auth-register-login-e2e-flow.md)                     |
| 086  | [lesson-086-auth-refresh-rotation-e2e-flow.md](./lessons/lesson-086-auth-refresh-rotation-e2e-flow.md)                 |
| 087  | [lesson-087-auth-rbac-forbidden-e2e-flow.md](./lessons/lesson-087-auth-rbac-forbidden-e2e-flow.md)                     |
| 088  | [lesson-088-security-audit-log-table.md](./lessons/lesson-088-security-audit-log-table.md)                             |
| 089  | [lesson-089-audit-events-auth-mutations.md](./lessons/lesson-089-audit-events-auth-mutations.md)                       |
| 090  | [lesson-090-email-channel.md](./lessons/lesson-090-email-channel.md)                                                   |
| 091  | [lesson-091-auth-sensitive-rate-limits.md](./lessons/lesson-091-auth-sensitive-rate-limits.md)                         |
| 092  | [lesson-092-api-security-baseline.md](./lessons/lesson-092-api-security-baseline.md)                                   |
| 093  | [lesson-093-require-email-verified-policy.md](./lessons/lesson-093-require-email-verified-policy.md)                   |
| 094  | [lesson-094-openapi-swagger.md](./lessons/lesson-094-openapi-swagger.md)                                               |
| 095  | [lesson-095-session-device-metadata.md](./lessons/lesson-095-session-device-metadata.md)                               |
| 096  | [lesson-096-auth-error-envelope.md](./lessons/lesson-096-auth-error-envelope.md)                                       |
| 097  | [lesson-097-service-api-key-auth-stub.md](./lessons/lesson-097-service-api-key-auth-stub.md)                           |
| 098  | [lesson-098-oauth-social-login-deferred-adr.md](./lessons/lesson-098-oauth-social-login-deferred-adr.md)               |

Entry point: [LOCAL_SETUP.md](./LOCAL_SETUP.md)
