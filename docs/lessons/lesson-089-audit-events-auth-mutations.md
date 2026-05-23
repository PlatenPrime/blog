# Lesson 089: Audit events for auth mutations

## Learning Goal

Подключить **запись security audit** при auth-мутациях: `SecurityAuditService` пишет append-only строки в `security_audit_events`, `AuthService` вызывает его для всех типов из `SecurityAuditEventType`, с привязкой к `requestId` / `correlationId` из Track 1.

## Implementation Scope

В скоупе:

- [`apps/api/src/security-audit/security-audit.service.ts`](../../apps/api/src/security-audit/security-audit.service.ts) — `record()`, fail-open при ошибке БД.
- [`apps/api/src/security-audit/security-audit.service.spec.ts`](../../apps/api/src/security-audit/security-audit.service.spec.ts) — unit (tests-first gate).
- [`apps/api/src/auth/auth.service.ts`](../../apps/api/src/auth/auth.service.ts) — хуки audit на register/login/logout/refresh/verify/reset.
- [`apps/api/src/auth/login-lockout.service.ts`](../../apps/api/src/auth/login-lockout.service.ts) — `recordFailure` → `boolean` (lock только что сработал).
- [`apps/api/src/auth/auth.module.ts`](../../apps/api/src/auth/auth.module.ts) — `imports: [SecurityAuditModule]`.
- [`apps/api/src/auth/auth.service.spec.ts`](../../apps/api/src/auth/auth.service.spec.ts), [`login-lockout.service.spec.ts`](../../apps/api/src/auth/login-lockout.service.spec.ts) — unit.

Намеренно **не** делаем:

- IP / User-Agent в audit — [шаг 090](../development-roadmap.md).
- E2E с реальными строками в Postgres после login.
- Audit на RBAC/CMS (не auth mutations).

## Dependencies

- [Шаг 088](./lesson-088-security-audit-log-table.md) — таблица, сущность, `SecurityAuditEventType`.
- [Шаг 072](./lesson-072-auth-refresh-reuse-detection.md) — reuse → `auth.refresh.reuse_detected`.
- [Шаг 074](./lesson-074-login-brute-force-lockout.md) — lockout → `auth.lockout.triggered`.
- [Шаг 043](./lesson-043-request-id-middleware-als-context.md) — `RequestContextStore`.

## Step-by-Step Changes

1. **Red:** `security-audit.service.spec.ts`, расширить `auth.service.spec.ts` (mock `record`).
2. `SecurityAuditService` + export из `SecurityAuditModule` (+ `RequestContextModule` import).
3. `LoginLockoutService.recordFailure` → `boolean` (`lockJustTriggered`).
4. `AuthService`: private `recordAuthAudit`, вызовы по таблице событий ниже.
5. **Verify:** `nx run api:test`, `nx run api:lint`, `nx run api:build`.
6. Docs sync.

## Code Example

```typescript
// apps/api/src/security-audit/security-audit.service.ts
await this.events.save(
  this.events.create({
    eventType: input.eventType,
    actorUserId: input.actorUserId ?? null,
    requestId: this.requestContext.getRequestId() ?? null,
    correlationId: this.requestContext.getCorrelationId() ?? null,
    ipAddress: null,
    userAgent: null,
    metadata: input.metadata ?? {},
    occurredAt: new Date(),
  }),
);
```

```typescript
// apps/api/src/auth/auth.service.ts — reuse (до 401)
await this.recordAuthAudit({
  eventType: SecurityAuditEventType.AuthRefreshReuseDetected,
  actorUserId: row.userId,
  subjectUserId: row.userId,
  metadata: { refreshTokenId: row.id },
});
```

## Context

После 088 журнал был «разлинован», но пуст. Login, refresh, lockout и сброс пароля жили только в HTTP-логах. 089 даёт оператору **долгую память** в БД с тем же `requestId`, что и structured logs.

## Concept

**Fail-open audit:** сбой записи не ломает auth — ошибка логируется, ответ клиенту не меняется.

**Без секретов в metadata:** нет паролей, сырого refresh/email verification token; для reuse — только `refreshTokenId` (UUID строки в БД).

**Enumeration-safe password reset:** audit `auth.password_reset.requested` только когда пользователь найден; для неизвестного email — тишина.

**Lockout:** `auth.lockout.triggered` один раз при переходе в locked; повторные `429` на уже заблокированном аккаунте не дублируют событие.

