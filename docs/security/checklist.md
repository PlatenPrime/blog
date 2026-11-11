# Security checklist

Операционная шпаргалка Track 8 (шаги **073–078**): что уже есть в коде, как проверить перед выкладкой и что сознательно waived. Короткие галочки перед go-live — в [`production-checklist.md`](../production-checklist.md) (§Security). Полный gate выкладки (env, OAuth, R2, …) — шаг **108**. Модель угроз — [`threat-model.md`](./threat-model.md); политика зависимостей и секретов — [`supply-chain.md`](./supply-chain.md).

Инварианты ниже должны совпадать с кодом. Если расходятся — править документ или код, не оставлять «как хотелось бы».

**Must:** закрыто кодом шагов **073–077** (см. инвентарь) **или** явно в «Сознательно нет / waived». Ops-галочки (GitHub Settings, prod keys) — для руки перед go-live; пустые ячейки там не дырка DoD шага **078**.

---

## Инвентарь

### Security headers (073) — закрыто кодом

- Builders: [`src/security/headers.ts`](../../src/security/headers.ts); подключение — `headers()` в [`next.config.ts`](../../next.config.ts) (не proxy: `/admin` и `/api` вне matcher next-intl).
- Baseline на все пути: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera / microphone / geolocation / payment / usb off).
- HSTS только при `NODE_ENV=production`.
- CSP фаза 1 enforcing: public — `'unsafe-inline'` без eval; `frame-src` youtube-nocookie; `img-src` + origin из `R2_PUBLIC_URL`; Turnstile origins (`challenges.cloudflare.com`) в `script-src` / `frame-src` / `connect-src`.
- `/admin/:path*` — мягкая CSP (`'unsafe-eval'` + R2 public/endpoint в `connect-src` для client uploads).

### Rate limiting (074) — закрыто кодом

