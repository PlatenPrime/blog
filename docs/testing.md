# Политика тестирования

Канон: что **обязано** быть под тестами, чем мы **не** гоняемся, и как это стыкуется с CI и шагами роадмапа.

Стек раннеров — [`tech-stack.md`](./tech-stack.md) §12. Порядок внедрения suite — [`development-roadmap.md`](./development-roadmap.md) (024, 061, 083–087; **085** отказался от Playwright, **086** cancelled).

---

## Принцип

Покрываем **критичную бизнес-логику и инварианты доступа** Vitest’ом.  
Ключевые UX-потоки проверяем **ручным poke** (команды + клики), не браузерным e2e.  
Не целимся в процент coverage и не дублируем одно и то же на двух слоях.

Если шаг роадмапа добавляет тестируемую логику (helper, access, формула, правило slug) — тесты на неё появляются **в том же изменении** (или сразу в следующем dedicated test-шаге, если роадмап так разнесён: например 024 после модели).

После каждого шага — review gate (см. ниже и правило в `.cursor/rules/roadmap-one-step.mdc`): не только «зелёный CI», но и «это здравый смысл / best practices / не переусложнили».

**Verify шага ≠ только автотесты:** агент обязан дать человеку подробный poke-path (команды + клики) и краткое «что вынести» — см. блок «Итог шага для человека» в `.cursor/rules/roadmap-one-step.mdc`.

---

## Слои

| Слой        | Инструмент          | Каталог         | Когда запускать                                                                         |
| ----------- | ------------------- | --------------- | --------------------------------------------------------------------------------------- |
| Unit        | Vitest              | `tests/unit/**` | Всегда локально и в CI (`npm test`)                                                     |
| Integration | Vitest + Payload/DB | `tests/int/**`  | Локально при работе с access/API (`npm run test:int`); в CI — по мере зрелости pipeline |

Браузерный E2E (Playwright) **снят** шагом **085**: не держится локально и в Actions; suite удалён.

`npm run ci` сейчас: lint + format:check + typecheck + **unit**.

---

## Что обязательно покрывать

### Unit (Vitest) — must

Чистая логика без браузера и без обязательной БД:

- Access helpers (`isAdmin`, `publishedOrAdmin`, `publicContentWhere` — author-only, ADR-007)
- Slugify / правила slug
- Reading time и подобные формулы
- i18n fallback (missing locale не роняет 500)
- Search query builders / нормализация query
- Инварианты модели в helpers, если вынесены из Payload hooks
- Парсеры / сериализаторы контента (TOC из headings, JSON-LD smoke-parse и т.п.), когда появятся

**Сейчас (после 084/085, pivot ADR-007):** must в CI — slugify, access (`isAdmin`, `publishedOrAdmin`, `publicContentWhere`), content/media access wiring, search/feed/articles/notes/taxonomy/pages queries, SEO (sitemap, RSS, OG, JSON-LD, metadata), i18n, security headers, cookie consent, related content, reading time, TOC, code highlight и др. — см. каталог `tests/unit/**`. Integration must: `tests/int/media.int.spec.ts`, `tests/int/contentLocale.int.spec.ts`. **Legacy** (reader/comments/bookmarks/rate limit/Turnstile/auth int) может ещё лежать в дереве — не канон продукта; удаление/рефактор отдельно. Публичный UX и admin login — **ручной poke** (LOCAL_SETUP).

### Integration (Payload Local API / DB) — must для границ доступа

Когда появляется соответствующее поведение (author-only, ADR-007):

- Anonymous не пишет Articles/Notes/Pages/taxonomy
- Media upload: anonymous → отказ (шаг **039**)
- Drafts / visibility на уровне API, если логика не только в UI

Не дублировать здесь полный UI admin.

### UX / продукт — ручной poke, не e2e

Playwright suite удалён (**085**). Для продуктовых потоков (публичная навигация, share, theme, drafts не видны анониму, admin login) — poke-path в LOCAL_SETUP и в итоге шага агента. A11y smoke (axe) waived вместе с e2e.

