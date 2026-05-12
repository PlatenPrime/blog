# Lesson 015: CORS and dev origins

## Learning Goal

Включить и сконфигурировать CORS у NestJS API, развести dev-порты (API=4000, web=3000) и
сделать список разрешённых origin'ов управляемым через переменную окружения `CORS_ORIGINS`,
не размазывая логику по `main.ts`. Закрепить TDD-ритм через unit-тест чистого парсера
конфигурации и e2e smoke на preflight + обычный запрос.

## Implementation Scope

В скоупе шага:

- Новый чистый модуль конфигурации [`apps/api/src/config/cors.config.ts`](../../apps/api/src/config/cors.config.ts) с экспортированной функцией `buildCorsOptions(env)`.
- Покрытие парсера unit-тестом [`apps/api/src/config/cors.config.spec.ts`](../../apps/api/src/config/cors.config.spec.ts).
- Включение CORS в [`apps/api/src/main.ts`](../../apps/api/src/main.ts) до `app.listen` и перенос дефолтного порта API на `4000`.
- Smoke на CORS в [`apps/api/test/app.e2e-spec.ts`](../../apps/api/test/app.e2e-spec.ts): preflight OPTIONS, разрешённый и запрещённый origin.

Намеренно **не** делаем в этом шаге:

- `.env.example` файлы — это step 017.
- Credentials/cookies (`credentials: true`) — переключим в Track 2 (Auth).
- Health-эндпоинты, конфиг-модуль Nest (`@nestjs/config`) — это Track 1 (Platform Core).

## Dependencies

- Node.js `>=20.10.0` (см. [`package.json`](../../package.json) `engines`).
- Существующие пакеты: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `supertest`, `jest` — никаких новых установок.
- Переменные окружения:
  - `PORT` — дефолт `4000` (новый дефолт для API).
  - `CORS_ORIGINS` — CSV. Если пусто/не задано → `http://localhost:3000`. Значение `*` (одно или вперемешку с другими) включает `origin: true` (reflect-any).

## Step-by-Step Changes

1. **TDD red.** Создаём [`apps/api/src/config/cors.config.spec.ts`](../../apps/api/src/config/cors.config.spec.ts) с кейсами: дефолт (env пусто), пустая/whitespace строка, CSV с пробелами, пустые сегменты между запятыми, `*` сам по себе и в комбинации, `credentials === false`, набор `methods` включая `OPTIONS`. Тесты падают — модуля ещё нет.
2. **TDD green.** Реализуем [`apps/api/src/config/cors.config.ts`](../../apps/api/src/config/cors.config.ts). Функция читает только `env.CORS_ORIGINS`, не дергает `process.env` напрямую — это делает её тестируемой и переиспользуемой (в Track 1 она же поедет в Nest config-модуль).
3. **Подключаем CORS в bootstrap.** В [`apps/api/src/main.ts`](../../apps/api/src/main.ts):
   - Импортируем `buildCorsOptions`.
   - Сразу после `NestFactory.create(AppModule)` зовём `app.enableCors(buildCorsOptions(process.env))` — до `app.listen`, чтобы preflight уже работал на первом же запросе.
   - Дефолтный порт API меняем на `4000` (через константу `DEFAULT_API_PORT`).
4. **E2E smoke.** В [`apps/api/test/app.e2e-spec.ts`](../../apps/api/test/app.e2e-spec.ts) после `createNestApplication()` зеркалим прод-вызов `app.enableCors(buildCorsOptions({ CORS_ORIGINS: 'http://localhost:3000' }))`. Передача env-объекта явно (а не через `process.env`) делает тест герметичным от хост-окружения. Покрываем три кейса: preflight `OPTIONS`, GET с разрешённым `Origin`, GET с запрещённым `Origin`.
5. **Verify.** Запускаем `npx nx run api:test`, `npx nx run api:test:e2e`, `npx nx run api:build` с корня. Все таргеты зелёные.
6. **Docs.** Добавляем урок и обновляем индексы ([`docs/development-roadmap.md`](../development-roadmap.md), [`docs/learning-path.md`](../learning-path.md), [`docs/README.md`](../README.md), [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)).

## Code Example

Чистая функция конфигурации (см. [`apps/api/src/config/cors.config.ts`](../../apps/api/src/config/cors.config.ts)):

