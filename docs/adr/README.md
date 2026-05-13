# Architecture Decision Records (ADR)

Short, durable documents that capture **why** the repository chose a particular direction. How-to and step-by-step narratives live under [`docs/lessons/`](../lessons/).

| ID  | Title                                 | File                                                                                         |
| --- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| 000 | Nx + TanStack Start for this monorepo | [000-nx-and-tanstack-start.md](./000-nx-and-tanstack-start.md)                               |
| 001 | Process for architectural deviations  | [001-process-for-architectural-deviations.md](./001-process-for-architectural-deviations.md) |

New product or stack decisions should get the next free number and a concise slug. **Policy-only** ADRs (like 001) still use the same numbering stream so the index stays linear.

Updates that **change** an accepted decision should add a superseding ADR (or clearly mark supersession in the new file), not silently rewrite history.
