# Lesson 088: Security audit log table

## Learning Goal

Заложить **append-only журнал security-событий** в PostgreSQL: таблица `security_audit_events`, TypeORM-сущность, константы типов auth-событий и `SecurityAuditModule` — без сервиса записи и без хуков в `AuthService`.

## Implementation Scope

В скоупе:

- [`apps/api/src/database/migrations/1748361600000-CreateSecurityAuditEventsTable.ts`](../../apps/api/src/database/migrations/1748361600000-CreateSecurityAuditEventsTable.ts) — DDL + индексы.
- [`apps/api/src/security-audit/`](../../apps/api/src/security-audit/) — `SecurityAuditEvent`, `SecurityAuditEventType`, `SecurityAuditModule`.
- [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts) — импорт `SecurityAuditModule`.
- [`apps/api/src/security-audit/security-audit-event-type.spec.ts`](../../apps/api/src/security-audit/security-audit-event-type.spec.ts), [`security-audit.module.spec.ts`](../../apps/api/src/security-audit/security-audit.module.spec.ts) — unit (tests-first gate).

Намеренно **не** делаем:

- `SecurityAuditService` и запись из auth — [шаг 089](./lesson-089-audit-events-auth-mutations.md) (done).
- E2E с реальными строками в audit.
- Обогащение IP/UA из request — [095](../development-roadmap.md).
- Moderation audit (Track 3, шаг 135) — отдельная таблица.

## Dependencies

- [Шаг 060](./lesson-060-user-entity-indexes.md) — `users`, FK для `actor_user_id` / `subject_user_id`.
- [Шаг 059](./lesson-059-migration-workflow-baseline-schema.md) — `db:migrate*`.
- [Шаг 087](./lesson-087-auth-rbac-forbidden-e2e-flow.md) — auth e2e матрица закрыта; следующий слой — аудит.

## Step-by-Step Changes

1. **Red:** `security-audit-event-type.spec.ts`, `security-audit.module.spec.ts`.
2. `SecurityAuditEventType` + `AUTH_SECURITY_AUDIT_EVENT_TYPES`.
3. Сущность `SecurityAuditEvent` + миграция `CreateSecurityAuditEventsTable`.
4. `SecurityAuditModule` + импорт в `AppModule`.
5. **Verify:** `api:test`, `api:lint`, `api:build`; с Docker — `db:migrate`.
6. Docs sync: roadmap, storytelling глава XV, README, learning-path, LOCAL_SETUP.

## Code Example

```typescript
// apps/api/src/security-audit/security-audit-event-type.ts
export const SecurityAuditEventType = {
  AuthLoginSuccess: 'auth.login.success',
  AuthRefreshReuseDetected: 'auth.refresh.reuse_detected',
} as const;
```

```bash
npm run db:up
npm run db:migrate
npm run db:migrate:show
```

## Context

После 087 auth и RBAC проверены сквозными e2e, но **инциденты** (reuse refresh, lockout, сброс пароля) видны только в HTTP-логах. Оператору нужна неизменяемая история в БД с привязкой к `requestId` / `correlationId` — схема готовит **089**.

## Concept

**Append-only audit:** строки только добавляются; `event_type` — `varchar` + TypeScript const (не PG ENUM). **`ON DELETE SET NULL`** на FK к `users` — журнал переживает удаление учётки. **`metadata` jsonb** — детали без новой колонки на каждый кейс; секреты (пароли, сырой refresh) не пишем даже на 089.

## Code Changes

- Таблица `security_audit_events`: actor/subject, request/correlation ids, ip, user_agent, metadata, occurred_at.
- Индексы по `(event_type, occurred_at)`, `(actor_user_id, occurred_at)`, `(subject_user_id, occurred_at)`.
- `SecurityAuditModule` только `forFeature` + export `TypeOrmModule`.

## Why This Matters

Запись событий без таблицы — расходится с prod DDL. Одна миграция фиксирует контракт для dev/staging/prod; типы событий готовы для `AuthService` на **089** (включая reuse из **072**).

## Architecture Notes

- **Отдельно от moderation audit (135):** security vs контент-модерация.
- **Пустая таблица до 089:** ожидаемо.
- **`AuthModule` не меняем:** сервис подключится через `SecurityAuditModule` на 089.
- **Request context:** колонки `request_id` / `correlation_id` совместимы с middleware Track 1.

## Changed Files

| File                                                                                        | Action                                 |
| ------------------------------------------------------------------------------------------- | -------------------------------------- |
| `apps/api/src/database/migrations/1748361600000-CreateSecurityAuditEventsTable.ts`          | created                                |
| `apps/api/src/security-audit/*.ts`                                                          | created — entity, types, module, specs |
| `apps/api/src/app.module.ts`                                                                | changed — `SecurityAuditModule`        |
| `docs/lessons/lesson-088-security-audit-log-table.md`                                       | created                                |
| `docs/development-roadmap.md`                                                               | changed — шаг 088 done                 |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` / `docs/LOCAL_SETUP.md` | changed                                |
| `docs/lessons/lesson-087-auth-rbac-forbidden-e2e-flow.md`                                   | changed — link to 088                  |

## Verification

- `npx nx run api:test` — все unit-тесты зелёные.
- `npx nx run api:lint` — без предупреждений.
- `npx nx run api:build` — успешная сборка.
- С поднятым Postgres (`npm run db:up`): `npm run db:migrate` — применяется `CreateSecurityAuditEventsTable1748361600000`; `\d security_audit_events` показывает FK, jsonb `metadata`, индексы.

## TDD Sequence

- **Red:** specs для `SecurityAuditEventType` и компиляции `SecurityAuditModule`.
- **Green:** entity, migration, module wiring.
- **Refactor:** без публичного API сервиса.

## Definition of Done

- [x] Таблица `security_audit_events` + сущность согласованы с миграцией.
- [x] `SecurityAuditEventType` готов для auth mutations (089).
- [x] `SecurityAuditModule` в `AppModule`, unit specs.
- [x] `AuthService` без изменений.
- [x] Документация синхронизирована.
- [x] `nx run api:test` green.

## What To Remember

1. **088 = схема only** — запись на 089.
2. **SET NULL на user FK** — audit переживает удаление пользователя.
3. **Отдельная таблица** от moderation audit в Track 3.
4. Reuse и lockout получат строки в БД на [089](../development-roadmap.md).

## Verify

```bash
npx nx run api:test
npx nx run api:lint
npx nx run api:build
npm run db:up
npm run db:migrate
npm run db:migrate:show
```

## Homework

На чистой БД: `db:migrate`, `\d security_audit_events`, вставить тестовую строку с `event_type = 'auth.login.success'` и пустым `metadata`, затем `db:migrate:revert` (последняя миграция) и снова `db:migrate`.
