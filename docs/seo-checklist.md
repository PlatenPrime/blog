# SEO checklist

Операционная шпаргалка Track 7 (шаги **067–072**): что уже есть в коде, как проверить и что заполнять в CMS. Короткие галочки перед go-live — в [`production-checklist.md`](./production-checklist.md) (§SEO). Полный gate выкладки (env, OAuth, R2, …) — шаг **108**.

Инварианты ниже должны совпадать с кодом. Если расходятся — править документ или код, не оставлять «как хотелось бы».

---

## Инвентарь

### Sitemap

- Маршрут: `GET /sitemap.xml` — [`src/app/sitemap.ts`](../src/app/sitemap.ts) (`force-dynamic`).
- Сборка: [`src/content/sitemapQuery.ts`](../src/content/sitemapQuery.ts); видимость = `publicContentWhere` + `draft: false`, без session.
- Absolute URL = `getServerUrl()` + `prefixPublicPath`.
- Статика на каждую локаль `uk` / `ru` / `en`: `/`, `/feed`, `/articles`, `/notes`, `/categories`, `/tags`, `/search` (`SITEMAP_STATIC_PATHS`).
- Динамика: published articles/notes по slug; все categories/tags; `/about` **только** если CMS page `about` опубликована.
- hreflang: общие пути — `languageAlternatesForPath`; локализованные slug — группировка по `id`; `x-default` = `uk`.
- Не в карте: auth, `/account`, `/bookmarks`, `/dev/`, `/admin`, `/api/`, `?page=`, `?q=`, drafts и scheduled.

### RSS

- Формат: RSS **2.0**, без npm-lib; `Content-Type: application/rss+xml`.
- Per-locale: `/{locale}/rss.xml` (mixed), `/{locale}/articles/rss.xml`, `/{locale}/notes/rss.xml`.
- Видимость как у sitemap; лимит `RSS_ITEM_LIMIT = 50`; excerpt = `seo.metaDescription` → усечённый `searchText` (Lexical body не в фиде).
- Discovery: `alternates.types['application/rss+xml']` в locale layout (mixed) и на list articles/notes; футер — ссылка на `/{locale}/rss.xml`.
- Код: [`src/content/rss.ts`](../src/content/rss.ts), [`src/content/rssQuery.ts`](../src/content/rssQuery.ts).

### Open Graph images

- Convention Next: `opengraph-image.tsx` + `ImageResponse` (`next/og`), без `/api/og`.
- Generators: locale brand card; детали articles / notes / about.
- Размер: **1200×630**, `image/png` (`OG_SIZE` / `OG_CONTENT_TYPE` в [`src/content/ogImage.ts`](../src/content/ogImage.ts)).
- Цепочка media: `seo.ogImage` → `heroImage` (**только статьи**) → title card; media рисуется **внутри** PNG, один `og:image` URL на страницу.
- `metadataBase` из `getServerUrl()` в locale layout.
- List / taxonomy / feed без своего файла → наследуют locale brand card.

### JSON-LD

- Builders: [`src/content/jsonLd.ts`](../src/content/jsonLd.ts); вывод — [`src/components/seo/json-ld.tsx`](../src/components/seo/json-ld.tsx).
- Locale shell: `@graph` **WebSite** + **Person** (`nav.siteTitle` / `siteDescription`; Person `url` → `/{locale}/about`; `email` только через `contactMailto(CONTACT_EMAIL)`).
- Стабильные `@id`: `{origin}/#website`, `{origin}/#person`.
- Articles и notes: schema.org **`Article`** (отдельного `BlogPosting` нет); image = та же OG-цепочка, иначе `{pageUrl}/opengraph-image`.
- About / lists / taxonomy / search — отдельного page-level JSON-LD нет (только layout graph).

### Metadata

- Shared: [`src/content/pageMetadata.ts`](../src/content/pageMetadata.ts) (`buildPageMetadata`, `localeTitleTemplate`).
- Layout: `title.default` = site title; template `%s — {siteTitle}`.
- Home: absolute bare title (`nav.siteTitle`).
- Lists / taxonomy / search / about / detail: segment title + description + `alternates.canonical` **без query** (`?page=` / `?q=` → clean path).
- CMS detail: title = `seo.metaTitle` ?? `title`; description = `rssExcerpt(metaDescription, searchText)`.
- hreflang: shared paths — `languageAlternatesForPath`; articles/notes/categories/tags — sibling slug по id ([`localizedAlternates.ts`](../src/content/localizedAlternates.ts)).
- `NOINDEX_ROBOTS` (`index: false`, `follow: false`): auth, `/account`, `/bookmarks`, `/search?q=` (непустой `q`), 404; `/dev` — noindex отдельно.

### Reader / on-page (не `<head>`, но Track 7)

- Reading time — только UI статей ([`src/lib/readingTime.ts`](../src/lib/readingTime.ts)).
- TOC — h2/h3; article ≥2 пунктов; note ≥2 и ≥300 слов.
- Related — до 3 соседей по categories/tags.
- Code highlight — Shiki dual-theme в Lexical Code block.

