/** A category or tag the reading page can link to. A bare id is not a link. */
export type TaxonomyLink = {
  slug: string
  title: string
}

export type TaxonomyRelationLike =
  | number
  | {
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
