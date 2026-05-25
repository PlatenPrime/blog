# Lesson 095: Session/device metadata in audit

## Learning Goal

Подключить минимальные **session/device metadata** к security audit: IP и User-Agent запроса попадают в `security_audit_events` через общий request context, без новой таблицы устройств и без изменения auth-контрактов.

## Implementation Scope

В скоупе:

- [`RequestContext`](../../apps/api/src/common/request-context/request-context.types.ts) — поля `ipAddress` и `userAgent`.
- [`RequestContextStore`](../../apps/api/src/common/request-context/request-context.store.ts) — getters для client metadata.
- [`RequestIdMiddleware`](../../apps/api/src/common/request-context/request-id.middleware.ts) — сбор IP из `resolveClientIp()` и User-Agent из headers.
- [`SecurityAuditService`](../../apps/api/src/security-audit/security-audit.service.ts) — запись `ipAddress` / `userAgent` в audit event.
- Unit specs: [`request-id.middleware.spec.ts`](../../apps/api/src/common/request-context/request-id.middleware.spec.ts), [`security-audit.service.spec.ts`](../../apps/api/src/security-audit/security-audit.service.spec.ts).

Намеренно **не** делаем:

- Таблицу устройств или полноценный session inventory.
- UI «выйти со всех устройств».
- Миграцию БД: колонки `ip_address` и `user_agent` уже добавлены в **088**.
- OpenAPI export: HTTP-контракт не меняется.

## Dependencies

- [Шаг 043](./lesson-043-request-id-middleware.md) — ALS request context.
- [Шаг 088](./lesson-088-security-audit-log-table.md) — поля `ip_address` / `user_agent` в audit table.
- [Шаг 089](./lesson-089-audit-events-auth-mutations.md) — `SecurityAuditService` и auth audit hooks.
- [Шаг 091](./lesson-091-auth-sensitive-rate-limits.md) — общий helper `resolveClientIp()`.

## External operations (outside the repo)

В этом шаге достаточно monorepo + уже поднятого local compose; аккаунты Railway/Vercel/Supabase не нужны.

| Action | Where | Required this step? | Why                                                    |
| ------ | ----- | ------------------- | ------------------------------------------------------ |
| —      | —     | **Нет**             | Меняется только request context и запись в audit table |

**Architecture sketch:** Браузер или API-клиент отправляет обычный HTTP-запрос с IP на сетевом уровне и опциональным `User-Agent` header. Nest middleware кладёт эти значения в `AsyncLocalStorage` рядом с request/correlation id. Auth-сервис не знает о заголовках и не получает новые параметры: audit-сервис читает контекст сам. Позже production proxy/CDN сможет влиять на `x-forwarded-for`, поэтому доверие к этому заголовку останется отдельной ops-политикой.

## Step-by-Step Changes

1. **Red:** расширить unit specs для middleware и audit service.
2. **Green:** добавить client metadata в request context.
3. **Green:** писать IP/User-Agent из context store в `SecurityAuditService`.
4. **Docs sync:** урок 095, roadmap, indexes, storytelling, threat model, related lessons.
5. **Verify:** `npx nx run api:test`.

## Code Example

```typescript
// apps/api/src/security-audit/security-audit.service.ts
const event = this.events.create({
  eventType: input.eventType,
  requestId: this.requestContext.getRequestId() ?? null,
  correlationId: this.requestContext.getCorrelationId() ?? null,
  ipAddress: this.requestContext.getIpAddress() ?? null,
  userAgent: this.requestContext.getUserAgent() ?? null,
  metadata: input.metadata ?? {},
});
```

## Context

После **089** audit уже фиксировал auth-события, actor/subject и request/correlation ids. Но два важных поля из схемы **088** оставались пустыми: нельзя было отличить повторную попытку с того же клиента от похожего события из другого окружения.

## Concept

**Минимальная metadata, не fingerprinting:** IP и User-Agent помогают расследовать reuse refresh, lockout и подозрительный reset, но не превращаются в стабильный device id.

**Один источник контекста:** request middleware собирает технические детали один раз; сервисы домена не прокидывают `req` и не знают про Express headers.

**Ограниченный User-Agent:** строка режется до 512 символов под колонку БД. Пустой header не записывается.

## Why This Matters

Security audit без client metadata отвечает «что произошло» и «с каким пользователем», но хуже отвечает «откуда». Для раннего CMS этого достаточно, чтобы связать login failure, reset и refresh reuse с одним сетевым следом, не строя дорогую модель устройств раньше времени.

## Architecture Notes

- `resolveClientIp()` переиспользуется из rate-limit слоя, чтобы IP определялся одинаково.
- `SecurityAuditService` остаётся fail-open: ошибка записи audit не ломает auth flow.
- Значения остаются nullable: не каждый тестовый или внутренний вызов идёт через HTTP middleware.

## Changed Files

| File                                                                                        | Action                                         |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `apps/api/src/common/request-context/request-context.types.ts`                              | changed — client metadata fields               |
| `apps/api/src/common/request-context/request-context.store.ts`                              | changed — metadata getters                     |
| `apps/api/src/common/request-context/request-id.middleware.ts`                              | changed — IP/User-Agent capture                |
| `apps/api/src/common/request-context/request-id.middleware.spec.ts`                         | changed — unit coverage for metadata context   |
| `apps/api/src/security-audit/security-audit.service.ts`                                     | changed — persist metadata from context        |
| `apps/api/src/security-audit/security-audit.service.spec.ts`                                | changed — unit coverage for persisted metadata |
| `docs/lessons/lesson-095-session-device-metadata.md`                                        | created                                        |
| `docs/development-roadmap.md`                                                               | changed — 095 done                             |
| `docs/README.md` / `docs/learning-path.md` / `docs/storytelling.md` / `docs/LOCAL_SETUP.md` | changed                                        |
| `docs/security/threat-model-stub.md`                                                        | changed                                        |
| `docs/lessons/lesson-088-security-audit-log-table.md`                                       | changed — 095 link                             |
| `docs/lessons/lesson-089-audit-events-auth-mutations.md`                                    | changed — 095 link                             |
| `docs/lessons/lesson-093-require-email-verified-policy.md`                                  | changed — next-step pointer                    |
| `docs/lessons/lesson-094-openapi-swagger.md`                                                | changed — next-step pointer                    |

## Verification

```bash
npx nx run api:test
```

- Unit: request context stores IP/User-Agent only during `next()`.
- Unit: `SecurityAuditService` persists IP/User-Agent when context has them and falls back to `null` otherwise.
- Manual optional: with API + Postgres running, login and query `security_audit_events` for `ip_address`, `user_agent`, `request_id`.

## TDD Sequence

1. **Red:** specs expect `getIpAddress()` / `getUserAgent()` and persisted audit metadata.
2. **Green:** request context fields + middleware capture.
3. **Refactor:** keep auth service signatures unchanged; audit reads context directly.

## Definition of Done

- [x] IP/User-Agent captured in request context.
- [x] Security audit writes existing `ip_address` / `user_agent` columns.
- [x] Unit specs updated under `apps/api/`.
- [x] Docs sync completed.

## What To Remember

- Session metadata здесь — это audit context, не device registry.
- IP from proxy headers is operationally useful but not proof of identity.
- Auth failures in API error envelope — [lesson-096](./lesson-096-auth-error-envelope.md); следующий шаг Track 2 — **097**: service/API key auth stub.
