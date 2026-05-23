# Development Roadmap: Fullstack Blog/CMS (NestJS + TanStack Start + Nx)

This document is the master implementation roadmap for this repository.
Every step is a sprint and must produce code changes + a lesson file in `docs/lessons/`, and **sync all documentation indexes** including [`docs/storytelling.md`](./storytelling.md) (see [lesson-authoring-guide.md](./lesson-authoring-guide.md#documentation-sync-checklist) and [`.cursor/rules/documentation-sync.mdc`](../.cursor/rules/documentation-sync.mdc)).

## Target System

- Backend: NestJS API (auth, RBAC, CMS, moderation, validation, errors, observability)
- Frontend public: TanStack Start (SSR/SEO, post list, post page, metadata)
- Frontend admin: TanStack Start (editor studio, drafts, preview, publish)
- Monorepo: Nx (`apps/*`, `libs/*`, shared quality gates)

## Baseline Status

| Area                                                    | Status                                     |
| ------------------------------------------------------- | ------------------------------------------ |
| Track 2 (Auth and identity)                             | Steps 057–088 completed; next: 089         |
| NestJS app                                              | Exists in `apps/api/` (package name `api`) |
| Root workspace                                          | Step 001 completed                         |
| Node/npm policy                                         | Step 002 completed                         |
| Nx init                                                 | Step 003 completed                         |
| Nx target defaults                                      | Step 004 completed                         |
| Nest in apps/api                                        | Step 005 completed                         |
| Root tsconfig base + paths                              | Step 006 completed                         |
| Root ESLint flat config                                 | Step 007 completed                         |
| Root Prettier + EditorConfig                            | Step 008 completed                         |
| Root scripts via Nx (build/test/lint)                   | Step 009 completed                         |
| TanStack Start app in `apps/web`                        | Step 010 completed                         |
| `web:typecheck` Nx target                               | Step 011 completed                         |
| `libs/shared-contracts`                                 | Step 012 completed                         |
| Wire shared-contracts into API                          | Step 013 completed                         |
| Wire shared-contracts into web                          | Step 014 completed                         |
| CORS + dev origins                                      | Step 015 completed                         |
| Local infra: Postgres compose                           | Step 016 completed                         |
| `.env.example` files                                    | Step 017 completed                         |
| Root README + API/web runbook                           | Step 018 completed                         |
| CI pipeline baseline (GitHub Actions)                   | Step 019 completed                         |
| Nx cache in CI                                          | Step 020 completed                         |
| Nx affected flow in CI                                  | Step 021 completed                         |
| Optional husky/lint-staged policy                       | Step 022 completed                         |
| Lessons folder structure conventions                    | Step 023 completed                         |
| Release stub and changelog policy                       | Step 024 completed                         |
| Normalize `.gitignore`                                  | Step 025 completed                         |
| Optional VS Code recommendations                        | Step 026 completed                         |
| ADR-000 (Nx + TanStack Start)                           | Step 027 completed                         |
| Threat model stub                                       | Step 028 completed                         |
| Health smoke script                                     | Step 029 completed                         |
| Track 0 acceptance checklist                            | Step 030 completed                         |
| CI matrix improvements (reserve)                        | Step 031 completed                         |
| ADR process for deviations (reserve)                    | Step 032 completed                         |
| Config module + env validation (Zod)                    | Step 033 completed                         |
| Terminus `/health` liveness                             | Step 034 completed                         |
| Readiness probe `/health/ready`                         | Step 035 completed                         |
| Health response DTOs (shared-contracts)                 | Step 036 completed                         |
| API error envelope types (shared-contracts)             | Step 037 completed                         |
| Global exception filter + HTTP error mapping            | Step 038 completed                         |
| Global ValidationPipe (whitelist, transform)            | Step 039 completed                         |
| DTO validation conventions + sample resource            | Step 040 completed                         |
| Problem Details (`problem+json`) alignment              | Step 041 completed                         |
| Safe unknown errors (no stack leak)                     | Step 042 completed                         |
| Request ID middleware + ALS context                     | Step 043 completed                         |
| Structured logging (nestjs-pino)                        | Step 044 completed                         |
| Request logging interceptor                             | Step 045 completed                         |
| Correlation ID in response headers                      | Step 046 completed                         |
| Redact sensitive fields in logs                         | Step 047 completed                         |
| OpenTelemetry noop tracer provider                      | Step 048 completed                         |
| Trace context propagation (W3C)                         | Step 049 completed                         |
| Prometheus `/metrics` stub                              | Step 050 completed                         |
| Global API prefix + URI versioning (`/api/v1`)          | Step 051 completed                         |
| Graceful shutdown hooks (SIGTERM)                       | Step 052 completed                         |
| Request timeout / abort + shutdown grace                | Step 053 completed                         |
| Contract tests for error JSON shape                     | Step 054 completed                         |
| Track 1 acceptance checklist                            | Step 055 completed                         |
| Platform observability follow-ups (OTLP, logs, metrics) | Step 056 completed                         |
| Database module (Postgres + TypeORM bootstrap)          | Step 057 completed                         |
| Datasource config from validated env (`DATABASE_URL`)   | Step 058 completed                         |
| Migration workflow + baseline schema                    | Step 059 completed                         |
| `User` entity + indexes (`users` table)                 | Step 060 completed                         |
| Password hasher service (Argon2id)                      | Step 061 completed                         |
| `UserService` create/find by email                      | Step 062 completed                         |
| `POST /auth/register` + DTO                             | Step 063 completed                         |
| Unique email + friendly CONFLICT on register            | Step 064 completed                         |
| `POST /auth/login` with credential verification         | Step 065 completed                         |
| JWT access token issuance + verify service              | Step 066 completed                         |
| `JwtStrategy` + `AuthGuard`                             | Step 067 completed                         |
| `@CurrentUser()` decorator                              | Step 068 completed                         |
| Refresh token entity + persistence                      | Step 069 completed                         |
| `POST /auth/refresh` + rotation semantics               | Step 070 completed                         |
| `POST /auth/logout` + revoke refresh                    | Step 071 completed                         |
| Refresh token reuse detection policy                    | Step 072 completed                         |
| Token TTL configuration + documentation                 | Step 073 completed                         |
| Login brute-force throttle / basic lockout              | Step 074 completed                         |
| Email verification token model                          | Step 075 completed                         |
| `POST /auth/verify-email`                               | Step 076 completed                         |
| Password reset request flow                             | Step 077 completed                         |
| Password reset completion                               | Step 078 completed                         |
| Roles + permissions schema (tables/enums)               | Step 079 completed                         |
| Seed default roles (admin, editor, viewer)              | Step 080 completed                         |
| `RolesGuard` + `@Roles()`                               | Step 081 completed                         |
| Fine-grained `PermissionsGuard` + constants             | Step 082 completed                         |
| Sample CMS route protected by RBAC                      | Step 083 completed                         |
| JWT payload shape in `shared-contracts`                 | Step 084 completed                         |
| Auth e2e: register → login happy path                   | Step 085 completed                         |
| Auth e2e: refresh rotation                              | Step 086 completed                         |
| Auth e2e: RBAC forbidden cases                          | Step 087 completed                         |
| Security audit log table                                | Step 088 completed                         |

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

## Track 2 Detailed Steps (057-104)

| Step | Title                                                 | Verify                                 |
| ---- | ----------------------------------------------------- | -------------------------------------- |
| 057  | Database module: Postgres + ORM bootstrap             | `nx run api:build` — done              |
| 058  | Datasource config from validated env (`DATABASE_URL`) | `nx run api:test` — done               |
| 059  | Migration workflow + baseline schema                  | migrate up/down smoke — done           |
| 060  | `User` entity + indexes                               | `nx run api:test` — done               |
| 061  | Password hasher service (argon2 or bcrypt)            | unit test — done                       |
| 062  | `UserService` create/find by email                    | unit test — done                       |
| 063  | `POST /auth/register` + DTO                           | e2e — done                             |
| 064  | Unique email constraint + friendly error mapping      | e2e — done                             |
| 065  | `POST /auth/login`                                    | e2e — done                             |
| 066  | JWT access token issuance + verify service            | unit test — done                       |
| 067  | `JwtStrategy` + `AuthGuard`                           | e2e — done                             |
| 068  | `@CurrentUser()` decorator                            | unit test — done                       |
| 069  | Refresh token entity + persistence                    | migration — done                       |
| 070  | `POST /auth/refresh` + rotation semantics             | e2e — done                             |
| 071  | `POST /auth/logout` + revoke refresh                  | e2e — done                             |
| 072  | Refresh token reuse detection policy                  | unit/e2e — done                        |
| 073  | Token TTL configuration + documentation               | docs check — done                      |
| 074  | Login brute-force throttle / basic lockout            | e2e — done                             |
| 075  | Email verification token model (optional minimal)     | unit test — done                       |
| 076  | `POST /auth/verify-email`                             | e2e — done                             |
| 077  | Password reset request flow                           | e2e — done                             |
| 078  | Password reset completion                             | e2e — done                             |
| 079  | Roles + permissions schema (tables/enums)             | migration — done                       |
| 080  | Seed default roles (admin, editor, viewer)            | seed script — done                     |
| 081  | `RolesGuard` + `@Roles()`                             | e2e — done                             |
| 082  | Fine-grained `PermissionsGuard` + constants           | e2e — done                             |
| 083  | Sample CMS route protected by RBAC                    | e2e forbidden case — done              |
| 084  | JWT payload shape documented in `shared-contracts`    | `nx run shared-contracts:build` — done |
| 085  | Auth e2e: register → login happy path                 | e2e — done                             |
| 086  | Auth e2e: refresh rotation                            | e2e — done                             |
| 087  | Auth e2e: RBAC forbidden cases                        | e2e — done                             |
| 088  | Security audit log table                              | migration — done                       |
| 089  | Audit events for auth mutations                       | unit test                              |
| 090  | Session/device metadata (optional minimal)            | docs + unit                            |
| 091  | Map auth failures to API error envelope               | contract test                          |
| 092  | Service/API key auth stub (optional)                  | unit test                              |
| 093  | OAuth/social login deferred ADR                       | ADR file                               |
| 094  | MFA roadmap note + threat model touch-up              | markdown review                        |
| 095  | Account recovery edge-case tests                      | `nx run api:test`                      |
| 096  | Password rotation policy (optional)                   | policy doc                             |
| 097  | User soft-delete / anonymization stub                 | migration + unit                       |
| 098  | Auth integration test matrix doc                      | docs check                             |
| 099  | Cross-service auth header conventions                 | ADR snippet                            |
| 100  | Token rotation observability hook (counter/log)       | manual verify                          |
| 101  | Auth module README + operator runbook                 | review                                 |
| 102  | Track 2 acceptance checklist                          | all DoD items                          |
| 103  | Reserve: OIDC / SSO integration spike                 | spike doc                              |
| 104  | Reserve: WebAuthn / passkeys spike                    | spike doc                              |

## Track 3 Detailed Steps (105-164)

| Step | Title                                        | Verify             |
| ---- | -------------------------------------------- | ------------------ |
| 105  | `Post` entity + lifecycle enum + migration   | migrate smoke      |
| 106  | Slug field + unique index strategy           | DB constraint test |
| 107  | `PostService`: create draft                  | unit test          |
| 108  | Author ownership rules (`authorId`)          | unit/e2e           |
| 109  | `PATCH` draft fields validation              | e2e                |
| 110  | Publish rules: required fields checklist     | unit test          |
| 111  | Publish transition + `publishedAt`           | e2e                |
| 112  | Unpublish + state machine tests              | e2e                |
| 113  | SEO title/description columns                | migration          |
| 114  | Open Graph / Twitter card fields             | migration          |
| 115  | Canonical URL + redirect policy              | unit test          |
| 116  | `shared-contracts`: `PublicPostSummary`      | build              |
| 117  | `shared-contracts`: `PublicPostDetail`       | build              |
| 118  | `shared-contracts`: admin post write payload | build              |
| 119  | List published posts query (pagination)      | e2e                |
| 120  | Get public post by slug                      | e2e                |
| 121  | `Tag` entity + migration                     | migrate smoke      |
| 122  | Post–tag many-to-many                        | unit test          |
| 123  | `Category` entity (+ optional hierarchy)     | migrate smoke      |
| 124  | Post–category relation                       | unit test          |
| 125  | Admin list posts with tag/category filters   | e2e                |
| 126  | Public posts-by-tag contract                 | e2e                |
| 127  | Tag slug uniqueness                          | DB test            |
| 128  | Bulk add/remove tags endpoints               | e2e                |
| 129  | `Comment` entity + migration                 | migrate smoke      |
| 130  | Comment threading (`parentId`)               | unit test          |
| 131  | `POST` public comment (pending moderation)   | e2e                |
| 132  | Admin moderation queue list                  | e2e                |
| 133  | Approve comment action                       | e2e                |
| 134  | Reject/delete comment action                 | e2e                |
| 135  | Moderation audit log entries                 | unit test          |
| 136  | Comment anti-spam: throttle + honeypot field | e2e                |
| 137  | Featured media fields on post                | migration          |
| 138  | Attachment metadata table stub               | migration          |
| 139  | HTML/Markdown sanitization pipeline          | XSS unit tests     |
| 140  | XSS regression tests for user content        | `nx run api:test`  |
| 141  | Reading time / word-count utility            | unit test          |
| 142  | RSS/Atom XML public endpoint                 | curl               |
| 143  | Related posts by shared tags                 | unit test          |
| 144  | Internal sitemap data provider service       | unit test          |
| 145  | Revision snapshots on publish                | e2e                |
| 146  | Admin diff between two revisions             | e2e                |
| 147  | Preview token model + TTL                    | unit test          |
| 148  | Preview token middleware (scope-limited)     | e2e                |
| 149  | Scheduled publish fields + worker stub       | docs + unit        |
| 150  | Soft-delete posts + trash list (admin)       | e2e                |
| 151  | Restore post from trash                      | e2e                |
| 152  | Hard delete (admin-only) + cascade rules     | e2e                |
| 153  | Search phase 1 (ILIKE / simple query)        | e2e                |
| 154  | Search-supporting index migration            | explain smoke      |
| 155  | Import post JSON validation stub             | unit test          |
| 156  | Export post JSON stub endpoint               | curl               |
| 157  | Co-authors relation (optional)               | migration          |
| 158  | Report comment endpoint                      | e2e                |
| 159  | Block user moderation endpoint               | e2e                |
| 160  | Newsletter subscribe API stub                | e2e                |
| 161  | CMS contract tests ↔ `shared-contracts`      | `nx run api:test`  |
| 162  | List/detail query performance guidelines     | docs review        |
| 163  | Track 3 acceptance checklist                 | all DoD items      |
| 164  | Reserve: CMS extensions ADR                  | ADR file           |

## Track 4 Detailed Steps (165-200)

| Step | Title                                                      | Verify                        |
| ---- | ---------------------------------------------------------- | ----------------------------- |
| 165  | Public route tree scaffold (`/`, `/posts`)                 | `nx run web:build`            |
| 166  | Post list route + layout                                   | `nx run web:typecheck`        |
| 167  | Server loader: fetch published posts page                  | manual SSR check              |
| 168  | Post card component + accessibility pass                   | RTL smoke optional            |
| 169  | Post detail route `/posts/$slug`                           | `nx run web:build`            |
| 170  | Loader: fetch post by slug + 404 mapping                   | manual                        |
| 171  | Shared typography / prose styles for content               | visual review                 |
| 172  | `<title>` + description meta from loader                   | view-source check             |
| 173  | Open Graph meta component                                  | social debugger               |
| 174  | Twitter card meta helper                                   | view-source check             |
| 175  | Canonical `<link rel="canonical">` strategy                | view-source check             |
| 176  | `robots.txt` route                                         | curl                          |
| 177  | `sitemap.xml` generation route                             | curl                          |
| 178  | Pagination UI + URL state                                  | manual                        |
| 179  | Tag filter page `/tags/$slug`                              | manual                        |
| 180  | Category archive route (optional)                          | manual                        |
| 181  | Search page `/search?q=`                                   | manual                        |
| 182  | Empty-state UX for list/search                             | visual review                 |
| 183  | Error boundary mapped to API error envelope                | manual                        |
| 184  | JSON-LD `<script type="application/ld+json">` for articles | validator                     |
| 185  | RSS `<link rel="alternate">` in layout                     | view-source check             |
| 186  | Image `width`/`height` + lazy loading                      | Lighthouse note               |
| 187  | Loading skeletons for list/detail                          | visual review                 |
| 188  | Consume cache headers from API where applicable            | docs + manual                 |
| 189  | Data caching policy doc (TanStack Query / loaders)         | docs check                    |
| 190  | Playwright e2e: list + detail smoke                        | `nx run web:e2e` (if present) |
| 191  | Lighthouse performance budget doc                          | markdown                      |
| 192  | Optional: Lighthouse CI hook                               | green CI                      |
| 193  | Track 4 acceptance checklist                               | all DoD items                 |
| 194  | Reserve: i18n routing                                      | ADR/spike                     |
| 195  | Reserve: AMP or alternate representation                   | ADR                           |
| 196  | Reserve: CDN / edge caching notes                          | ADR                           |
| 197  | Reserve: read-only comments embed                          | spike doc                     |
| 198  | Reserve: public analytics hook                             | ADR                           |
| 199  | Reserve: theme + a11y polish                               | checklist                     |
| 200  | Reserve: CSP for third-party embeds                        | ADR                           |

## Track 5 Detailed Steps (201-252)

| Step | Title                                          | Verify             |
| ---- | ---------------------------------------------- | ------------------ |
| 201  | Admin shell layout + navigation                | `nx run web:build` |
| 202  | Auth gate for `/admin/*` routes                | e2e                |
| 203  | Admin login page + token storage policy        | e2e                |
| 204  | Silent refresh on navigation                   | manual             |
| 205  | Dashboard home (metrics stubs)                 | visual             |
| 206  | Admin posts table + server loader              | manual             |
| 207  | “New post” flow entry                          | e2e                |
| 208  | Draft editor layout (two-column)               | visual             |
| 209  | Editor stack ADR (MDX vs rich text)            | ADR file           |
| 210  | Autosave debounce → `PATCH` draft              | e2e                |
| 211  | Autosave status indicator                      | visual             |
| 212  | Optimistic concurrency / conflict UI           | e2e                |
| 213  | Preview panel (iframe or embedded)             | manual             |
| 214  | Preview route `/admin/posts/:id/preview`       | e2e                |
| 215  | Publish dialog + confirmation                  | e2e                |
| 216  | Inline validation for publish requirements     | e2e                |
| 217  | Unpublish action                               | e2e                |
| 218  | Tags editor (multi-select)                     | manual             |
| 219  | Categories editor (tree optional)              | manual             |
| 220  | Featured image picker UI stub                  | manual             |
| 221  | Media library modal stub                       | manual             |
| 222  | SEO fields form section                        | manual             |
| 223  | Slug field + availability check API            | e2e                |
| 224  | Comments moderation queue page                 | e2e                |
| 225  | Bulk moderation actions                        | e2e                |
| 226  | Role-based navigation visibility               | e2e                |
| 227  | Admin-specific 403/404 pages                   | manual             |
| 228  | Toast mapping from API errors                  | manual             |
| 229  | Editor keyboard shortcuts (optional)           | docs               |
| 230  | Draft list filters + pagination                | e2e                |
| 231  | Trash management UI                            | e2e                |
| 232  | Revision timeline UI                           | manual             |
| 233  | Revision diff view                             | manual             |
| 234  | Restore revision action                        | e2e                |
| 235  | Scheduled publish datetime control             | e2e                |
| 236  | Co-authors selector (optional)                 | manual             |
| 237  | Audit log viewer stub                          | manual             |
| 238  | Admin site settings stub page                  | manual             |
| 239  | Admin e2e: login → create draft                | e2e                |
| 240  | Admin e2e: publish happy path                  | e2e                |
| 241  | Admin accessibility checklist                  | manual audit       |
| 242  | Track 5 acceptance checklist                   | all DoD items      |
| 243  | Reserve: collaborative editing research        | doc                |
| 244  | Reserve: plugins/extensions architecture       | ADR                |
| 245  | Reserve: admin dark mode tokens                | design doc         |
| 246  | Reserve: admin i18n                            | ADR                |
| 247  | Reserve: MDX vs WYSIWYG toggle                 | spike              |
| 248  | Reserve: image CDN integration                 | ADR                |
| 249  | Reserve: editor performance profiling          | notes              |
| 250  | Reserve: mobile read-only admin                | spike              |
| 251  | Reserve: staging/preview environments workflow | runbook            |
| 252  | Reserve: SaaS billing gate variant             | ADR                |

## Track 6 Detailed Steps (253-278)

| Step | Title                                         | Verify              |
| ---- | --------------------------------------------- | ------------------- |
| 253  | DB index review for posts/slugs/tags/comments | migration review    |
| 254  | Capture `EXPLAIN (ANALYZE)` baselines doc     | SQL artifact        |
| 255  | Remove N+1 on post list queries               | `nx run api:test`   |
| 256  | Optimize comment thread reads                 | explain smoke       |
| 257  | Connection pool tuning notes                  | docs                |
| 258  | Read replica ADR (optional stub)              | ADR                 |
| 259  | Add Redis service to local compose            | `docker compose up` |
| 260  | Redis cache module in API                     | unit test           |
| 261  | Cache-aside: public post by slug              | e2e                 |
| 262  | Invalidate cache on publish/unpublish/delete  | e2e                 |
| 263  | Align HTTP cache headers API → web consumers  | manual              |
| 264  | Surrogate key / tag invalidation design note  | ADR                 |
| 265  | Query timeouts + circuit breaker stub         | unit test           |
| 266  | Keyset vs offset pagination ADR               | ADR                 |
| 267  | Materialized view for tag counts (optional)   | migration           |
| 268  | Background job queue stub (optional BullMQ)   | smoke               |
| 269  | Warm-cache hook on deploy (optional)          | script              |
| 270  | Measure Web Vitals on public home             | RUM note            |
| 271  | Performance budget thresholds (doc)           | markdown            |
| 272  | Optional k6 load smoke script                 | local run           |
| 273  | Track 6 acceptance checklist                  | all DoD items       |
| 274  | Reserve: sharding notes                       | ADR                 |
| 275  | Reserve: cold storage / archives              | ADR                 |
| 276  | Reserve: image processing pipeline            | ADR                 |
| 277  | Reserve: query fan-out guardrails             | doc                 |
| 278  | Reserve: autoscaling signals                  | doc                 |

## Track 7 Detailed Steps (279-302)

| Step | Title                                            | Verify          |
| ---- | ------------------------------------------------ | --------------- |
| 279  | Global HTTP rate limiting (by IP)                | e2e             |
| 280  | Stricter throttles on `/auth/*`                  | e2e             |
| 281  | Security headers baseline (Helmet or equivalent) | header scan     |
| 282  | Production CORS tightening review                | checklist       |
| 283  | Content-Security-Policy baseline for `web`       | browser console |
| 284  | HSTS + secure cookie policy doc                  | docs            |
| 285  | SSRF protections for outbound hooks              | unit test       |
| 286  | CSRF strategy for cookie-based sessions          | ADR             |
| 287  | Secrets scanning in CI (optional gitleaks)       | green CI        |
| 288  | Dependency update policy + `npm audit` gate      | policy doc      |
| 289  | Optional SAST / CodeQL workflow                  | green CI        |
| 290  | Penetration test checklist → threat model        | markdown        |
| 291  | Kubernetes-style liveness/readiness finalization | curl probes     |
| 292  | Degraded mode when Redis unavailable             | e2e/manual      |
| 293  | Security-denied structured logs                  | log review      |
| 294  | Alerting skeleton (e.g. Slack webhook stub)      | manual          |
| 295  | API latency SLO definitions                      | doc             |
| 296  | Synthetic uptime check script                    | cron-ready      |
| 297  | Track 7 acceptance checklist                     | all DoD items   |
| 298  | Reserve: WAF integration notes                   | ADR             |
| 299  | Reserve: mTLS for internal services              | ADR             |
| 300  | Reserve: KMS / envelope encryption               | ADR             |
| 301  | Reserve: SOC2 control mapping stub               | doc             |
| 302  | Reserve: incident response drill runbook         | doc             |

## Track 8 Detailed Steps (303-320)

| Step | Title                                               | Verify           |
| ---- | --------------------------------------------------- | ---------------- |
| 303  | Multi-stage `Dockerfile` for `api`                  | `docker build`   |
| 304  | Multi-stage `Dockerfile` for `web` (SSR)            | `docker build`   |
| 305  | Production-like `docker compose` stack              | compose up smoke |
| 306  | Container image scanning in CI (optional Trivy)     | green CI         |
| 307  | Deploy workflow skeleton (GitHub Actions)           | dry run          |
| 308  | Environment promotion doc (dev/stage/prod)          | review           |
| 309  | Release versioning + changelog gate                 | tag policy       |
| 310  | DB migrations in deploy sequence                    | runbook          |
| 311  | Documented rollback procedure                       | drill note       |
| 312  | Observability stack compose (logs/metrics optional) | compose smoke    |
| 313  | Capstone: architecture review checklist             | review meeting   |
| 314  | Capstone: threat model refresh                      | markdown         |
| 315  | Production one-page runbook                         | doc              |
| 316  | Reserve: Kubernetes manifests stub                  | YAML lint        |
| 317  | Reserve: Terraform module stub                      | fmt/validate     |
| 318  | Reserve: blue/green deployment                      | ADR              |
| 319  | Reserve: secrets manager integration                | ADR              |
| 320  | Reserve: cost/usage observability dashboard         | doc              |

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

Entry point: [LOCAL_SETUP.md](./LOCAL_SETUP.md)
