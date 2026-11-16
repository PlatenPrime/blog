# Глоссарий

Короткая шпаргалка общего языка продукта. Не заменяет схемы и ADR: коллекции — [`content-model.md`](./content-model.md), потоки — [`architecture.md`](./architecture.md), решения — [`adr/README.md`](./adr/README.md).

**Язык:** русский + привычные EN-термины (draft, preview, access control).

В проекте **три плоскости ярлыков** — их нельзя смешивать:

| Плоскость     | Где               | Locales UI                                      |
| ------------- | ----------------- | ----------------------------------------------- |
| Code / slug   | коллекции, пути   | `articles`, `notes`, …                          |
| Payload admin | `/admin` sidebar  | **en** + **ru** (без uk)                        |
| Public chrome | шапка/футер сайта | **uk** / **ru** / **en** в `src/i18n/messages/` |

---

## 1. Article vs Note

|                     | **Article**                                       | **Note**                                                 |
| ------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| Collection slug     | `articles`                                        | `notes`                                                  |
| Admin EN            | Article / Articles                                | Note / Notes                                             |
| Admin RU            | Статья / Статьи                                   | Заметка / Заметки                                        |
| Admin description   | Long-form posts… / Развёрнутые статьи…            | Short thoughts — lighter than Articles / Короткие мысли… |
| Public path         | `/{locale}/articles`, `/{locale}/articles/[slug]` | `/{locale}/notes`, `/{locale}/notes/[slug]`              |
| Cover (`heroImage`) | да                                                | нет                                                      |
| Публичный вид       | длинный текст, обложка, reading time              | короче, kicker, без обложки                              |

**Public chrome (nav / badges):**

| Locale | Articles | Notes (plural) | Note (singular / kicker) |
| ------ | -------- | -------------- | ------------------------ |
| uk     | Статті   | **Нотатки**    | Нотатка                  |
| ru     | Статьи   | **Заметки**    | Заметка                  |
| en     | Articles | Notes          | Note                     |

**Ловушка:** украинский фасад говорит «нотатки», русский фасад и Payload admin RU — «заметки». В коде и EN везде `notes` / Notes. Не «чинить» одно под другое без осознанного i18n-шага.

**Page** (для контраста): slug `pages`; admin Page/Страница; публичные фиксированные пути (`/{locale}/about`, `/privacy`, `/terms`), без taxonomy и без `heroImage`. Схема — content-model.

---

## 2. Admin vs guest (и «reader»)

| Термин                    | Живой? | Смысл                                                                                      |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| **admin**                 | да     | Единственная роль Users (`role: admin`). Сессия только на `/admin`. Пишет контент и media. |
| **anonymous** / **guest** | да     | Посетитель без аккаунта. Читает опубликованное. На article/note может Share / Copy link.   |
| **author** (в прозе docs) | alias  | «Один автор» = тот же **admin**, не отдельная роль в БД.                                   |
| **reader**                | нет    | Историческая роль; снята ADR-007 + миграция `drop_reader_social`. В коде/enum больше нет.  |

Канон матрицы: [`security/access-matrix.md`](./security/access-matrix.md). Продуктовое решение: [ADR-007](./adr/007-author-only-no-public-auth.md).

**Ловушка:** формулировка шага «reader vs admin» в старых заметках — про прошлую модель. Сейчас говорить **guest vs admin**.

---

## 3. Draft, published, preview, scheduled

| Термин                       | Что это                                                                                                                | Что это не                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **draft**                    | `_status: draft` (Payload versions/drafts)                                                                             | Не отдельный публичный URL                    |
| **published**                | `_status: published`                                                                                                   | Не гарантия видимости гостю (см. scheduled)   |
| **Save Draft** / **Publish** | Кнопки admin → draft / published                                                                                       | —                                             |
| **Preview**                  | Кнопка admin → `/next/preview?…` (секрет + session admin) → Next.js **draftMode**; временный рендер `/dev/rich-text/…` | Не `?preview=1` на публичном URL; не «статус» |
| **Exit preview**             | `/next/exit-preview` снимает draftMode                                                                                 | —                                             |
| **scheduled**                | `published` + `publishedAt` в будущем; гость не видит до наступления времени (ADR-003)                                 | Не `_status: scheduled` — такого значения нет |

Правило чтения для гостя: `publishedOrAdmin` → иначе `publicContentWhere` (`_status: published` и `publishedAt` пуст/`<= now`). Admin в `/admin` и в preview видит черновики и будущие даты.

Пошаговый poke: [`LOCAL_SETUP.md`](./LOCAL_SETUP.md). Решение schedule: [ADR-003](./adr/003-scheduled-publish-query-time.md).

---

## 4. Смежные термины

| Термин                     | Кратко                                                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Locale**                 | Публичный префикс и editorial locales: `uk` (default) / `ru` / `en` ([ADR-004](./adr/004-public-locale-prefix.md)).              |
| **Chrome**                 | Строки UI фасада (`src/i18n/messages/*.json`). Не мержатся с `uk` в runtime ([ADR-005](./adr/005-i18n-fallback-and-missing.md)). |
| **Editorial localization** | Один документ, поля `title`/`slug`/`body` per locale; пустое → fallback `uk` (Payload).                                          |
| **Categories / Tags**      | Admin: Categories/Категории, Tags/Теги. Public uk/ru nav categories: **«Рубрики»** (не «Категории»).                             |
| **Feed**                   | Смешанная лента articles+notes: `/{locale}/feed` (uk «Стрічка», ru «Лента», en «Feed»).                                          |
| **Local API**              | Вызов Payload из Next в том же процессе (RSC), без отдельного HTTP API-сервера.                                                  |
| **Media**                  | Коллекция загрузок (admin-only write); `alt` обязателен; storage → R2 в cloud.                                                   |
| **Seed**                   | `npm run seed` = admin + go-live Pages (`about` / `privacy` / `terms`); лента articles/notes пустая; без reader-аккаунтов.       |
| **ISR / revalidate**       | Кэш публичных выборок + `revalidateTag` при сохранении ([ADR-009](./adr/009-caching-isr-revalidate.md)).                         |

---

## 5. Связанные документы

| Документ                                                 | Зачем рядом с глоссарием               |
| -------------------------------------------------------- | -------------------------------------- |
| [content-model.md](./content-model.md)                   | Поля, access helpers, preview/schedule |
| [security/access-matrix.md](./security/access-matrix.md) | admin vs anonymous                     |
| [architecture.md](./architecture.md)                     | Куда течёт запрос                      |
| [LOCAL_SETUP.md](./LOCAL_SETUP.md)                       | Save Draft / Publish / Preview руками  |
| [ADR-003](./adr/003-scheduled-publish-query-time.md)     | Scheduled = query-time                 |
| [ADR-007](./adr/007-author-only-no-public-auth.md)       | Author-only, без reader                |
