# Политика тестирования

Канон: что **обязано** быть под тестами, чем мы **не** гоняемся, и как это стыкуется с CI и шагами роадмапа.

Стек раннеров — [`tech-stack.md`](./tech-stack.md) §12. Порядок внедрения suite — [`development-roadmap.md`](./development-roadmap.md) (024, 032, 061, 083–087).

---

## Принцип

Покрываем **критичную бизнес-логику, инварианты доступа и регрессии ключевых UX-потоков**.  
Не целимся в процент coverage и не дублируем одно и то же на трёх слоях.

Если шаг роадмапа добавляет тестируемую логику (helper, access, формула, правило slug/bookmark, auth flow) — тесты на неё появляются **в том же изменении** (или сразу в следующем dedicated test-шаге, если роадмап так разнесён: например 024 после модели).

После каждого шага — review gate (см. ниже и правило в `.cursor/rules/roadmap-one-step.mdc`): не только «зелёный CI», но и «это здравый смысл / best practices / не переусложнили».

**Verify шага ≠ только автотесты:** агент обязан дать человеку подробный poke-path (команды + клики) и краткое «что вынести» — см. блок «Итог шага для человека» в `.cursor/rules/roadmap-one-step.mdc`.

---

## Слои

| Слой        | Инструмент          | Каталог         | Когда запускать                                                                         |
| ----------- | ------------------- | --------------- | --------------------------------------------------------------------------------------- |
| Unit        | Vitest              | `tests/unit/**` | Всегда локально и в CI (`npm test`)                                                     |
| Integration | Vitest + Payload/DB | `tests/int/**`  | Локально при работе с access/API (`npm run test:int`); в CI — по мере зрелости pipeline |
| E2E         | Playwright          | `tests/e2e/**`  | Локально для UX/auth (`npm run test:e2e`); в CI — шаг **086**                           |

`npm run ci` сейчас: lint + format:check + typecheck + **unit**. E2E в CI — позже (086).

---

## Что обязательно покрывать

### Unit (Vitest) — must

Чистая логика без браузера и без обязательной БД:

- Access helpers (`isAdmin`, `isSelfOrAdmin`, role checks и аналоги)
- Slugify / правила slug
- Reading time и подобные формулы
- i18n fallback (missing locale не роняет 500)
- Search query builders / нормализация query
- Инварианты модели в helpers (например uniqueness bookmark), если вынесены из Payload hooks
- Парсеры / сериализаторы контента (TOC из headings, JSON-LD smoke-parse и т.п.), когда появятся

**Сейчас (после 051):** unit — `slugify`, access helpers (+ `isVerified`), `bookmarkUniqueness`, `rateLimit`, контракт префикса локали (`tests/unit/i18nRouting.test.ts`), паритет ключей словарей (`tests/unit/i18nMessages.test.ts`), `resolveContentLocale` (`tests/unit/contentLocale.test.ts`), i18n fallback / missing key no-throw (`tests/unit/i18nFallback.test.ts`, ADR-005), аргументы публичного find главной (`tests/unit/latestPublic.test.ts`), склейка и страница ленты (`tests/unit/feedQuery.test.ts`), аргументы списка и страницы статей (`tests/unit/articlesQuery.test.ts`). Integration — comments/bookmarks + `tests/int/auth.int.spec.ts` (register/login/verify/reset, reader≠articles) + `tests/int/contentLocale.int.spec.ts` (uk+ru+en + fallback на `uk`). E2E auth — `tests/e2e/auth.e2e.spec.ts` (локально; CI e2e — шаг **086**), лейблы из каталога `uk`, плюс проверка `/ru/login` и `/en/login`; language switcher — `tests/e2e/language-switcher.e2e.spec.ts`; theme toggle — `tests/e2e/theme.e2e.spec.ts`; chrome landmarks — `tests/e2e/site-chrome.e2e.spec.ts`; главная — `tests/e2e/home.e2e.spec.ts` (бренд и screenshot hero); лента — `tests/e2e/feed.e2e.spec.ts` (маршрут вместо 404, `?page=0`); статьи — `tests/e2e/articles.e2e.spec.ts` (список вместо 404, `?page=0`, неизвестный slug).

### Integration (Payload Local API / DB) — must для границ доступа

Когда появляется соответствующее поведение:

- Reader не пишет Articles/Notes; anonymous не создаёт comments
- Media upload: reader → отказ (шаг **039**)
- Drafts / visibility на уровне API, если логика не только в UI
- Bookmark duplicate blocked