Admin CMS: точечный poke при необходимости; не полный CRUD каждого поля в автотестах.

### Что обычно не тестируем отдельно

- Тривиальный scaffold / generated types
- Визуальный pixel-perfect и браузерные скриншоты
- Сторонние SDK «как работают сами по себе»
- Каждый Lexical node в изоляции без нашей обёртки

---

## Ожидание по coverage

| Метрика          | Политика                                                      |
| ---------------- | ------------------------------------------------------------- |
| % lines/branches | **Не** gate и не цель                                         |
| Критичные модули | Нет «логики только в голове»: helpers/access/формулы — с unit |
| Регрессии UX     | Ручной poke; контракты — unit/int                             |
| CI               | Unit обязателен с шага 012; e2e не gate (**086** cancelled)   |

---

## Карта роадмапа → тесты

| Шаги    | Фокус тестов                                                                                                         |
| ------- | -------------------------------------------------------------------------------------------------------------------- |
| 010     | Vitest bootstrap (smoke)                                                                                             |
| 011     | Playwright bootstrap (исторический); suite снят в **085**                                                            |
| 024     | Unit: slugify, role/access helpers (historical reader helpers — superseded ADR-007)                                  |
| 032     | Auth flows: исторически e2e; сейчас unit/int + poke                                                                  |
| 039     | Integration/API: media upload denied without admin session                                                           |
| 041     | Unit: locale prefix contract (ADR-004)                                                                               |
| 042     | Unit: UI catalog key parity (`uk` / `ru` / `en`)                                                                     |
| 043     | Unit: `resolveContentLocale`; int: article uk+ru+en + fallback                                                       |
| 045     | Unit: i18n fallback (`i18nFallback`, ADR-005) — done                                                                 |
| 046     | Нет unit: визуальная система. Ручной smoke `/[locale]/dev/design`                                                    |
| 047–056 | Публичка/chrome/theme: unit контракты где были; UX — poke (бывшие e2e сняты в **085**)                               |
| 057–061 | Исторически comments/bookmarks/account; **продукт снят** ADR-007; legacy тесты к удалению отдельно                   |
| 068     | Unit: find-args / excerpt / merge limit / XML escape (`rssQuery`)                                                    |
| 079–081 | Unit pages/cookie; footer Privacy/Terms и consent — poke                                                             |
| 083     | Эта политика (`docs/testing.md`)                                                                                     |
| 084     | Unit: `numberedPage`, `formatPublishedOn`, content access wiring (Articles/Notes/Pages/Categories/Tags/Users) — done |
| 085     | Отказ от Playwright: удалены e2e suite/deps; канон Vitest + poke                                                     |
| 086     | Cancelled: e2e в GitHub Actions не делаем                                                                            |
| 087     | Test data factories: user / article / note (без comment)                                                             |

---

## Review gate после каждого шага

Перед `done` / merge шага ответь явно (агент — в итоговом сообщении; человек — при ревью):

1. **Соответствие канону** — tech-stack, ADR, границы шага (не утащили соседний шаг).
2. **Архитектура** — решение простое настолько, насколько нужно; нет лишнего слоя/абстракции «на вырост без нужды».
3. **Best practices** — idiomatic для Next/Payload/TS; security basics (access, секреты, upload limits).
4. **Здравый смысл** — DoD шага выполнен; Verify воспроизводим; docs не врут.
5. **Тесты** — новая тестируемая логика покрыта или явно отложена на numbered test-шаг с ссылкой.
6. **Отложено сознательно** — что оставлено на следующие шаги (R2, WebP, factories и т.д.).

Если ответ на 2–4 «сомнительно» — не закрывай шаг: поправь или зафиксируй ADR/waive.

Плюс в финальном ответе агента: **Как проверить** (команды/действия) и **Что вынести** (смысл шага для роста разработчика).
