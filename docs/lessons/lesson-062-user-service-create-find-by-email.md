# Lesson 062: `UserService` — create / find by email

## Learning Goal

Ввести **доменный сервис пользователя**: создание записи с хэшем пароля через `PasswordHasherService` и поиск по `email`, чтобы HTTP-слой (063+) вызывал стабильный контракт, а unit-тесты обходились **без Postgres**.

## Implementation Scope

В скоупе:

- [`apps/api/src/users/user.service.ts`](../../apps/api/src/users/user.service.ts) — `findByEmail`, `create({ email, plainPassword })`.
- [`apps/api/src/users/users.module.ts`](../../apps/api/src/users/users.module.ts) — `UserService` в `providers` / `exports`.
- [`apps/api/src/users/index.ts`](../../apps/api/src/users/index.ts) — barrel-экспорт.
- [`apps/api/src/users/user.service.spec.ts`](../../apps/api/src/users/user.service.spec.ts) — Vitest, моки `Repository` и `PasswordHasherService`.

Намеренно **не** делаем:

- `POST /auth/register`, DTO, валидация на границе HTTP — [шаг 063](./lesson-063-auth-register-dto.md).
- Дружелюбный маппинг нарушения уникальности `email` — [шаг 064](../development-roadmap.md); при дубликате пока полагаемся на БД без обёртки в сервисе.

## Dependencies

- [Шаг 060](./lesson-060-user-entity-indexes.md) — сущность `User`, репозиторий через `forFeature`.
- [Шаг 061](./lesson-061-password-hasher-service.md) — `PasswordHasherService`.

## Step-by-Step Changes

1. Реализовать `UserService`: `InjectRepository(User)`, внедрить `PasswordHasherService`.
2. `findByEmail` — `findOne({ where: { email } })` (точное совпадение строки, как в БД на 060).
3. `create` — `hash(plainPassword)` → `users.create({ email, passwordHash })` → `save`.
4. Зарегистрировать и **экспортировать** сервис из `UsersModule` для будущего `AuthModule`.
5. Unit-тесты с `vi.fn()` на `findOne` / `create` / `save` / `hash`.
6. **Verify:** `nx run api:test`, при необходимости `nx run api:lint`, `nx run api:build`.
7. Синхронизировать roadmap, storytelling, README, learning-path, LOCAL_SETUP.

## Context

После 061 пароль никогда не попадает в сущность в открытом виде, но **кто** вызывает хэшер и **как** пишет в таблицу — ещё не зафиксировано. `UserService` — тонкий слой над TypeORM, который следующие шаги могут мокать целиком.

## Concept

**Use-case в одном месте:** регистрация и логин не должны дублировать сборку `User` и запросы по email; сервис держит согласованность «email + password_hash» до появления JWT и guards.

## Code Changes

- `user.service.ts` — единственная точка создания пользователя с хэшем в этом модуле.
- `user.service.spec.ts` — контракт без `TestingModule` и без Docker Postgres.

## Why This Matters

Без сервиса каждый контроллер рискует по-разному вызывать репозиторий и забыть `hash`; тесты размножатся или потянут e2e. Один сервис упрощает 063 и снижает дублирование.

## Architecture Notes

- **Почему не `TestingModule` в spec:** достаточно `new UserService(mockRepo, mockHasher)` — быстрый контракт, как в других unit-тестах приложения.
- **Дубликат email:** уникальный индекс из 060; явная обработка и нормализация регистра — 064+.

## Changed Files

| File                                                                | Action                               |
| ------------------------------------------------------------------- | ------------------------------------ |
| `apps/api/src/users/user.service.ts`                                | created                              |
| `apps/api/src/users/user.service.spec.ts`                           | created                              |
| `apps/api/src/users/users.module.ts`                                | changed — UserService DI             |
| `apps/api/src/users/index.ts`                                       | changed — export UserService         |
| `docs/lessons/lesson-062-user-service-create-find-by-email.md`      | created                              |
| `docs/lessons/lesson-061-password-hasher-service.md`                | changed — link to 062                |
| `docs/development-roadmap.md`                                       | changed — шаг 062 done               |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` | changed                              |
| `docs/LOCAL_SETUP.md`                                               | changed — next step 063 (historical) |

Следующий урок: [063 — HTTP-регистрация](./lesson-063-auth-register-dto.md).

## Verification

- `npx nx run api:test` — зелёные unit-тесты, включая `user.service.spec.ts`.
- `npx nx run api:lint` — без предупреждений (рекомендуется перед PR).
- `npx nx run api:build` — успешная сборка.

## Definition of Done

- [x] `UserService` с `findByEmail` и `create`.
- [x] Сервис в `UsersModule` и в `exports`.
- [x] Unit-тесты без Postgres.
- [x] Документация синхронизирована (roadmap, storytelling, README, learning-path, LOCAL_SETUP).

## What To Remember

- Пароль в `create` только как `plainPassword`; в `save` уходит уже `passwordHash`.
- `findByEmail` не нормализует регистр до шага 064 — совпадение с тем, что лежит в колонке.

## Verify

```bash
npx nx run api:test
npx nx run api:lint
npx nx run api:build
```

## Homework

См. [lesson-063](./lesson-063-auth-register-dto.md): как `UserService.create` вызывается из `AuthService` и как DTO отделяет вход HTTP от домена.