- ADR: [`adr/006-rate-limiting.md`](../adr/006-rate-limiting.md).
- Store: Upstash Redis REST (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`); без env — memory fallback (+ warn в prod).
- Proxy: IP → HTTP **429** + `Retry-After` на `POST` login / register / forgot / reset ([`src/security/rateLimitMiddleware.ts`](../../src/security/rateLimitMiddleware.ts) + [`src/proxy.ts`](../../src/proxy.ts)).
- Actions: email / userId / IP keys + i18n (`register` / `login` / `forgot` / `reset` / comments) — [`src/security/rateLimit.ts`](../../src/security/rateLimit.ts); политики — [`rateLimitPolicies.ts`](../../src/security/rateLimitPolicies.ts).
- Articles/notes POST в proxy **не** режем (общий Next-Action с bookmarks).

### Cloudflare Turnstile (075) — закрыто кодом

- Виджет на login / register (`AuthForm.requireTurnstile`) и comment form; forgot / reset **без** виджета (deliverables 075).
- Server verify: [`src/security/turnstile.ts`](../../src/security/turnstile.ts) → Cloudflare `siteverify`; actions читают `cf-turnstile-response` **до** rate limit.
- Env: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`. Пустые ключи = bypass (+ warn в prod) — для local/CI; **в prod keys must быть заданы** (ops).

### Session / CSRF / access (до Track 8) — закрыто кодом

- Cookies / CSRF / logout — [`session-hardening.md`](./session-hardening.md) (шаг **030**).
- ACL guest / reader / admin — [`access-matrix.md`](./access-matrix.md) (шаг **031**). Не дублировать матрицу здесь.

### Supply chain (076) — конфиг в репо; тумблеры = ops

- [`.github/dependabot.yml`](../../.github/dependabot.yml): `npm` + `github-actions`, weekly Monday Europe/Kyiv, open-PR limit 5; minor/patch grouped.
- Политика ignore / secret scanning / push protection / revoke→rotate — [`supply-chain.md`](./supply-chain.md).
- GitHub **Settings → Code security**: Dependabot updates/alerts, Secret scanning, Push protection — руками (или waiver по плану).

### Threat model (077) — закрыто документом

- Stub v1: [`threat-model.md`](./threat-model.md) — auth, XSS/Lexical, R2/media, comments spam; residual помечены; supply chain только ссылкой на **076**.

---

## Чеклист проверки

Предпосылка: `npm run dev` (или preview/prod URL). Для Turnstile/Upstash smoke в prod-like среде — соответствующие env из [`.env.example`](../../.env.example).

### Headers / CSP

- [ ] Public page: ответ содержит `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` с выключенными camera/mic/geo.
- [ ] Production (или `NODE_ENV=production` preview): есть `Strict-Transport-Security`.
- [ ] Public: есть `Content-Security-Policy` без `'unsafe-eval'`; страница и YouTube nocookie embed не ломаются.
- [ ] `/admin`: UI Payload открывается; client upload в R2 не упирается в CSP `connect-src`.

### Rate limiting

- [ ] Серия быстрых `POST` на `/{locale}/login` (или register/forgot) → **HTTP 429** и заголовок `Retry-After` (proxy layer).
- [ ] Превышение лимита на login/register/comment action → i18n ошибка rate limit (не silent success).

### Turnstile

- [ ] С заданными ключами: submit login/register/comment **без** токена → отказ (`errors.turnstileFailed` / эквивалент).
- [ ] С валидным токеном виджета форма проходит (дальше обычная валидация auth/comment).
- [ ] В **production** env заданы `NEXT_PUBLIC_TURNSTILE_SITE_KEY` и `TURNSTILE_SECRET_KEY` (пустые = bypass — не leave as-is).

### Session

- [ ] После login cookie сессии: HttpOnly; SameSite=Lax; в production — Secure.
- [ ] `GET`/`POST` `/logout` сбрасывает текущую сессию; «Log out everywhere» на home закрывает все сессии.

---

## Ops перед go-live

Не полный **108** — только security must, которые нельзя закрыть одним diff репозитория:

- [ ] **Upstash:** в production заданы `UPSTASH_REDIS_REST_URL` и `UPSTASH_REDIS_REST_TOKEN` (иначе memory fallback + warn; для multi-isolate Vercel — must).
- [ ] **Turnstile:** site + secret keys в production (см. выше).
- [ ] **Dependabot:** Settings → Code security → Dependabot updates/alerts включены; конфиг [`.github/dependabot.yml`](../../.github/dependabot.yml) на `main`.
- [ ] **Secret scanning** + **Push protection** включены — или явный waiver (private plan / Advanced Security) с пометкой ниже / в PR.
- [ ] Секреты только в Vercel / Actions Secrets; в git только [`.env.example`](../../.env.example).

Waiver GitHub (если нужен): _план / ограничение: _____________ ; дата: _____________ ; кто: _____________.

---

## Сознательно нет / waived (v1)

Не считать багом этого чеклиста:

| Нет / residual                   | Заметка                                                        |
| -------------------------------- | -------------------------------------------------------------- |
| MFA / WebAuthn                   | Out of scope v1 (threat model)                                 |
| Product WAF                      | Бесплатные возможности платформы позже; не Track 8 deliverable |
| Nonce / hash CSP                 | Phase 1 `'unsafe-inline'` на public; ужесточение — позже       |
| Turnstile на forgot / reset      | Вне deliverables **075**; rate limit **074** остаётся          |
| Private / signed R2 media        | Public-read by design для опубликованных объектов              |
| Live Turnstile e2e / CI e2e 429  | Unit + headers e2e локально; CI e2e — **086**                  |
| AI / auto comment moderation     | Ручной `moderationStatus`                                      |
| Multi-tenant / multi-author CMS  | Один admin                                                     |
| Custom R2 CDN domain             | Позже                                                          |
| Full STRIDE worksheets           | Stub четырёх зон достаточно для v1                             |
| Dependabot Docker ecosystem      | Локальный Postgres only                                        |
| Cookie consent / Privacy / Terms | Track 9 (**079–081**), не Security track                       |

---

## Тесты-якоря (regression)

Не DoD ручной проверки, но место правки при регрессии:

| Область       | Тест                                                                           |
| ------------- | ------------------------------------------------------------------------------ |
| Headers / CSP | `tests/unit/securityHeaders.test.ts`, `tests/e2e/security-headers.e2e.spec.ts` |
| Rate limit    | `tests/unit/rateLimit.test.ts`, `tests/unit/rateLimitMiddleware.test.ts`       |
| Turnstile     | `tests/unit/turnstile.test.ts`                                                 |
| Auth session  | `tests/e2e/auth.e2e.spec.ts`                                                   |