```ts
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const DEFAULT_DEV_ORIGIN = 'http://localhost:3000';
const WILDCARD_TOKEN = '*';
const CORS_METHODS = [
  'GET',
  'HEAD',
  'PUT',
  'PATCH',
  'POST',
  'DELETE',
  'OPTIONS',
] as const;

export function buildCorsOptions(env: NodeJS.ProcessEnv): CorsOptions {
  const raw = (env.CORS_ORIGINS ?? '').trim();
  const origins =
    raw.length === 0
      ? [DEFAULT_DEV_ORIGIN]
      : raw
          .split(',')
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0);
  const isWildcard = origins.includes(WILDCARD_TOKEN);

  return {
    origin: isWildcard ? true : origins,
    credentials: false,
    methods: [...CORS_METHODS],
  };
}
```

Подключение в bootstrap:

```ts
const app = await NestFactory.create(AppModule);
app.enableCors(buildCorsOptions(process.env));
```

## Context

К моменту шага 015 в монорепо уже есть:

- NestJS API в `apps/api` (lesson 005), TanStack Start в `apps/web` (lesson 010).
- Shared-библиотека `@blog/shared-contracts` подключена и в API (lesson 013), и в web (lesson 014).
- Корневой Nx, ESLint, Prettier, TS path mapping (lessons 003-008).

CORS до сих пор был **выключен**: браузерный фронт мог дергать API только через прокси
Vite (если был) или попадал в CORS-блок при разнесённых host:port. Заодно по умолчанию оба
приложения садились на `:3000` — это лотерея, чей `vite dev`/`nest start` поднимется первым.

## Concept

**CORS (Cross-Origin Resource Sharing)** — это набор HTTP-заголовков, которыми сервер
разрешает браузеру делать запросы с другого origin'а (схема + хост + порт). Ключевая
механика — **preflight**: на «небезопасные» методы (`PUT`, `DELETE`, кастомные заголовки)
браузер сначала шлёт `OPTIONS` с `Access-Control-Request-Method`. Сервер обязан ответить
`204` и набором `Access-Control-Allow-*` заголовков. Если origin не в whitelist — сервер
просто **не выставляет** `Access-Control-Allow-Origin`, и браузер отбрасывает ответ; запрос
при этом физически проходит, поэтому CORS — это **не аутентификация и не авторизация**.

`credentials: true` включает передачу cookies / `Authorization` через cross-origin запросы;
вместе с ним wildcard `*` запрещён спецификацией — origin должен быть конкретным.

## Code Changes

- [`apps/api/src/config/cors.config.ts`](../../apps/api/src/config/cors.config.ts) — создан: чистая функция `buildCorsOptions(env)`, изолирующая парсинг ENV от Nest-бутстрапа.
- [`apps/api/src/config/cors.config.spec.ts`](../../apps/api/src/config/cors.config.spec.ts) — создан: unit-покрытие default/CSV/wildcard/credentials/methods.
- [`apps/api/src/main.ts`](../../apps/api/src/main.ts) — `app.enableCors(buildCorsOptions(process.env))`, дефолтный порт `4000`.
- [`apps/api/test/app.e2e-spec.ts`](../../apps/api/test/app.e2e-spec.ts) — добавлены кейсы preflight + allowed/disallowed origin.

## Why This Matters

- **Безопасный контракт фронт↔бэк.** Whitelist через ENV исключает «случайно открытый `*`» в проде. В dev — один безопасный дефолт `http://localhost:3000`.
- **Тестируемость конфигурации.** Чистая функция от `env` — это та же модель, что используется в `@nestjs/config` (`ConfigService.get`) и в любом будущем 12-factor рантайме.
- **Разведение портов.** API на `4000`, web на `3000` — конец взаимоблокирующего `EADDRINUSE` и понятный URL для CORS-whitelist'а.
- **TDD заранее.** Любая будущая правка CORS (новые методы, headers, exposed headers, regex для preview-окружений) защищена быстрым unit-тестом без поднятия Nest.

## Architecture Notes

- **Чистая функция вместо in-place в `main.ts`.** `main.ts` остаётся тонким бутстрап-слоем; вся «логика» CORS — в `config/cors.config.ts` и легко переедет под `ConfigModule` в Track 1.
- **`*` vs whitelist.** Разрешаем `*` явным токеном — это удобно для CI/локальных playground'ов, но **не сочетается** с `credentials: true`. Когда в Track 2 включим cookies/refresh-токены, парсер должен будет **запретить** `*` и валидировать каждое значение как URL. Этот переход явно зафиксирован в Definition of Done следующего CORS-урока.
- **Сейчас `credentials: false`.** В Track 2 переключаем на `true`, исключаем `*`, разделяем origin'ы admin vs public web (например, `CORS_ORIGINS=https://admin.example.com,https://example.com`).
- **Жёсткий ответ preflight.** Полагаемся на дефолт пакета `cors` (`optionsSuccessStatus: 204`), который Nest использует под капотом. Тест фиксирует это поведение, чтобы случайный апгрейд не сломал клиентов.
- **Конфликт портов dev.** До шага 015 и API, и web запускались с `PORT=3000`; API авто-инкрементировал. Это плохо для CORS-whitelist'а (origin меняется). Дефолт API теперь `4000`, web остаётся на `3000` (см. [`apps/web/package.json`](../../apps/web/package.json) `scripts.dev`).

