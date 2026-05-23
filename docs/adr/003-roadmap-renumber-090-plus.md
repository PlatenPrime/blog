# ADR-003: Roadmap renumber for steps 090+

## Status

Accepted (2026-05)

## Context

After completing step **089** (auth audit events), the roadmap still scheduled **global HTTP throttling**, **Helmet**, **email delivery**, **OpenAPI**, **CMS optimistic concurrency**, and **web API client** helpers too late (Tracks 6–7 or implicit). Lessons **001–089** and their files are fixed; steps **090+** had no lesson files yet.

## Decision

1. **Insert 14 new mandatory steps** before public CMS surfaces and shift all former **090–320** step numbers forward (continuous **001–334**).
2. **Do not renumber** completed steps **001–089** or existing lesson filenames.
3. Publish a **migration table** in [`development-roadmap.md`](../development-roadmap.md#roadmap-step-migration-090-renumber-2026-05).
4. **Repurpose** former Track 7 steps **279–281** (global throttle / Helmet) as **production hardening**; baseline implementation moves to step **092**.

### New steps (no old number)

| Step    | Title                                              |
| ------- | -------------------------------------------------- |
| 090     | Email channel (MailDev + `EmailService`)           |
| 091     | Auth-sensitive rate limits (reset / resend verify) |
| 092     | API security baseline (Helmet + global throttler)  |
| 093     | `REQUIRE_EMAIL_VERIFIED` policy                    |
| 094     | OpenAPI / Swagger                                  |
| 110     | Dev seed (CMS)                                     |
| 116     | Post `version` + `If-Match`                        |
| 119     | Atomic publish transaction                         |
| 127     | Pagination / list contracts ADR                    |
| 146     | Safe URL validation (SSRF prep)                    |
| 175–176 | `libs/web-api` + Web Vitest harness                |
| 265     | Media object storage                               |
| 324     | DB backup/restore drill                            |

### Track ranges (after change)

| Track | Range   |
| ----- | ------- |
| 2     | 057–109 |
| 3     | 110–174 |
| 4     | 175–212 |
| 5     | 213–264 |
| 6     | 265–291 |
| 7     | 292–315 |
| 8     | 316–334 |

## Consequences

- Cross-links in older lessons that cite “step 105”, “279”, “090 session metadata”, etc. should use the migration table or be updated when touched.
- Next implementation sprint is **090** (email), not former “session metadata” (now **095**).
- Storytelling adds chapter **XVI** for the Track 2 tail / perimeter arc.

## References

- [`docs/development-roadmap.md`](../development-roadmap.md)
- [`docs/storytelling.md`](../storytelling.md) — chapter XVI
