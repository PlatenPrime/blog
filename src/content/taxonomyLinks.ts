/** A category or tag the reading page can link to. A bare id is not a link. */
export type TaxonomyLink = {
  slug: string
  title: string
}

export type TaxonomyRelationLike =
  | number
  | {
      id?: number | null
      slug?: string | null
      title?: string | null
    }
  | null

/**
 * Populated taxonomy links, in CMS order.
 * A name without a slug cannot open a shelf, so it is dropped with the bare id.
 */
export function taxonomyLinks(
  values: readonly TaxonomyRelationLike[] | null | undefined,
): TaxonomyLink[] {
  if (!values) return []

  return values.flatMap((value) => {
    if (typeof value !== 'object' || value === null) return []
    if (typeof value.title !== 'string' || value.title.length === 0) return []
    if (typeof value.slug !== 'string' || value.slug.length === 0) return []
    return [{ slug: value.slug, title: value.title }]
  })
}

/**
 * Numeric taxonomy ids for `in: [...]` queries.
 * Keeps bare ids and populated docs; drops duplicates and junk.
 */
export function taxonomyIds(values: readonly TaxonomyRelationLike[] | null | undefined): number[] {
  if (!values) return []

  const ids: number[] = []
  const seen = new Set<number>()

  for (const value of values) {
    const id = taxonomyId(value)
    if (id === null || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }

  return ids
}

function taxonomyId(value: TaxonomyRelationLike): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value !== 'object' || value === null) return null
  if (typeof value.id !== 'number' || !Number.isInteger(value.id)) return null
  return value.id
}