## Changed Files

| File                                                                                       | Action                                                |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| [`apps/api/src/config/cors.config.ts`](../../apps/api/src/config/cors.config.ts)           | создан: `buildCorsOptions(env)`                       |
| [`apps/api/src/config/cors.config.spec.ts`](../../apps/api/src/config/cors.config.spec.ts) | создан: unit-покрытие парсера                         |
| [`apps/api/src/main.ts`](../../apps/api/src/main.ts)                                       | `enableCors` + дефолтный порт `4000`                  |
| [`apps/api/test/app.e2e-spec.ts`](../../apps/api/test/app.e2e-spec.ts)                     | добавлены CORS smoke-кейсы                            |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                                                 | секция Environment variables, переход к step 016      |
| [`docs/development-roadmap.md`](../development-roadmap.md)                                 | step 015 в Baseline Status и Completed Steps Snapshot |
| [`docs/learning-path.md`](../learning-path.md)                                             | ссылка на lesson-015 в Phase 1                        |
| [`docs/README.md`](../README.md)                                                           | step 015 в Completed Lessons                          |
| `docs/lessons/lesson-015-cors-and-dev-origins.md`                                          | этот файл                                             |

## Verification

С корня репозитория:

```bash
npm install
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:build
```

Ожидаемо:

- `api:test` — зелёные `app.controller.spec.ts` и новый `cors.config.spec.ts`.
- `api:test:e2e` — зелёный исходный `'/ (GET)'` плюс три новых кейса CORS.
- `api:build` — успех (без новых ошибок типов на `CorsOptions`).

Ручной dev-сценарий:

```bash
# терминал 1: API на http://localhost:4000
npm run start:dev

# терминал 2: web на http://localhost:3000
npm run web:dev

# CORS smoke (опционально):
curl -i -X OPTIONS http://localhost:4000/ \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET"
# Ожидаем 204 и Access-Control-Allow-Origin: http://localhost:3000
```

Переопределение whitelist'а:

```bash
CORS_ORIGINS="http://localhost:3000,http://localhost:5173" npm run start:dev
```

## TDD Sequence

- **Red.** Сначала пишем `cors.config.spec.ts` (модуля ещё нет — тесты не компилируются/падают) и расширяем `app.e2e-spec.ts` тремя кейсами CORS (без `enableCors` они тоже падают: нет `access-control-allow-origin`).
- **Green.** Реализуем `cors.config.ts` и подключаем `app.enableCors(...)` в `main.ts` и в `beforeEach` e2e. Минимально достаточно, чтобы все кейсы зазеленели.
- **Refactor.** Выносим `DEFAULT_DEV_ORIGIN`, `CORS_METHODS`, `WILDCARD_TOKEN` в константы модуля; функция `parseOriginList` инкапсулирует split/trim/filter — поведение не меняется, тесты остаются зелёными.

## Definition of Done

- [ ] `npx nx run api:test` зелёный, в том числе новый `cors.config.spec.ts`.
- [ ] `npx nx run api:test:e2e` зелёный, в том числе три новых кейса CORS.
- [ ] `npx nx run api:build` успешно компилирует API с импортом `CorsOptions`.
- [ ] Дефолтный порт API — `4000`; web остаётся на `3000`.
- [ ] Step 015 присутствует в [`docs/development-roadmap.md`](../development-roadmap.md), [`docs/learning-path.md`](../learning-path.md), [`docs/README.md`](../README.md), [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md).
- [ ] В Architecture Notes явно зафиксировано переключение на `credentials: true` и запрет `*` в Track 2.

## What To Remember

- CORS — это **разрешение для браузера** показать ответ клиентскому коду, а не средство контроля доступа.
- Парсинг ENV держим в чистой функции — это базовый паттерн для всего конфига приложения.
- `credentials: true` несовместим с `origin: '*'` — следующая CORS-итерация в Track 2 обязана убрать wildcard.
- Дефолтные порты dev должны быть **разными** и стабильными; авто-инкремент порта — спасательный круг, а не контракт.

## Verify

```bash
npx nx run api:test
npx nx run api:test:e2e
npx nx run api:build
```
