## Summary

<!-- What changed and why (1–3 bullets). -->

-

## Commits / title

Use [Conventional Commits](docs/commit-convention.md) for PR title and commit subjects:

`<type>(optional-scope): <description>`

Examples: `feat: …`, `fix: …`, `docs: …`, `chore: …`

CI job `commitlint` checks every commit on the PR range.

For **user-facing** `feat` / `fix` / breaking changes, add a Changesets file (`npm run changeset`) — see [docs/versioning.md](docs/versioning.md). Pure docs/chore/Dependabot usually skip it.

## Test plan

- [ ]
