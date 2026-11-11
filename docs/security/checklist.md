# Security checklist

Операционная шпаргалка Track 8 (шаги **073–078**): что уже есть в коде, как проверить перед публичным запуском и что сознательно не делаем в v1. Короткие галочки перед go-live — в [`production-checklist.md`](../production-checklist.md) (§Security). Полный gate выкладки (env, OAuth, Resend, R2, …) — шаг **108**.

Инварианты ниже должны совпадать с кодом и sibling-доками. Если расходятся — править документ или код, не оставлять «как хотелось бы».

Глубина политики (не дублировать здесь):

- [threat-model.md](./threat-model.md) — зоны угроз и residual
- [access-matrix.md](./access-matrix.md) — ACL коллекций
- [session-hardening.md](./session-hardening.md) — cookie / CSRF / stacking 074+075
- [supply-chain.md](./supply-chain.md) — Dependabot / secret scanning
- [ADR-002](../adr/002-auth-verification-and-account-linking.md), [ADR-006](../adr/006-rate-limiting.md)

---

## Инвентарь

### Security headers (073)

- Builders: [`src/security/headers.ts`](../../src/security/headers.ts); wiring — `headers()` в [`next.config.ts`](../../next.config.ts) (не proxy: `/admin` и `/api` тоже покрыты).
- Baseline: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geolocation/payment/usb off).
- HSTS только при `NODE_ENV=production`.
- CSP фаза 1 enforcing: public — `'unsafe-inline'` без `unsafe-eval`; `frame-src` → `youtube-nocookie`; `img-src` + origin из `R2_PUBLIC_URL`; Turnstile origins (`challenges.cloudflare.com`) в `script-src` / `frame-src` / `connect-src` (075).
- `/admin/:path*` — мягкая CSP (`'unsafe-eval'` + R2 public/endpoint в `connect-src` для client uploads).

### Rate limiting (074)

- ADR-006: Upstash Redis REST + `@upstash/ratelimit` только для счётчиков; без env — memory fallback (+ warn в production).
- Dual layer: [`src/proxy.ts`](../../src/proxy.ts) IP → HTTP **429** / `Retry-After` на POST auth pages; actions — email / userId / IP keys + i18n (`src/security/rateLimit.ts`, политики в `rateLimitPolicies.ts`).
- Поверхности: login / register / forgot / reset / comments (comments по `userId`).
- Articles/notes pages **не** режутся в proxy (Next-Action общий с bookmarks).

### Turnstile (075)

- Виджет [`TurnstileWidget`](../../src/components/turnstile/turnstile-widget.tsx) на login / register (`AuthForm.requireTurnstile`) и comment form.
- Server verify: [`src/security/turnstile.ts`](../../src/security/turnstile.ts) → Cloudflare `siteverify`; actions читают `cf-turnstile-response` **до** rate limit.
- Пустые ключи = bypass (+ warn в production), как Upstash.
- Forgot / reset **без** виджета (граница 075); там остаются 074 + Payload `forgotPassword.minRequestInterval`.

### Session / ACL

- Cookies: HttpOnly (Payload default), `SameSite=Lax`, `Secure` в production; `maxLoginAttempts: 8` + lockout; token 7d — [session-hardening.md](./session-hardening.md), [`Users.ts`](../../src/collections/Users.ts).
- CSRF / CORS allowlist = `NEXT_PUBLIC_SERVER_URL`.
- Verified readers для comments / bookmarks — ADR-002; роли меняет только admin — [access-matrix.md](./access-matrix.md).
- Logout: `/logout`; «Log out everywhere» → `allSessions: true`.

### Lexical / media / R2

- Body = Lexical JSON → JSX converters (`PayloadRichText`), не raw HTML dump.
- YouTube block: только `youtube-nocookie` ([`src/lib/youtube.ts`](../../src/lib/youtube.ts)).
- Media CUD admin-only; MIME jpeg/png/webp/gif **без SVG**; max **5 MiB**; WebP convert — [`mediaLimits.ts`](../../src/collections/mediaLimits.ts).
- Published media **public-read by design**; CORS allowlist — [runbooks/r2-media.md](../runbooks/r2-media.md).
- CSP allowlists `R2_PUBLIC_URL` origin в `img-src` / admin `connect-src`.

### Comments spam

- Create = authenticated + verified; Turnstile (075) + rate limit by `userId` (074).
- Body max `COMMENT_BODY_MAX` (2000); author из session.
- UI: React text (`whitespace-pre-wrap`), не `dangerouslySetInnerHTML`.
- `moderationStatus` admin-only; public read = approved (или admin).

### Supply chain (076)

