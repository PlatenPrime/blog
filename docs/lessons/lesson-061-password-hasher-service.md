# Lesson 061: Password hasher service

## Learning Goal

Вынести **хэширование и проверку пароля** в отдельный Nest-сервис на базе **Argon2id**, чтобы `UserService` и HTTP-слой не дублировали криптологику и чтобы поведение было покрыто **unit-тестами** без Postgres.

## Implementation Scope

В скоупе:

- [`apps/api/package.json`](../../apps/api/package.json) — зависимость `@node-rs/argon2`.
- [`apps/api/src/users/password-hasher.service.ts`](../../apps/api/src/users/password-hasher.service.ts) — `hash` / `verify`, фиксированные параметры Argon2id в одном месте.
- [`apps/api/src/users/users.module.ts`](../../apps/api/src/users/users.module.ts) — `providers` / `exports` для `PasswordHasherService`.
- [`apps/api/src/users/index.ts`](../../apps/api/src/users/index.ts) — barrel-экспорт сервиса.
- [`apps/api/src/users/password-hasher.service.spec.ts`](../../apps/api/src/users/password-hasher.service.spec.ts) — Vitest.

Намеренно **не** делаем:

- Регистрация/логин по HTTP, DTO, JWT — [шаги 063+](../development-roadmap.md).
- Переменные окружения для cost-параметров (позже, при политике prod).

## Dependencies

- [Шаг 060](./lesson-060-user-entity-indexes.md) — колонка `password_hash`, сущность `User`.
- [Шаг 062](./lesson-062-user-service-create-find-by-email.md) — `UserService` вызывает этот сервис при создании пользователя.
- Node из [`.nvmrc`](../../.nvmrc); пакет `@node-rs/argon2` (N-API, предсборки под Linux/Windows — важно для CI-матрицы).

## Step-by-Step Changes

1. Добавить `@node-rs/argon2` в workspace-пакет `api`, `npm install` из корня репозитория.
2. Реализовать `PasswordHasherService`: `hash(plain)` → PHC-строка; `verify(plain, stored)` через `verify` библиотеки (параметры читаются из строки хэша).
3. Зарегистрировать сервис в `UsersModule` и экспортировать для будущих модулей auth.
4. Написать unit-тесты: отличие от plaintext, verify true/false, разные соли при повторном `hash`.
5. **Verify:** `nx run api:test`, `nx run api:lint`, `nx run api:build`.
6. Синхронизировать roadmap, storytelling, README, learning-path.

## Code Example

```typescript
// apps/api/src/users/password-hasher.service.ts (идея)
// Явно не импортируем `Algorithm` (const enum) — Nest `isolatedModules` ругается; Argon2id — дефолт пакета.
const PASSWORD_HASH_OPTIONS = {
  memoryCost: 4096,
  timeCost: 2,
  parallelism: 1,
} as const;

@Injectable()
export class PasswordHasherService {
  async hash(plainPassword: string): Promise<string> {
    return hash(plainPassword, PASSWORD_HASH_OPTIONS);
  }

  async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    return verify(passwordHash, plainPassword);
  }
}
```

## Context

После 060 в БД есть место под `password_hash`, но нельзя класть пароль в открытом виде и нельзя размазывать вызовы библиотеки по сервисам — один вход для хэша и проверки.

## Concept

**Разделение ответственности:** доменный слой знает _что_ сохранить в `passwordHash`, а `PasswordHasherService` знает _как_ получить стойкий хэш и проверить пароль без утечки сравнения по времени на уровне приложения (опираемся на реализацию Argon2).

## Code Changes

- `password-hasher.service.ts` — единственная точка Argon2id в API.
- `users.module.ts` — DI для последующего `UserService`.
- `password-hasher.service.spec.ts` — контракт сервиса без БД.

## Why This Matters

Без отдельного сервиса каждый новый auth-сценарий (регистрация, смена пароля, reset) рискует скопировать параметры хэша или забыть соль; тесты разъедутся. Централизация упрощает смену алгоритма или ужесточение cost в одном файле.

## Architecture Notes

- **Почему `@node-rs/argon2`:** Argon2id по roadmap, быстрый нативный слой без node-gyp, хорошо подходит под **ubuntu + windows** в CI.
- **Альтернатива:** `bcryptjs` (чистый JS) — проще на экзотических платформах, но медленнее и другой алгоритм; для курса argon2 остаётся каноном шага 061.
- **`verify` без второго объекта опций:** PHC-строка уже содержит `m`, `t`, `p`; передача тех же опций в `verify` не требуется.
- **Const enum `Algorithm`:** не импортировать в приложении при `isolatedModules`; алгоритм по умолчанию в `@node-rs/argon2` — Argon2id.

## Changed Files

| File                                                                | Action                       |
| ------------------------------------------------------------------- | ---------------------------- |
| `apps/api/package.json`                                             | changed — `@node-rs/argon2`  |
| `package-lock.json` (корень)                                        | changed — lock после install |
| `apps/api/src/users/password-hasher.service.ts`                     | created                      |
| `apps/api/src/users/password-hasher.service.spec.ts`                | created                      |
| `apps/api/src/users/users.module.ts`                                | changed — providers/exports  |
| `apps/api/src/users/index.ts`                                       | changed — export сервиса     |
| `docs/lessons/lesson-061-password-hasher-service.md`                | created                      |
| `docs/development-roadmap.md`                                       | changed — шаг 061 done       |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` | changed                      |
| `docs/LOCAL_SETUP.md`                                               | changed — next step 062      |

## Verification

- `npx nx run api:test` — зелёные unit-тесты, включая `password-hasher.service.spec.ts`.
- `npx nx run api:lint` — без предупреждений.
- `npx nx run api:build` — успешная сборка.

## TDD Sequence

- **Red:** три сценария в `password-hasher.service.spec.ts` (форма хэша, verify, соль).
- **Green:** минимальная реализация `PasswordHasherService` + зависимость.
- **Refactor:** константы опций и комментарии к prod-tune без изменения поведения.

## Definition of Done

- [x] `PasswordHasherService` с `hash` / `verify`, Argon2id.
- [x] Сервис зарегистрирован и экспортирован из `UsersModule`.
- [x] Unit-тесты проходят в CI без Postgres.
- [x] Документация (roadmap, storytelling, README, learning-path, LOCAL_SETUP) синхронизирована.

## What To Remember

- Пароль в логах и ответах API не храним; в БД — только PHC-строка в `password_hash`.
- Один сервис — один набор параметров хэширования до отдельного шага конфигурации.
- `verify` опирается на параметры, зашитые в сохранённую строку хэша.

## Verify

```bash
npx nx run api:test
npx nx run api:lint
npx nx run api:build
```

## Homework

Сравнить время `hash` на своей машине при `memoryCost: 4096` и при завышенном значении (например 65536) и зафиксировать для себя trade-off UX регистрации vs стойкость.
