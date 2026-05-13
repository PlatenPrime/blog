/**
 * Dev smoke: assumes API and web dev servers are already listening.
 * Defaults: API http://127.0.0.1:4000/ , web http://127.0.0.1:3000/
 *
 * Env:
 *   API_HEALTH_URL / API_URL — base URL for API (GET /)
 *   WEB_HEALTH_URL / WEB_URL — base URL for web (GET /)
 *   SKIP_WEB=1 — only check API
 */

function rootUrl(base) {
  const u = new URL(base);
  u.pathname = '/';
  u.search = '';
  u.hash = '';
  return u.href;
}

async function check(name, url, { substring } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!res.ok) {
      console.error(`${name}: HTTP ${res.status} for ${url}`);
      return false;
    }
    const text = await res.text();
    if (substring && !text.includes(substring)) {
      console.error(
        `${name}: response body missing expected marker for ${url}`,
      );
      return false;
    }
    console.log(`${name}: OK (${res.status})`);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${name}: ${msg} (${url})`);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

const apiBase =
  process.env.API_HEALTH_URL ?? process.env.API_URL ?? 'http://127.0.0.1:4000';
const webBase =
  process.env.WEB_HEALTH_URL ?? process.env.WEB_URL ?? 'http://127.0.0.1:3000';

let ok = true;
ok = (await check('api', rootUrl(apiBase), { substring: 'Hello World' })) && ok;

if (process.env.SKIP_WEB !== '1') {
  ok = (await check('web', rootUrl(webBase), { substring: 'TanStack' })) && ok;
}

process.exit(ok ? 0 : 1);
