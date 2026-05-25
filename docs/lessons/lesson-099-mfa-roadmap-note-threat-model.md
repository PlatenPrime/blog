# Lesson 099: MFA roadmap note + threat model touch-up

## Learning Goal

Научиться фиксировать **MFA как roadmap/security boundary**: многофакторная аутентификация важна для защиты учётки, но до UI, recovery policy, enrollment flow и passkey/TOTP выбора её нельзя добавлять как случайный guard в код.

## Implementation Scope

В скоупе:

- MFA roadmap note inside this lesson: what future work must decide before implementation.
- Threat model update for MFA-related spoofing and account recovery risks.
- Roadmap/docs/storytelling synchronization for closing step **099**.
- Backlink from [lesson-098](./lesson-098-oauth-social-login-deferred-adr.md).

Намеренно **не** делаем:

- TOTP secret storage, QR provisioning or authenticator-app setup.
- WebAuthn/passkeys registration, challenge verification or credential tables.
- Recovery codes, backup factors, factor reset flow or admin bypass policy.
- SMS/email OTP provider integration, new secrets, migrations, guards or OpenAPI MFA schemes.

## Dependencies

- [Lesson 070](./lesson-070-auth-refresh-rotation.md) and [Lesson 072](./lesson-072-auth-refresh-reuse-detection.md) — refresh rotation limits the lifetime of stolen long-lived credentials.
- [Lesson 074](./lesson-074-login-brute-force-lockout.md) — login lockout is still the first brute-force control.
- [Lesson 088](./lesson-088-security-audit-log-table.md) and [Lesson 095](./lesson-095-session-device-metadata.md) — future MFA enrollment, challenge and recovery events need audit context.
- [Lesson 096](./lesson-096-auth-error-envelope.md) — MFA failures must use the shared API error envelope.
- [Lesson 098](./lesson-098-oauth-social-login-deferred-adr.md) — OAuth and MFA both affect identity UX, but they are separate decisions.

## External operations (outside the repo)

В этом шаге достаточно monorepo + документации; authenticator apps, WebAuthn/passkey platform setup, SMS/email OTP providers, cloud dashboards and new secrets **не нужны**.

| Action                                   | Where                         | Required this step? | Why                                                            |
| ---------------------------------------- | ----------------------------- | ------------------- | -------------------------------------------------------------- |
| Install/configure authenticator app      | Phone / password manager      | **Нет**             | No TOTP enrollment flow exists yet                             |
| Configure WebAuthn/passkey relying party | Browser/platform + API config | **Нет**             | Passkey support needs product UX and credential storage first  |
| Add SMS/email OTP provider               | Provider dashboard / secrets  | **Нет**             | OTP delivery channel and abuse controls are not selected yet   |
| Review MFA roadmap note and threat model | Repository markdown           | **Да**              | The decision boundary is the deliverable for this roadmap step |

**Architecture sketch:** The laptop still runs the same local monorepo, API, web app, Postgres and MailDev setup from previous steps. MFA is not a new runtime dependency in this step; it is a future identity layer that will sit between password login and session issuance for selected users or routes. TOTP would add shared-secret storage and recovery-code handling, while WebAuthn/passkeys would add browser challenge flows and credential metadata. Both options cross the trust boundary between user device, browser, API and database, so the repo records the security questions before choosing the implementation.

## Step-by-Step Changes

1. Create this lesson as the MFA roadmap note for step **099**.
2. Update the threat model to mention MFA as a planned control for credential compromise.
3. Sync roadmap, learning path, docs README, LOCAL_SETUP and storytelling.
4. Update lesson 098 so its next-step pointer links to this lesson.
5. Verify markdown formatting.

## Code Example

No runtime code is added in this step. The useful artifact is the boundary for future MFA work:

```text
Current Track 2 auth: password + refresh rotation + email verification + RBAC + audit.
Future MFA work: enrollment + challenge + recovery + audit + rate limits + UX + OpenAPI.
```

## Context

The current auth stack can identify users, rotate refresh tokens, gate sensitive routes on verified email, and record security-relevant events. MFA would reduce the impact of a stolen password, but it also introduces new failure modes: locked-out users, weak factor recovery, factor reset abuse, device loss and confusing login UX.

## Concept

MFA is not one feature. It is a family of authentication factors and recovery policies. A future implementation must decide whether the first factor is TOTP, WebAuthn/passkeys, recovery codes, or a phased combination, and must define who is required to enroll before the API enforces challenges.

## Why This Matters

Adding MFA too early can make the system look safer while moving the real risk into recovery flows. If an attacker can reset a factor with only email access, the second factor becomes theatre. Recording the threat-model impact now keeps Track 2 honest: the team knows MFA belongs on the security map, but does not ship a half-designed lockout machine.

## Architecture Notes

- MFA should protect high-risk sessions and privileged roles first; broad rollout needs product UX.
- Enrollment, challenge, disable and recovery events must be auditable.
- Rate limits need to cover factor challenge attempts and recovery-code guessing.
- WebAuthn/passkeys and TOTP have different storage, backup and device-loss trade-offs.
- OAuth/social login does not replace MFA; future provider-based auth still needs local policy for step-up and recovery.

## Changed Files

| File                                                         | Action                                       |
| ------------------------------------------------------------ | -------------------------------------------- |
| `docs/lessons/lesson-099-mfa-roadmap-note-threat-model.md`   | created                                      |
| `docs/security/threat-model-stub.md`                         | changed — MFA planned controls               |
| `docs/development-roadmap.md`                                | changed — 099 done / 100 next / lesson index |
| `docs/README.md`                                             | changed — completed lesson 099               |
| `docs/learning-path.md`                                      | changed — step 099 link and 100 next pointer |
| `docs/LOCAL_SETUP.md`                                        | changed — current next roadmap step          |
| `docs/storytelling.md`                                       | changed — chapter XVI and checkpoint         |
| `docs/lessons/lesson-098-oauth-social-login-deferred-adr.md` | changed — next-step backlink                 |

## Verification

```bash
npm run format:check
```

Expected result: markdown formatting passes and no API tests are required because step 099 changes no `apps/api/src/**` production files.

## TDD Sequence

This is a docs-only security planning step. There is no red/green API code cycle because no runtime behavior changes. The equivalent review order is:

1. **Threat model first:** state what risk MFA is meant to reduce.
2. **Boundary second:** record what implementation choices remain open.
3. **Docs sync:** lesson and indexes make the future work discoverable.
4. **Format check:** markdown remains consistent with the repo.

## Definition of Done

- [x] Lesson 099 explains MFA as future security work, not current runtime code.
- [x] Threat model mentions MFA as a planned control and recovery risk area.
- [x] Roadmap, docs README, learning path, LOCAL_SETUP and storytelling are synced.
- [x] No authenticator app, WebAuthn/passkey provider, SMS/email OTP provider or new secret is configured.
- [x] No `apps/api/src/**` production files changed; no unit spec is required for this step.

## What To Remember

- MFA reduces password-only risk only when recovery and enrollment are designed as carefully as the challenge.
- TOTP, passkeys and recovery codes are different product/security choices, not interchangeable checkboxes.
- Следующий шаг Track 2 — **100**: account recovery edge-case tests.
