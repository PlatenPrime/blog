# Supply chain (step 076)

Dependabot + GitHub secret scanning. Config: [`.github/dependabot.yml`](../../.github/dependabot.yml).

## Dependabot

| Ecosystem        | Scope                          | Schedule                         |
| ---------------- | ------------------------------ | -------------------------------- |
| `npm`            | Root `package.json` / lockfile | Weekly (Monday, Europe/Kyiv)     |
| `github-actions` | Workflows under `.github/`     | Weekly (Monday, Europe/Kyiv)     |
| Docker           | Not configured                 | Local Postgres only — outside v1 |

Minor/patch bumps for production and development deps are **grouped** to keep PR noise low. Open PR limit: **5** per ecosystem.

Flow: Dependabot opens PR → CI (`quality` job) must pass → review → merge.

### Ignore policy

**Merge / prioritize**

- Security / Dependabot alerts (CVE) ahead of cosmetic version bumps.
- Action version bumps that keep CI green.

**Defer or ignore (do not silent-close without a reason)**

- **Major** bumps of Next, Payload, React, or other framework peers — only with an explicit numbered roadmap step or ADR, not as a drive-by Dependabot merge.
- Breaking peer-dependency conflicts that fail `npm ci` / typecheck.
- Noisy transitive bumps with **no** advisory — comment on the PR and close, or add a scoped `ignore` in `dependabot.yml` only for that package/version range.

**How to ignore**

1. Prefer a comment on the Dependabot PR (`@dependabot ignore this dependency` / `ignore this major version`) so the reason stays in the thread.
2. Put `ignore:` in [`.github/dependabot.yml`](../../.github/dependabot.yml) only for lasting, deliberate pins — not a blanket ignore of everything.

Never close a **security** update without triage (accept risk in writing, or schedule the fix).

## Secret scanning

Enable in the GitHub repo (not in YAML):

1. **Settings → Code security** (or Code security and analysis).
2. Turn on **Secret scanning**.
3. Turn on **Push protection** (blocks pushes that contain known secret patterns).

Public repositories: secret scanning and push protection are available on the free plan. Private repositories: availability depends on the GitHub plan / Advanced Security — enable what the plan allows and note any gap in [checklist.md](./checklist.md) (waivers / ops must).

Repo hygiene:

- Commit **only** [`.env.example`](../../.env.example); never `.env` or real keys.
- App/runtime secrets live in Vercel Environment Variables and GitHub Actions Secrets. Matrix (which key where): [runbooks/secrets.md](../runbooks/secrets.md).

### If scanning alerts

1. **Revoke** the leaked credential at the provider.
2. **Rotate** / issue a new secret; update Vercel / Actions / local `.env`.
3. Confirm the new value is not in git; if the leak is in history, treat history rewrite / purge as a separate ops decision — rotate first either way.

## Verify

- [`.github/dependabot.yml`](../../.github/dependabot.yml) is valid Dependabot v2 config (ecosystems + directories exist).
- After merge to `main`: Dependabot is enabled under **Settings → Code security**, and a version-update PR appears on the next scheduled run (or sooner if you trigger updates manually).
- Secret scanning + push protection toggles are on (or waived with plan limitation noted).