Не дублировать здесь полный UI admin.

### E2E (Playwright) — must для продуктовых потоков

- Auth: register / login / logout / reset (happy + ключевые negative) — шаг **032**
- Reader: comments + bookmarks — шаг **061**
- Публичка: nav, theme, open article/note; drafts не видны анониму — Track 5/6
- A11y smoke (axe) на home / article / login — шаг **085**

Admin CMS: только точечный smoke при необходимости; не полный CRUD каждого поля.

### Что обычно не тестируем отдельно

- Тривиальный scaffold / generated types
- Визуальный pixel-perfect без договорённости (достаточно interaction + a11y smoke)
- Сторонние SDK «как работают сами по себе»
- Каждый Lexical node в изоляции без нашей обёртки

---

## Ожидание по coverage

| Метрика          | Политика                                                      |
| ---------------- | ------------------------------------------------------------- |
| % lines/branches | **Не** gate и не цель                                         |
| Критичные модули | Нет «логики только в голове»: helpers/access/формулы — с unit |
| Регрессии UX     | Ключевые flows — с e2e, когда feature жива                    |
| CI               | Unit обязателен с шага 012; e2e — с 086                       |

---

## Карта роадмапа → тесты

| Шаги      | Фокус тестов                                                                                                                                    |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 010 / 011 | Bootstrap runners (уже есть smoke)                                                                                                              |
| 024       | Unit: slugify, role/access helpers, bookmark uniqueness helpers                                                                                 |
| 032       | E2E auth suite                                                                                                                                  |
| 039       | Integration/API: media upload 403 for reader                                                                                                    |
| 041       | Unit: locale prefix contract (ADR-004)                                                                                                          |
| 042       | Unit: UI catalog key parity (`uk` / `ru` / `en`)                                                                                                |
| 043       | Unit: `resolveContentLocale`; int: article uk+ru+en + fallback                                                                                  |
| 045       | Unit: i18n fallback (`i18nFallback`, ADR-005) — done                                                                                            |
| 046       | Нет unit: визуальная система. Ручной smoke `/[locale]/dev/design`. Screenshot витрины токенов — 056. Hero главной — 049                         |
| 047       | E2E: system theme, toggle пишет `localStorage`, reload хранит выбор (`theme.e2e`). Screenshot suite — 056                                       |
| 048       | Unit: канон путей chrome (`siteNav`). E2E: landmarks, префикс ссылки, узкий viewport (`site-chrome.e2e`). Screenshot chrome — 056               |
| 049       | Unit: аргументы публичного find (`latestPublicQuery`). E2E: бренд uk/ru/en и screenshot hero light/dark (`home.e2e`)                            |
| 050       | Unit: склейка ленты, окно страницы, аргументы find/count (`feedQuery`). E2E: `/feed` вместо 404 и сброс `?page=0` (`feed.e2e`). Скриншоты — 056 |
| 061       | E2E comments/bookmarks + Vitest access                                                                                                          |
| 083       | Эта политика (`docs/testing.md`)                                                                                                                |
| 084       | Расширение Vitest на пробелы домена                                                                                                             |
| 085       | Playwright a11y smoke                                                                                                                           |
| 086       | E2E в GitHub Actions                                                                                                                            |
| 087       | Test data factories                                                                                                                             |

---

## Review gate после каждого шага

Перед `done` / merge шага ответь явно (агент — в итоговом сообщении; человек — при ревью):

1. **Соответствие канону** — tech-stack, ADR, границы шага (не утащили соседний шаг).
2. **Архитектура** — решение простое настолько, насколько нужно; нет лишнего слоя/абстракции «на вырост без нужды».
3. **Best practices** — idiomatic для Next/Payload/TS; security basics (access, секреты, upload limits).
4. **Здравый смысл** — DoD шага выполнен; Verify воспроизводим; docs не врут.
5. **Тесты** — новая тестируемая логика покрыта или явно отложена на numbered test-шаг с ссылкой.
6. **Отложено сознательно** — что оставлено на следующие шаги (R2, WebP, e2e в CI и т.д.).

Если ответ на 2–4 «сомнительно» — не закрывай шаг: поправь или зафиксируй ADR/waive.

Плюс в финальном ответе агента: **Как проверить** (команды/действия) и **Что вынести** (смысл шага для роста разработчика).
