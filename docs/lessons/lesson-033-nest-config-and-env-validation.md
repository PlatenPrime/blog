# Lesson 033: NestJS ConfigModule + Zod env validation (Track 1 start)

## Learning Goal

Ввести **централизованную загрузку и валидацию** переменных окружения для API: `@nestjs/config`, Zod-схема, совпадающая с корневым [`.env.example`](../../.env.example), fail-fast при старте и единая точка для CORS до следующих шагов Track 1.

## Implementation Scope

В скоупе:

- Зависимости [`@nestjs/config`](https://docs.nestjs.com/techniques/configuration), [`zod`](https://zod.dev/) в [`apps/api/package.json`](../../apps/api/package.json).
- [`apps/api/src/config/env.schema.ts`](../../apps/api/src/config/env.schema.ts) — схема `rootEnvSchema`, `validateRootEnv` (хук Nest), `parseRootEnv` (тесты/утилита).
- [`apps/api/src/config/env-file-paths.ts`](../../apps/api/src/config/env-file-paths.ts) — кандидаты `.env` при `cwd` = корень репо или `apps/api`.
- [`apps/api/src/config/enable-api-cors.ts`](../../apps/api/src/config/enable-api-cors.ts) — `enableApiCors(app)` через `ConfigService` + существующий [`buildCorsOptions`](../../apps/api/src/config/cors.config.ts).
- [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts) — `ConfigModule.forRoot({ isGlobal: true, envFilePath, validate })`.
- [`apps/api/src/main.ts`](../../apps/api/src/main.ts) — без ручного `dotenv`; порт из `ConfigService`, CORS через `enableApiCors`.
- Unit-тесты [`env.schema.spec.ts`](../../apps/api/src/config/env.schema.spec.ts); e2e продолжают проверять CORS с установкой `process.env` до `compile()`.
- Документация: этот урок, [`docs/development-roadmap.md`](../development-roadmap.md), [`docs/learning-path.md`](../learning-path.md), актуализация [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md), [`apps/api/README.md`](../../apps/api/README.md), корневого [`README.md`](../../README.md), комментариев «Read by» в [`.env.example`](../../.env.example).

Намеренно **не** делаем:

- Nest `HealthModule` / `/health`, глобальные exception filters, validation pipe, структурированное логирование с request-id — следующие уроки Track 1.
- Подключение драйвера БД и `DATABASE_URL` — позже, когда появится consuming-код.
- Удаление прямой зависимости `dotenv` из workspace — `@nestjs/config` под капотом использует dotenv; прямой импорт в `main.ts` больше не нужен.

## Dependencies

- Node/npm по репо; шаги 001–032 (в т.ч. [lesson-017](./lesson-017-env-example-files.md) — контракт `.env.example`).
- Пакеты: `@nestjs/config`, `zod`.

## Step-by-Step Changes

1. **Red.** Добавить `env.schema.spec.ts` с кейсами дефолтов, парсинга портов и ошибки на невалидный `PORT`.
2. **Green.** Реализовать `rootEnvSchema`, `validateRootEnv`, `parseRootEnv`; подключить `ConfigModule` и `enableApiCors`; упростить `main.ts`.
3. **Verify.** `nx run api:test`, `nx run api:test:e2e`, `nx run api:lint:ci`, `nx run api:build`.
4. **Docs.** Урок, roadmap, learning-path, runbook'и и «Read by» в `.env.example`.

## Code Example

Фрагмент регистрации конфига:

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: resolveEnvFilePaths(),
  validate: validateRootEnv,
});
```

## Context

До шага 033 API подхватывал корневой `.env` через ручной `dotenv` в `main.ts` и читал `process.env` без схемы. Это расходилось с обещанием [lesson-017](./lesson-017-env-example-files.md): список ключей в `.env.example` должен иметь машинную валидацию.

## Concept

**Fail-fast configuration.** Ошибка в env обнаруживается при старте приложения, а не в середине запроса или в Docker Compose на другой машине. Zod даёт единый язык для дефолтов, coercion и сообщений об ошибках.

## Code Changes

- [`apps/api/src/config/env.schema.ts`](../../apps/api/src/config/env.schema.ts) — Zod-схема и validate-хук.
- [`apps/api/src/config/env.schema.spec.ts`](../../apps/api/src/config/env.schema.spec.ts) — unit-тесты.
- [`apps/api/src/config/env-file-paths.ts`](../../apps/api/src/config/env-file-paths.ts), [`enable-api-cors.ts`](../../apps/api/src/config/enable-api-cors.ts) — инфраструктура bootstrap.
- [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts), [`main.ts`](../../apps/api/src/main.ts), [`test/app.e2e-spec.ts`](../../apps/api/test/app.e2e-spec.ts).

## Why This Matters

Один источник правды для env снижает дрейф между dev/CI/prod, упрощает тесты (подмена `process.env` до инициализации модуля) и готовит почву для health checks и логирования с уровнем из env.

## Architecture Notes

- **Почему Zod, а не class-validator для env:** env приходит как строки из `process.env`; Zod удобен для `preprocess`, дефолтов и явного списка ключей, совпадающего с `.env.example`.
- **Почему несколько `envFilePath`:** Nx и `npm -w api` могут стартовать с разным `cwd`; массив путей повторяет идею старого поиска `.env`.
- **Почему `POSTGRES_*` в схеме API:** ключи уже в корневом `.env.example`; валидация на старте API ловит рассинхрон до `docker compose` и будущего TypeORM/Prisma.

## Changed Files

| Файл                                                        | Действие                                        |
| ----------------------------------------------------------- | ----------------------------------------------- |
| `apps/api/package.json`                                     | `@nestjs/config`, `zod`; удалён прямой `dotenv` |
| `apps/api/src/config/env.schema.ts`                         | создан                                          |
| `apps/api/src/config/env.schema.spec.ts`                    | создан                                          |
| `apps/api/src/config/env-file-paths.ts`                     | создан                                          |
| `apps/api/src/config/enable-api-cors.ts`                    | создан                                          |
| `apps/api/src/app.module.ts`                                | изменён                                         |
| `apps/api/src/main.ts`                                      | изменён                                         |
| `apps/api/test/app.e2e-spec.ts`                             | изменён                                         |
| `.env.example`                                              | комментарии Read by                             |
| `docs/LOCAL_SETUP.md`, `apps/api/README.md`, `README.md`    | актуализация загрузки env                       |
| `docs/development-roadmap.md`, `docs/learning-path.md`      | шаг 033                                         |
| `docs/lessons/lesson-033-nest-config-and-env-validation.md` | создан                                          |

## Verification

- `npx nx run api:test` — все тесты зелёные.
- `npx nx run api:test:e2e` — зелёные.
- `npx nx run api:lint:ci` — без предупреждений.
- `npx nx run api:build` — успешная сборка.
- `npm run format:check` (с корня) — без расхождений Prettier.

## TDD Sequence

- Red: тесты `parseRootEnv` / `validateRootEnv` на дефолты и невалидный `PORT`.
- Green: схема + `ConfigModule` + bootstrap.
- Refactor: вынести `resolveEnvFilePaths`, `enableApiCors` без смены поведения.

## Definition of Done

- [x] API стартует с валидным `.env` по умолчанию; невалидный `PORT` даёт понятную ошибку при инициализации.
- [x] Ключи схемы совпадают с корневым `.env.example`.
- [x] Урок 033 и индексы roadmap/learning-path обновлены.

## What To Remember

- Валидируйте env **один раз** при старте, а не в каждом сервисе.
- Держите `.env.example` и Zod-схему в синхронном списке ключей.
- E2e с `ConfigModule`: выставляйте `process.env` **до** `TestingModule.compile()`.

## Verify

```bash
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:lint:ci
npx nx run api:build
npm run format:check
```
