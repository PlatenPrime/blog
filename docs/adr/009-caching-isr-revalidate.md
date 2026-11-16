# ADR-009: Public content cache tags + on-demand revalidate

- **Status:** accepted
- **Date:** 2026-11-16
- **Step:** 104

## Context

Публичный сайт читает Payload через [`src/content/*`](../../src/content/). До шага **104** на каждый гостевой запрос шёл hit в Neon: React `cache()` только дедуплицировал работу внутри одного render. Tech-stack уже предполагал SSR/ISR без общего Redis-кэша ([ADR-000](./000-payload-next-neon-r2.md), [ADR-006](./006-rate-limiting.md) counters-only / superseded). Нужна явная стратегия: быстрее HTML, меньше давления на Free Neon, свежий контент после Publish в `/admin`.

Scheduled publish остаётся **query-time** ([ADR-003](./003-scheduled-publish-query-time.md)): `_status: published` + `publishedAt <= now`. Кеш не должен ломать этот инвариант навсегда — иначе отложенный пост останется «невидимым» до ручного сброса.

## Decision

1. **Cross-request cache** для публичных content loaders: Next `unstable_cache` с **soft TTL `revalidate: 60`** и **cache tags**. `"use cache"` / `cacheComponents` в v1 не включаем.
2. **Tag vocabulary** (канон в [`src/cache/contentTags.ts`](../../src/cache/contentTags.ts)):
   - коллекции: `articles`, `notes`, `pages`, `categories`, `tags`
   - агрегаты: `home`, `feed`
   - документ: `article:{id}`, `note:{id}`, `page:{id}`, `category:{id}`, `tag:{id}`
3. **On-demand invalidation:** Payload `afterChange` / `afterDelete` на articles, notes, pages, categories, tags вызывает `revalidateTag(tag, { expire: 0 })` (immediate expire вне Server Action). Сбой revalidate логируется и **не** откатывает save.
4. **Ключ кеша** — стабильные args (locale, slug, page, ids). **`now` не входит в key**; wall-clock берётся только на cache miss внутри `publicContentWhere(new Date())`. Soft TTL 60s закрывает появление scheduled-постов без cron.
5. **Не кешируем (осознанно):**
   - RSS и sitemap — остаются `force-dynamic`
   - Search — много ключей `q`
   - Draft preview (`/dev/rich-text`, `draftMode`) — live reads
6. **Cron / `REVALIDATE_SECRET`** — не в v1 step 104; допустимы позже как side-effect к ADR-003, не как источник истины видимости.

## Alternatives considered

| Approach                                 | Why not for v1 now                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| `"use cache"` + `cacheTag` / `cacheLife` | Требует `cacheComponents` и меняет модель рендера; отдельный риск вне DoD 104 |
| Только TTL без tags                      | Publish ждёт до минуты; Verify «после revalidate» слабее                      |
| Только on-demand без soft TTL            | Scheduled go-live может застрять в negative cache до следующего publish       |
| Vercel cron на каждый `publishedAt`      | Лишний secret/job; soft TTL достаточно для personal blog                      |
| Redis page cache                         | Против cost/cold-start канона стека                                           |

## Consequences

- Канон реализации: [`src/cache/`](../../src/cache/) + hook [`src/hooks/revalidatePublicContent.ts`](../../src/hooks/revalidatePublicContent.ts).
- Автор после Publish видит обновление на следующем запросе (tag expire 0); отложенный пост — в пределах ~60s после `publishedAt`.
- Media без собственного hook: смена cover отражается после save parent article/note/page.
- Image perf и bundle pass — шаги **105** / **106**, не этот ADR.
