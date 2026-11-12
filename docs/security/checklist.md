# Security checklist

Операционная шпаргалка Track 8 (шаги **073–078**): что уже есть в коде, как проверить перед публичным запуском и что сознательно не делаем в v1. Продукт после pivot — **admin + anonymous guests** ([ADR-007](../adr/007-author-only-no-public-auth.md)). Короткие галочки перед go-live — в [`production-checklist.md`](../production-checklist.md) (§Security). Полный gate выкладки (env, R2, …) — шаг **108**.

Инварианты ниже должны совпадать с кодом и sibling-доками. Если расходятся — править документ или код, не оставлять «как хотелось бы».

Глубина политики (не дублировать здесь):

- [threat-model.md](./threat-model.md) — зоны угроз и residual
- [access-matrix.md](./access-matrix.md) — ACL коллекций
- [session-hardening.md](./session-hardening.md) — cookie / CSRF для admin
- [supply-chain.md](./supply-chain.md) — Dependabot / secret scanning

---

## Инвентарь

### Security headers (073)

- Builders: [`src/security/headers.ts`](../../src/security/headers.ts); wiring — `headers()` в [`next.config.ts`](../../next.config.ts) (не proxy: `/admin` и `/api` тоже покрыты).
- Baseline: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geolocation/payment/usb off).
- HSTS только при `NODE_ENV=production`.
- CSP фаза 1 enforcing: public — `'unsafe-inline'` без `unsafe-eval`; `frame-src` → `youtube-nocookie`; `img-src` + origin из `R2_PUBLIC_URL`.
- `/admin/:path*` — мягкая CSP (`'unsafe-eval'` + R2 public/endpoint в `connect-src` для client uploads).

### Session / ACL (admin only)

- Cookies: HttpOnly (Payload default), `SameSite=Lax`, `Secure` в production; `maxLoginAttempts: 8` + lockout; token 7d — [session-hardening.md](./session-hardening.md), [`Users.ts`](../../src/collections/Users.ts).
- CSRF / CORS allowlist = `NEXT_PUBLIC_SERVER_URL`.
- Публичный сайт без login/register; только admin в `/admin` — [access-matrix.md](./access-matrix.md).

### Lexical / media / R2

- Body = Lexical JSON → JSX converters (`PayloadRichText`), не raw HTML dump.
- YouTube block: только `youtube-nocookie` ([`src/lib/youtube.ts`](../../src/lib/youtube.ts)).
- Media CUD admin-only; MIME jpeg/png/webp/gif **без SVG**; max **5 MiB**; WebP convert — [`mediaLimits.ts`](../../src/collections/mediaLimits.ts).
- Published media **public-read by design**; CORS allowlist — [runbooks/r2-media.md](../runbooks/r2-media.md).
- CSP allowlists `R2_PUBLIC_URL` origin в `img-src` / admin `connect-src`.

### Removed product surfaces (historical)

- Reader auth, comments, bookmarks, Resend, Google OAuth, Upstash rate limits, Turnstile — **сняты** (ADR-007). Шаги 074–075, 028–029, 082 в роадмапе остаются историей; env и ops-чеклисты на них **не** опираются.

### Supply chain (076)

- [`.github/dependabot.yml`](../../.github/dependabot.yml): `npm` + `github-actions`, weekly, groups minor/patch.
- Политика ignore / secret scanning / push protection / alert response — [supply-chain.md](./supply-chain.md) (не дублировать здесь).

---

## Чеклист must (код Track 8)

Пункты ниже закрыты фактом кода/доков шагов **073–077** (с учётом ADR-007).

### Headers

- [x] Public response несёт baseline headers + CSP (073; `src/security/headers.ts`).
- [x] `/admin` имеет отдельную (мягкую) CSP, не ломающую Payload uploads (073).
- [x] HSTS только в production (073).

### Session / ACL / content

- [x] Cookie / CSRF / lockout — [session-hardening.md](./session-hardening.md).
- [x] Access matrix совпадает с collection `access` ([access-matrix.md](./access-matrix.md)).
- [x] Lexical JSX + YouTube allowlist + media MIME без SVG (threat-model XSS/R2).

### Threat model

- [x] Stub v1 существует; residual помечены; контрмеры ссылаются на Track 8 + ADR-007 ([threat-model.md](./threat-model.md), 077).

---

## Чеклист must (ops до публичного go-live)

Закрывает оператор перед публичным URL (или waive с причиной в таблице ниже). Полный env/R2 — шаг **108**. Короткие копии — [`production-checklist.md`](../production-checklist.md) (§Security).

- [ ] **Dependabot:** Settings → Code security → Dependabot updates/alerts включены; конфиг [`.github/dependabot.yml`](../../.github/dependabot.yml) валиден (076 / [supply-chain.md](./supply-chain.md)).
- [ ] **Secret scanning** включён (или waived: private repo / plan limitation — строка в waivers).
- [ ] **Push protection** включён (или waived там же).
- [ ] **Headers smoke:** на prod URL видны `X-Frame-Options` / CSP / (prod) HSTS; публичные страницы и `/admin` открываются.
- [ ] **ACL sanity:** anonymous не пишет Media и контент; только admin заходит в `/admin`.

---

## Сознательно нет / waivers (не считать багом чеклиста)

| Нет / residual                | Заметка                                        |
| ----------------------------- | ---------------------------------------------- |
| MFA / WebAuthn                | v1 out of scope (tech-stack §16, threat-model) |
| Product WAF                   | Вне приложения                                 |
| Nonce/hash CSP                | Public CSP phase 1 с `'unsafe-inline'`         |
| Private / signed R2 media     | Public-read by design                          |
| Custom R2 CDN domain          | v1 out of scope                                |
| Multi-tenant / multi-author   | Один admin                                     |
| Reader / comment / rate limit | Superseded ADR-007                             |
| Analytics / consent CSP       | Шаги **081** / **097**                         |

---

## Тесты-якоря (regression)

Не DoD ручной ops-проверки, но место правки при регрессии:

| Область       | Тест                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Headers / CSP | `tests/unit/securityHeaders.test.ts`                                                              |
| Access        | `tests/unit/access.test.ts`, `tests/unit/contentAccess.test.ts`, `tests/unit/mediaAccess.test.ts` |
| Media API     | `tests/int/media.int.spec.ts` (needs Postgres)                                                    |

Legacy tests (`readerAccess`, `comments*`, `bookmarks*`, `rateLimit`, `turnstile`, `auth.int`) — к удалению/рефактору отдельно от docs pivot.
