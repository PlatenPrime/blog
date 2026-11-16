/**
 * Cache tag vocabulary for public content (ADR-009 / roadmap 104).
 * Keep strings short: Next tags must stay under 256 characters.
 */

export const CONTENT_CACHE_TAGS = {
  home: 'home',
  feed: 'feed',
  articles: 'articles',
  notes: 'notes',
  pages: 'pages',
  categories: 'categories',
  tags: 'tags',
} as const

export type ContentCacheCollection = 'articles' | 'notes' | 'pages' | 'categories' | 'tags'

const ENTITY_PREFIX: Record<ContentCacheCollection, string> = {
  articles: 'article',
  notes: 'note',
  pages: 'page',
  categories: 'category',
  tags: 'tag',
}

/**
 * Per-document tag, e.g. `article:12`.
 */
export function contentEntityTag(collection: ContentCacheCollection, id: string | number): string {
  return `${ENTITY_PREFIX[collection]}:${String(id)}`
}

/**
 * Tags to purge after create/update/delete of one document.
 * Content collections and taxonomy both bust home/feed so shelves and lists stay coherent.
 */
export function revalidateTagsForDocument(
  collection: ContentCacheCollection,
  id: string | number,
): string[] {
  return [
    CONTENT_CACHE_TAGS[collection],
    contentEntityTag(collection, id),
    CONTENT_CACHE_TAGS.home,
    CONTENT_CACHE_TAGS.feed,
  ]
}

/**
 * Tags attached to a list/index loader for one collection.
 */
export function listCacheTags(collection: ContentCacheCollection): string[] {
  if (collection === 'articles' || collection === 'notes') {
    return [CONTENT_CACHE_TAGS[collection], CONTENT_CACHE_TAGS.home, CONTENT_CACHE_TAGS.feed]
  }
  if (collection === 'pages') {
    return [CONTENT_CACHE_TAGS.pages, CONTENT_CACHE_TAGS.home]
  }
  return [CONTENT_CACHE_TAGS[collection], CONTENT_CACHE_TAGS.home, CONTENT_CACHE_TAGS.feed]
}

/**
 * Tags for a single document detail loader.
 */
export function detailCacheTags(
  collection: ContentCacheCollection,
  id?: string | number,
): string[] {
  const tags: string[] = [CONTENT_CACHE_TAGS[collection]]
  if (id !== undefined) {
    tags.push(contentEntityTag(collection, id))
  }
  return tags
}

/**
 * Mixed feed / related / taxonomy shelf content depends on both article and note lists.
 */
export function mixedContentCacheTags(...extra: ContentCacheCollection[]): string[] {
  const tags = new Set<string>([
    CONTENT_CACHE_TAGS.articles,
    CONTENT_CACHE_TAGS.notes,
    CONTENT_CACHE_TAGS.home,
    CONTENT_CACHE_TAGS.feed,
  ])
  for (const collection of extra) {
    tags.add(CONTENT_CACHE_TAGS[collection])
  }
  return [...tags]
}