- [`.github/dependabot.yml`](../../.github/dependabot.yml): `npm` + `github-actions`, weekly, groups minor/patch.
- Политика ignore / secret scanning / push protection / alert response — [supply-chain.md](./supply-chain.md) (не дублировать здесь).

---

## Чеклист must (код Track 8)

Пункты ниже закрыты фактом кода/доков шагов **073–077**. Регрессия → править код или этот документ.

### Headers

- [x] Public response несёт baseline headers + CSP (073; `src/security/headers.ts`).
- [x] `/admin` имеет отдельную (мягкую) CSP, не ломающую Payload uploads (073).
- [x] HSTS только в production (073).

### Rate limit + Turnstile

- [x] Proxy отдаёт 429 на превышение POST auth (074; ADR-006).
- [x] Actions режут login/register/forgot/reset/comments по identity keys (074).
- [x] Turnstile на login / register / comment; server verify до rate limit (075).
- [x] Пустые Turnstile / Upstash keys = documented bypass + prod warn (074/075).

### Session / ACL / content

- [x] Cookie / CSRF / lockout / forgot interval — [session-hardening.md](./session-hardening.md).
- [x] Access matrix совпадает с collection `access` ([access-matrix.md](./access-matrix.md)).
- [x] Lexical JSX + YouTube allowlist + media MIME без SVG (threat-model XSS/R2).
- [x] Comments: verified create + text-safe render + admin moderation (threat-model comments).

### Threat model

- [x] Stub v1 существует; residual помечены; контрмеры ссылаются на Track 8 ([threat-model.md](./threat-model.md), 077).

---

## Чеклист must (ops до публичного go-live)

Закрывает оператор перед публичным URL (или waive с причиной в таблице ниже). Полный env/OAuth/R2 — шаг **108**. Короткие копии — [`production-checklist.md`](../production-checklist.md) (§Security).

- [ ] **Dependabot:** Settings → Code security → Dependabot updates/alerts включены; конфиг [`.github/dependabot.yml`](../../.github/dependabot.yml) валиден (076 / [supply-chain.md](./supply-chain.md)).
- [ ] **Secret scanning** включён (или waived: private repo / plan limitation — строка в waivers).
- [ ] **Push protection** включён (или waived там же).
- [ ] **Prod Turnstile:** `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` не пустые на preview/prod (иначе bypass).
- [ ] **Prod Upstash:** `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` заданы на serverless (иначе memory per-isolate).
- [ ] **Headers smoke:** на prod URL видны `X-Frame-Options` / CSP / (prod) HSTS; публичные страницы и `/admin` открываются.
- [ ] **ACL sanity:** anonymous не пишет Media/Comments; unverified reader не создаёт comment; reader не заходит в `/admin`.

---

## Сознательно нет / waivers (не считать багом чеклиста)

| Нет / residual                         | Заметка                                                         |
| -------------------------------------- | --------------------------------------------------------------- |
| MFA / WebAuthn                         | v1 out of scope (tech-stack §16, threat-model)                  |
| Product WAF                            | Вне приложения; Cloudflare product WAF не часть 073–078         |
| Nonce/hash CSP                         | Public CSP phase 1 с `'unsafe-inline'`; ужесточение позже       |
| Turnstile на forgot / reset            | Граница 075; защита = 074 + Payload interval                    |
| Private / signed R2 media              | Public-read by design для published media                       |
| Custom R2 CDN domain                   | v1 out of scope                                                 |
| AI / auto comment moderation           | Только ручной `moderationStatus`                                |
| Multi-tenant / multi-author CMS        | Один admin                                                      |
| Full STRIDE worksheets                 | Stub threat-model достаточно для v1                             |
| Live Turnstile / 429 e2e в CI          | Waived (**085** / **086** cancelled); unit + ручной poke        |
| Analytics / consent CSP origins        | Шаги **081** / **097**                                          |
| Secret scanning на private (если plan) | Waive только с явной пометкой плана GitHub; иначе must ops выше |

---

## Тесты-якоря (regression)

Не DoD ручной ops-проверки, но место правки при регрессии:

| Область       | Тест                                                                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Headers / CSP | `tests/unit/securityHeaders.test.ts`                                                                                                                  |
| Rate limit    | `tests/unit/rateLimit.test.ts`, `tests/unit/rateLimitMiddleware.test.ts`                                                                              |
| Turnstile     | `tests/unit/turnstile.test.ts` (+ CSP cases в `securityHeaders.test.ts`)                                                                              |
| Access / auth | `tests/unit/access.test.ts`, `readerAccess.test.ts`, `mediaAccess.test.ts`; `tests/int/auth.int.spec.ts`, `comments.int.spec.ts`, `media.int.spec.ts` |
