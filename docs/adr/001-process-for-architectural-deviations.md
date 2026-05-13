# ADR-001: Process for architectural deviations

## Status

Accepted — operational policy for how this repository records **changes** to previously accepted architecture (complements [ADR-000](./000-nx-and-tanstack-start.md)).

## Context

[ADR-000](./000-nx-and-tanstack-start.md) records the baseline stack (Nx + TanStack Start). Real projects drift: a dependency may be deprecated, a security constraint may force a move off a framework, or a product decision may split the monorepo. Silent edits to an old ADR destroy auditability.

## Decision

1. **Do not rewrite accepted ADRs** to pretend the new state was always true. Keep historical ADRs immutable except for typos and non-semantic clarifications (note the change in commit message).

2. When a decision **materially changes** a prior ADR (supersedes or narrows it), add a **new numbered ADR** that:
   - states **Context** referencing the old ADR by ID and file name;
   - states **Decision** clearly (what we do now);
   - lists **Consequences** and **Alternatives considered** at a proportionate depth;
   - ends with **Supersedes:** or **Relates to:** links to prior ADR(s).

3. Update [`docs/adr/README.md`](./README.md) index with the new row.

4. If the deviation corresponds to a roadmap step, update [`docs/development-roadmap.md`](../development-roadmap.md) (or the relevant track section) so the narrative stays aligned. Prefer an explicit roadmap step over a drive-by edit.

5. Add or update a **lesson** when the deviation is part of the learning track, so `lesson-NNN` remains the implementation narrative.

## Consequences

- Slightly more ceremony for each pivot; in exchange, readers can reconstruct **why** the repo moved from A to B.
- ADR numbers grow monotonically; gaps are acceptable if reserved numbers were never published.

## References

- [ADR-000 — Nx + TanStack Start](./000-nx-and-tanstack-start.md)
- [lesson-authoring-guide.md](../lesson-authoring-guide.md)