---

## Чеклист проверки

Предпосылка: `npm run dev` (или preview/prod URL), в CMS есть хотя бы один published article и note на локалях, которые проверяешь.

### Sitemap

- [ ] `GET /sitemap.xml` отдаёт XML (не HTML error).
- [ ] В XML есть оболочки `uk` / `ru` / `en` для статических путей из инвентаря.
- [ ] Published article/note slug присутствует; draft и future `publishedAt` **отсутствуют**.
- [ ] Auth / `/dev` / `/admin` / `?page=` / `?q=` не перечислены.
- [ ] `/about` есть только если страница опубликована.

### RSS

- [ ] `GET /uk/rss.xml`, `/uk/articles/rss.xml`, `/uk/notes/rss.xml` (и `ru` / `en`) → `application/rss+xml`.
- [ ] Channel/item `link` абсолютные; drafts/scheduled нет; не больше 50 item в канале.
- [ ] В `<head>` locale shell есть `link[rel=alternate][type="application/rss+xml"]` на mixed-фид.
- [ ] В футере есть ссылка на `/{locale}/rss.xml`.

### OG images

- [ ] Locale shell и детали article/note/about: в `<head>` есть `og:image`.
- [ ] URL из meta отдаёт `image/png` размером 1200×630.
- [ ] Статья без `seo.ogImage`, но с hero — карточка с обложкой; без обоих — title card.
- [ ] Черновик по публичному slug → 404 страницы (и brand fallback у OG route, не утечка draft title в index).

### JSON-LD

- [ ] Locale shell: `script[type="application/ld+json"]` с `@graph` WebSite + Person.
- [ ] Article/note detail: тип `Article`; `url` / `mainEntityOfPage` с префиксом локали.
- [ ] `author` / `isPartOf` → `{origin}/#person` и `{origin}/#website`.
- [ ] `image` — абсолютный media URL или `{pageUrl}/opengraph-image`.

### Metadata

- [ ] Home: `<title>` = голый site title (без суффикса `— …`).
- [ ] List/detail: уникальный title, `meta[name=description]`, `link[rel=canonical]` без query.
- [ ] Пагинация (`?page=2`) и поиск (`?q=…`): canonical на clean path списка / `/search`.
- [ ] Auth / bookmarks / account и `/search?q=` — `noindex` (robots meta).
- [ ] hreflang в `<head>` согласован с locale/slug (как в sitemap; `x-default` = uk).

---

## Чеклист автора CMS

Перед публикацией статьи / заметки / about:

- [ ] Заполнены `seo.metaTitle` и `seo.metaDescription` в каждой локали, которую открываешь публично (иначе title падает на `title`, description — на усечённый `searchText` или пусто).
- [ ] Задан `seo.ogImage` (или у статьи — осмысленный `heroImage`), если нужен контроль превью в соцсетях.
- [ ] `_status` = published; `publishedAt` не в будущем (иначе нет на сайте, в sitemap и в RSS).
- [ ] Slug стабильный и локализованный; пустой slug при наличии title заполнит hook `ensureSlugFromTitle`.
- [ ] Страница «Обо мне»: slug в каждой локали буквально `about` (пустая локаль падает на `uk`).
- [ ] После правки body статьи/заметки `searchText` обновляется хуком — нужен для excerpt RSS/meta и поиска.

Поля группы SEO — [`content-model.md`](./content-model.md) (§ SEO group) и [`src/collections/seoFields.ts`](../src/collections/seoFields.ts).

---

## Сознательно нет (не считать багом чеклиста)

| Нет                                       | Заметка                                               |
| ----------------------------------------- | ----------------------------------------------------- |
| `robots.ts` / `robots.txt`                | Indexing control сегодня — per-page `robots` metadata |
| BreadcrumbList JSON-LD                    | Не реализован                                         |
| `BlogPosting` для notes                   | Notes тоже `Article`                                  |
| Atom, category RSS, full HTML body в фиде | RSS 2.0, excerpt only                                 |
| e2e XML sitemap/RSS, Rich Results e2e     | Unit/smoke + metadata e2e; остальное вне 067–072      |
| CMS Site Settings для JSON-LD             | Person/WebSite из словаря + `CONTACT_EMAIL`           |

---

## Тесты-якоря (regression)

Не DoD ручной проверки, но место правки при регрессии:

| Область  | Тест                                                                |
| -------- | ------------------------------------------------------------------- |
| Sitemap  | `tests/unit/sitemapQuery.test.ts`                                   |
| RSS      | `tests/unit/rssQuery.test.ts`                                       |
| OG       | `tests/unit/ogImage.test.ts`                                        |
| JSON-LD  | `tests/unit/jsonLd.test.ts`                                         |
| Metadata | `tests/unit/pageMetadata.test.ts`, `tests/e2e/metadata.e2e.spec.ts` |
