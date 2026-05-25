# Lesson 098: OAuth/social login deferred ADR

## Learning Goal

Научиться фиксировать **осознанное отложенное решение** через ADR: OAuth/OIDC/social login не исчезает из архитектуры, но не попадает в текущий Track 2, пока нет продуктового UX, provider policy, redirect policy и account-linking правил.

## Implementation Scope

В скоупе:

- [`ADR-004`](../adr/004-oauth-social-login-deferred.md) — почему OAuth/social login откладывается.
- ADR index [`docs/adr/README.md`](../adr/README.md).
- Roadmap/docs/storytelling синхронизация для закрытия шага **098**.
- Обратная ссылка из [lesson-097](./lesson-097-service-api-key-auth-stub.md).

Намеренно **не** делаем:

- OAuth/OIDC provider dependencies.
- Social login routes, callback handlers, guards or strategies.
- Provider account tables, account linking, migrations or OpenAPI OAuth schemes.
- Google/GitHub/Auth0/Clerk dashboard setup, secrets or redirect URLs.

## Dependencies

- [ADR-001](../adr/001-process-for-architectural-deviations.md) — решения меняем и откладываем через новые ADR, не правкой истории.
- [Lesson 094](./lesson-094-openapi-swagger.md) — HTTP-contract review already exists; OAuth schemes are intentionally absent for now.
- [Lesson 096](./lesson-096-auth-error-envelope.md) — future OAuth failures must use the same error envelope.
- [Lesson 097](./lesson-097-service-api-key-auth-stub.md) — machine auth and human auth stay separate.

## External operations (outside the repo)

В этом шаге достаточно monorepo + документации; аккаунты Google/GitHub/Auth0/Clerk, OAuth apps, secrets and callback URLs **не нужны**.

| Action                                    | Where               | Required this step? | Why                                                                |
| ----------------------------------------- | ------------------- | ------------------- | ------------------------------------------------------------------ |
| Create Google/GitHub OAuth application    | Provider dashboard  | **Нет**             | Provider choice and redirect policy are intentionally deferred     |
| Configure OAuth client secrets            | `.env` / CI secrets | **Нет**             | No runtime OAuth integration exists in step 098                    |
| Register staging/production callback URLs | Provider dashboard  | **Нет**             | Public hosting and trusted origins arrive later in delivery tracks |
| Review ADR-004 and documentation sync     | Repository markdown | **Да**              | The decision record is the deliverable for this roadmap step       |

**Architecture sketch:** The laptop still runs the same local monorepo, API, web app, Postgres and MailDev setup from previous steps. No new Docker service, cloud dashboard or provider application is introduced. Human users continue to use first-party email/password auth; machine callers keep the separate service-key stub from step 097. OAuth remains a future integration boundary that will need provider setup, redirect origin ownership, account-linking policy, error handling and audit updates before it becomes product behavior.

## Step-by-Step Changes

1. Write ADR-004 with context, decision, boundaries, return criteria and consequences.
2. Add ADR-004 to the ADR index.
3. Create this lesson with explicit external-operations deferral.
4. Sync roadmap, learning path, docs README, LOCAL_SETUP and storytelling.
5. Update lesson 097 so its next-step pointer links to this lesson.
6. Verify markdown formatting.

## Code Example

No runtime code is added in this step. The important "interface" is the decision boundary:

```text
Current Track 2 auth: email/password + refresh + verify/reset + RBAC + audit + service key.
Deferred OAuth work: providers + callbacks + account linking + redirect policy + secrets.
```

## Context

OAuth is valuable when it removes friction for a real audience or unlocks enterprise identity. It is expensive when added before the product knows which providers matter, which domains will host callbacks, and how existing password accounts should link to social identities.

## Concept

An ADR can be a **defer** decision, not only an "add technology" decision. The decision is still architectural because it protects scope, records trade-offs, and gives future work clear entry criteria.

## Why This Matters

Social login touches security, UX, operations and data modeling at once. Adding it too early would force provider-specific assumptions into auth before the CMS and public site exist. Deferring it keeps Track 2 focused on reusable identity primitives and makes the future OAuth step easier to review.

## Architecture Notes

- OAuth is not rejected; it is postponed until product and deployment constraints are concrete.
- Future OAuth work must define provider choice, redirect origins, account linking, claims mapping, error envelope behavior and audit events.
- No OpenAPI OAuth scheme appears until routes actually support it.
- No provider dashboard action belongs in local setup yet.

## Changed Files

| File                                                         | Action                                       |
| ------------------------------------------------------------ | -------------------------------------------- |
| `docs/adr/004-oauth-social-login-deferred.md`                | created — ADR-004                            |
| `docs/adr/README.md`                                         | changed — ADR index row                      |
| `docs/lessons/lesson-098-oauth-social-login-deferred-adr.md` | created                                      |
| `docs/development-roadmap.md`                                | changed — 098 done / 099 next / lesson index |
| `docs/README.md`                                             | changed — completed lesson 098               |
| `docs/learning-path.md`                                      | changed — step 098 link and 099 next pointer |
| `docs/LOCAL_SETUP.md`                                        | changed — current next roadmap step          |
| `docs/storytelling.md`                                       | changed — chapter XVI and checkpoint         |
| `docs/lessons/lesson-097-service-api-key-auth-stub.md`       | changed — next-step backlink                 |

## Verification

```bash
npm run format:check
```

Expected result: markdown formatting passes and no API tests are required because step 098 changes no `apps/api/src/**` production files.

## TDD Sequence

This is a docs/ADR-only step. There is no red/green API code cycle because no runtime behavior changes. The equivalent review order is:

1. **Decision first:** ADR-004 states the boundary and return criteria.
2. **Docs sync:** lesson and indexes make the decision discoverable.
3. **Format check:** markdown remains consistent with the repo.

## Definition of Done

- [x] ADR-004 explains why OAuth/social login is deferred.
- [x] ADR index references ADR-004.
- [x] Lesson 098 includes external-operations deferral.
- [x] Roadmap, docs README, learning path, LOCAL_SETUP and storytelling are synced.
- [x] No `apps/api/src/**` production files changed; no unit spec is required for this step.

## What To Remember

- "Deferred" is a decision when it records why, boundaries and return criteria.
- OAuth needs provider, redirect, linking, audit and error-envelope policies before code.
- Следующий шаг Track 2 — **099**: [MFA roadmap note + threat model touch-up](./lesson-099-mfa-roadmap-note-threat-model.md).