## Code Changes

| Событие                         | Метод                  | Условие                       |
| ------------------------------- | ---------------------- | ----------------------------- |
| `auth.register.success`         | `register`             | после `users.create`          |
| `auth.login.success`            | `login`                | успешные credentials          |
| `auth.login.failure`            | `login`                | `UnauthorizedException`       |
| `auth.lockout.triggered`        | `login`                | `recordFailure` вернул `true` |
| `auth.logout`                   | `logout`               | revoke активного refresh      |
| `auth.refresh.success`          | `refresh`              | после ротации                 |
| `auth.refresh.reuse_detected`   | `refresh`              | `isRotatedReuse`, до `401`    |
| `auth.verify_email.success`     | `verifyEmail`          | после `markEmailVerified`     |
| `auth.password_reset.requested` | `requestPasswordReset` | `user !== null`               |
| `auth.password_reset.completed` | `resetPassword`        | после успешного consume       |

## Why This Matters

Расследование reuse refresh или brute-force без строк в БД сводится к поиску по ротируемым логам. Audit дополняет логи **иммутабельной** историей с actor/subject и correlation.

## Architecture Notes

- `SecurityAuditModule` импортирует `RequestContextModule` — DI в изолированных module specs (Rbac → Auth).
- `ip_address` / `user_agent` остаются `null` до 090.
- Неуспешный verify/reset — без audit (как и отсутствие reset audit для unknown email).

## Changed Files

| File                                                                                        | Action                                     |
| ------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `apps/api/src/security-audit/security-audit.service.ts`                                     | created                                    |
| `apps/api/src/security-audit/security-audit.service.spec.ts`                                | created                                    |
| `apps/api/src/security-audit/security-audit.module.ts`                                      | changed — provider, `RequestContextModule` |
| `apps/api/src/security-audit/security-audit.module.spec.ts`                                 | changed                                    |
| `apps/api/src/security-audit/index.ts`                                                      | changed — export service                   |
| `apps/api/src/auth/auth.service.ts`                                                         | changed — audit hooks                      |
| `apps/api/src/auth/auth.service.spec.ts`                                                    | changed                                    |
| `apps/api/src/auth/auth.module.ts`                                                          | changed — `SecurityAuditModule`            |
| `apps/api/src/auth/login-lockout.service.ts`                                                | changed — `recordFailure` boolean          |
| `apps/api/src/auth/login-lockout.service.spec.ts`                                           | changed                                    |
| `docs/lessons/lesson-089-audit-events-auth-mutations.md`                                    | created                                    |
| `docs/development-roadmap.md`                                                               | changed — 089 done                         |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` / `docs/LOCAL_SETUP.md` | changed                                    |
| `docs/lessons/lesson-088-security-audit-log-table.md`                                       | changed — link to 089                      |

## Verification

- `npx nx run api:test` — unit green (включая `SecurityAuditService`, `AuthService` audit, lockout boolean).
- `npx nx run api:lint` — без предупреждений.
- `npx nx run api:build` — успешная сборка.
- С Postgres: после `POST /auth/login` в `security_audit_events` появляется строка `auth.login.success` с `request_id` из ответа (ручная проверка, не CI).

## TDD Sequence

- **Red:** specs для `SecurityAuditService` и audit-вызовов в `AuthService`.
- **Green:** сервис, lockout boolean, хуки в auth.
- **Refactor:** `recordAuthAudit` helper.

## Definition of Done

- [x] Все 10 типов из `SecurityAuditEventType` пишутся из `AuthService` в нужных ветках.
- [x] `SecurityAuditService` fail-open; request context ids в строке.
- [x] Unit specs colocated; `nx run api:test` green.
- [x] Документация синхронизирована.

## What To Remember

1. **Audit не блокирует auth** — fail-open + log.
2. **Нет секретов в metadata** — только ids и reason codes.
3. **Password reset unknown email** — без audit (anti-enumeration).
4. IP/UA — [090](../development-roadmap.md).

## Verify

```bash
npx nx run api:test
npx nx run api:lint
npx nx run api:build
```

## Homework

С поднятым Postgres: register → login → проверить `SELECT event_type, actor_user_id, request_id FROM security_audit_events ORDER BY occurred_at DESC LIMIT 5;` — должны быть `auth.register.success` и `auth.login.success` с одинаковым `request_id` на последнем запросе.
