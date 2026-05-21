# Local Setup

This file is the local setup entry point after steps 001-009.

## Toolchain

- Node.js: recommended `22.14.0` (see `.nvmrc`, `.node-version`)
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

### Formatting (Prettier)

With the recommended [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) installed, workspace [`.vscode/settings.json`](../.vscode/settings.json) formats the current file on **save** using the root [`.prettierrc`](../.prettierrc) (same rules as CI).

- **On save:** Prettier runs for the file you edited (lessons in `docs/`, API, web, config).
- **`npm run format`:** optional batch pass over the full path list in [`package.json`](../package.json) — use after edits outside the editor or to refresh the whole repo.
- **`npm run format:check`:** read-only check (same as CI); run before push if you skipped the editor.

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

The API reads environment variables at bootstrap. [`@nestjs/config`](https://docs.nestjs.com/techniques/configuration) loads the first existing file from [`resolveEnvFilePaths()`](../apps/api/src/config/env-file-paths.ts) (repo root or `apps/api` working directory), then validates the subset that matches [`.env.example`](../.env.example) using Zod in [`apps/api/src/config/env.schema.ts`](../apps/api/src/config/env.schema.ts).

| Variable       | Default                 | Purpose                                                                                                                                                                         |
| -------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`         | `4000`                  | Initial port for the NestJS API. If busy, it auto-increments up to 20 times.                                                                                                    |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated whitelist of allowed origins. Use `*` (alone or with others) to reflect any origin. **Note:** combining `*` with `credentials: true` will be banned in Track 2. |

### `.env.example` files

Шаблоны переменных окружения коммитятся в репозиторий, реальные значения — нет (`.env` уже в [`.gitignore`](../.gitignore) и [`apps/web/.gitignore`](../apps/web/.gitignore)).

| File                                                | Назначение                                                                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [`.env.example`](../.env.example) (корень)          | API (`PORT`, `CORS_ORIGINS`) + Postgres compose (`POSTGRES_USER/PASSWORD/DB/PORT`). Загрузка через `ConfigModule` и Docker Compose. |
| [`apps/web/.env.example`](../apps/web/.env.example) | TanStack Start / Vite. Stub без активных ключей; документирует namespace `VITE_PUBLIC_*` (client) vs server-only.                   |

Первый запуск:

```bash
cp .env.example .env                     # backend + infra
cp apps/web/.env.example apps/web/.env   # web (пока без активных ключей)
```

Значения в шаблонах совпадают с дефолтами в коде и [`docker-compose.yml`](../docker-compose.yml), поэтому `cp` даёт работоспособную конфигурацию без правок. Любое расхождение `.env.example` со списком `process.env.*`, читаемых кодом, — это баг шаблона; смотри [`docs/lessons/lesson-017-env-example-files.md`](./lessons/lesson-017-env-example-files.md).

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

## Local infrastructure (PostgreSQL)

Локальная БД поднимается в Docker через [`docker-compose.yml`](../docker-compose.yml) (сервис `db`, образ `postgres:16-alpine`, healthcheck `pg_isready`, named volume `blog_pgdata`, bind на `127.0.0.1:5432`).

Пререквизит: Docker Engine 24+ (или Docker Desktop) с compose v2 — проверить через `docker compose version`.

Команды (с корня репо):

```bash
npm run db:up          # запустить БД в фоне (docker compose up -d db)
npm run db:logs        # хвост логов сервиса db
npm run db:psql        # интерактивный psql внутри контейнера
npm run db:down        # остановить контейнер; volume сохраняется
npm run db:reset       # остановить и удалить volume (полный сброс)
```

Переменные (дефолты прописаны прямо в [`docker-compose.yml`](../docker-compose.yml) через `${VAR:-default}` — `npm run db:up` работает «из коробки» без `.env`):

| Variable            | Default                            | Назначение                                   |
| ------------------- | ---------------------------------- | -------------------------------------------- |
| `POSTGRES_USER`     | `blog`                             | Имя суперпользователя БД                     |
| `POSTGRES_PASSWORD` | `blog`                             | Пароль суперпользователя (dev-only)          |
| `POSTGRES_DB`       | `blog_dev`                         | База, создаваемая при первом запуске         |
| `POSTGRES_PORT`     | `5432`                             | Host-side порт mapping'а                     |
| `POSTGRES_HOST`     | `127.0.0.1`                        | Host для API readiness (loopback)            |
| `DATABASE_URL`      | (built from `POSTGRES_*` if unset) | TypeORM connection string (`postgresql://…`) |

Переопределить значения можно через переменные окружения сессии или через **корневой** `.env` (тот же файл, что подхватывает API) — Docker Compose автоматически читает `.env` из `cwd`. Канонический список ключей лежит в [`.env.example`](../.env.example).

Quick smoke (после `npm run db:up`):

```bash
docker compose ps                                # ожидаем Status: healthy
docker compose exec db pg_isready -U blog        # accepting connections
npm run db:psql -- -c "select version();"        # PostgreSQL 16.x
```

## Database migrations (step 059)

TypeORM migrations run via CLI (not on Nest bootstrap). Same `DATABASE_URL` as runtime ORM ([lesson-059](./lessons/lesson-059-migration-workflow-baseline-schema.md)).

```bash
npm run db:up
npm run db:migrate              # apply pending migrations
npm run db:migrate:show         # list applied/pending
npm run db:migrate:revert       # undo last migration
npm run db:migrate:smoke        # up → show → revert → up (local smoke)
```

If smoke fails on a dirty DB: `npm run db:reset`, then `npm run db:up` again. Migrations are **not** part of `npm run ci` (no Postgres in GitHub Actions yet).

## RBAC role seed (step 080)

After migrations that create `roles` (step 079), seed default roles (`admin`, `editor`, `viewer`). Idempotent — safe to re-run ([lesson-080](./lessons/lesson-080-seed-default-roles.md)).

```bash
npm run db:migrate
npm run db:seed:roles           # inserted=3 skipped=0 on empty table
npm run db:seed:roles           # inserted=0 skipped=3 on repeat
npm run db:psql -- -c "SELECT slug, name FROM roles ORDER BY slug;"
```

## Optional: OpenTelemetry OTLP export (step 056)

По умолчанию API создаёт spans in-process (`OTEL_TRACES_EXPORTER=none`) — CI и локальный dev без collector. Чтобы отправлять traces в Jaeger:

```bash
docker run --rm -p 16686:16686 -p 4318:4318 jaegertracing/all-in-one:latest
```

В корневом `.env`:

```env
OTEL_TRACES_EXPORTER=otlp
OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318/v1/traces
```

Запустить API (`npm run start:dev`), сделать несколько запросов к `http://127.0.0.1:4000/api/v1`, открыть UI Jaeger: http://localhost:16686 (service `api`). Подробнее — [lesson-056](./lessons/lesson-056-platform-observability-follow-ups.md), [ADR-002](./adr/002-platform-observability.md).

## Next roadmap step

**Track 1 — Platform Core** (033–056) закрыт. **Track 2:** **057** (TypeORM) — [lesson-057](./lessons/lesson-057-database-module-postgres-orm-bootstrap.md); **058** (`DATABASE_URL`) — [lesson-058](./lessons/lesson-058-datasource-config-database-url.md); **059** (migrations) — [lesson-059](./lessons/lesson-059-migration-workflow-baseline-schema.md); **060** (`User` + `users` migration) — [lesson-060](./lessons/lesson-060-user-entity-indexes.md); **061** (password hasher, Argon2id) — [lesson-061](./lessons/lesson-061-password-hasher-service.md); **062** (`UserService`) — [lesson-062](./lessons/lesson-062-user-service-create-find-by-email.md); **063** (`POST /auth/register`) — [lesson-063](./lessons/lesson-063-auth-register-dto.md); **064** (unique email + friendly `CONFLICT`) — [lesson-064](./lessons/lesson-064-unique-email-friendly-conflict.md); **065** (`POST /auth/login`) — [lesson-065](./lessons/lesson-065-auth-login.md); **066** (JWT access token service) — [lesson-066](./lessons/lesson-066-jwt-access-token-service.md); **067** (`JwtStrategy` + `AuthGuard`, `accessToken` в login, `GET /auth/me`) — [lesson-067](./lessons/lesson-067-jwt-strategy-auth-guard.md); **068** (`@CurrentUser()` decorator) — [lesson-068](./lessons/lesson-068-current-user-decorator.md); **069** (refresh token entity + `RefreshTokenService`) — [lesson-069](./lessons/lesson-069-refresh-token-entity-persistence.md); **070** (`POST /auth/refresh` + rotation, `refreshToken` в login) — [lesson-070](./lessons/lesson-070-auth-refresh-rotation.md); **071** (`POST /auth/logout` + revoke refresh, idempotent 204) — [lesson-071](./lessons/lesson-071-auth-logout-revoke-refresh.md); **072** (refresh token reuse detection — revoke token family on rotated reuse) — [lesson-072](./lessons/lesson-072-auth-refresh-reuse-detection.md); **073** (token TTL: `JWT_ACCESS_EXPIRES_IN` + `JWT_REFRESH_EXPIRES_MS`, TTL policy docs) — [lesson-073](./lessons/lesson-073-token-ttl-configuration.md); **074** (login lockout: `LOGIN_LOCKOUT_MAX_ATTEMPTS`, `LOGIN_LOCKOUT_WINDOW_MS`, `LOGIN_LOCKOUT_DURATION_MS`) — [lesson-074](./lessons/lesson-074-login-brute-force-lockout.md); **075** (email verification tokens: `email_verification_tokens` + `EmailVerificationTokenService`, hash-at-rest, default TTL 24h) — [lesson-075](./lessons/lesson-075-email-verification-token-model.md); **076** (`POST /auth/verify-email`, `email_verified_at`, `emailVerificationToken` в register) — [lesson-076](./lessons/lesson-076-auth-verify-email.md); **077** (`POST /auth/request-password-reset`, `password_reset_tokens` + `PasswordResetTokenService`, `passwordResetToken` в JSON до почтового канала, neutral message anti-enumeration) — [lesson-077](./lessons/lesson-077-password-reset-request-flow.md); **078** (`POST /auth/reset-password`, `UserService.updatePassword`, revoke all refresh + invalidate reset tokens) — [lesson-078](./lessons/lesson-078-password-reset-completion.md); **079** (RBAC schema: `roles`, `permissions`, `role_permissions`, `user_roles`, `RbacModule`, `RoleSlug` constants) — [lesson-079](./lessons/lesson-079-roles-permissions-schema.md); **080** (seed default roles: `db:seed:roles`, `seedDefaultRoles`) — [lesson-080](./lessons/lesson-080-seed-default-roles.md). Следующий шаг — **081** (`RolesGuard` + `@Roles()`) — см. [development-roadmap.md](./development-roadmap.md). Track 0 (001–032): [track-0-acceptance-checklist.md](./track-0-acceptance-checklist.md).
