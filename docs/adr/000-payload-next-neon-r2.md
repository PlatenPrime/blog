# ADR-000: Выбор стека (Payload + Next + Neon + R2)

- **Статус:** accepted
- **Дата:** 2026-10-06
- **Контекст:** шаг roadmap `014`; канон технологий — [`tech-stack.md`](../tech-stack.md)

## Контекст

Личный блог / персональный сайт одного автора: статьи и заметки, admin для публикации, аккаунты читателей (комментарии, закладки). Production на бесплатном стеке (Vercel + Neon Free + Cloudflare R2).

Нужны одновременно:

1. Публичный сайт (SSR/ISR, SEO, локали).
2. CMS admin с access control и медиа.
3. Auth (admin + readers) без лишнего ops.

Вопрос архитектуры: один deploy unit или отдельный backend API рядом с Next.

## Решение

Один репозиторий, **один Next.js application** с Payload CMS v3:

| Слой | Выбор |
| --- | --- |
| App / CMS | Next.js App Router + Payload v3 (`/admin` + website в одном процессе) |
| Данные | Neon PostgreSQL (prod/preview); локально Docker Postgres |
| Медиа | Cloudflare R2 (S3-compatible); upload только admin |
| Auth | Payload Users + roles (`admin` / `reader`); без отдельного Auth.js-стека на v1 |
| Доступ к данным из Next | Payload Local API / REST; **отдельный ORM-слой не вводим** |

Канон имён, версий и сервисов — [`tech-stack.md`](../tech-stack.md). Политика схемы (dev push vs prod migrate) — [`001-migrations-policy.md`](./001-migrations-policy.md).

```
Vercel (Next.js SSR/ISR + Payload /admin)
        │                         │
        ▼                         ▼
 Neon PostgreSQL              Cloudflare R2
```

## Почему не отдельный API

Отдельный Nest/Express (или иной) API **отклонён** для v1:

1. **Один deploy unit на Vercel** — меньше сервисов, секретов, cold starts и рассинхрона версий типов между frontend и backend.
2. **Payload уже закрывает backend-контур** — admin UI, collections, access control, Local API для Server Components и route handlers. Дублировать это своим REST/GraphQL слоем нет смысла.
3. **Масштаб продукта** — один author, без multi-tenant и без тяжёлой доменной логики вне CMS. Вынос API увеличивает ops (CORS, auth bridging, два CI/deploy) без выгоды для v1-фич.
4. **Явный out of scope** — отдельный Nest/Express API и monorepo-пакеты зафиксированы в tech-stack §16.

Если позже появится домен, который Payload плохо выражает (очередь, внешние webhooks-оркестрация и т.п.), решение пересматривается новым ADR — не «тихим» добавлением второго сервиса.

## Отвергнутые альтернативы

| Альтернатива | Почему нет (v1) |
| --- | --- |
| WordPress / headless WP | Чужой runtime, плагинная модель, хуже стыкуется с typed Next App Router |
| Strapi / Sanity как отдельный сервис | Второй хостинг и sync; Payload в том же Next — меньше трения для admin + Local API |
| Next + отдельный Nest/Express | См. раздел выше |
| Prisma (или иной ORM) поверх Payload | Схема и migrations уже через Payload/Drizzle adapter; второй ORM даёт drift |

## Последствия

- Website и `/admin` деплоятся одним Next app на Vercel.
- Схема и данные — через Payload; миграции по ADR-001.
- Медиа — байты в R2, метаданные в Neon; читатели не загружают файлы.
- Auth readers и admin — одна Users-модель с ролями (детали — следующие шаги roadmap).
- Расширение стека (отдельный API, второй ORM, другой CMS) требует нового ADR, не ad-hoc в коде.

## Ссылки

- [`docs/tech-stack.md`](../tech-stack.md)
- [`docs/adr/001-migrations-policy.md`](./001-migrations-policy.md)
- [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)
- [`docs/development-roadmap.md`](../development-roadmap.md)
