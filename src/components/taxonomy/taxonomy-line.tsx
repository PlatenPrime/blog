import type { TaxonomyLink } from '@/content/taxonomyLinks'
import { taxonomyTermPath, type TaxonomyCollection } from '@/content/taxonomyQuery'
import { Link } from '@/i18n/navigation'

type TaxonomyLineProps = {
  kind: TaxonomyCollection
  label: string
  links: readonly TaxonomyLink[]
}

/** One row of category or tag links. An empty row renders nothing. */
export function TaxonomyLine({ kind, label, links }: TaxonomyLineProps) {
  if (links.length === 0) return null

  return (
    <p className="m-0 font-sans text-small text-muted-foreground">
      {label}
      <span className="text-foreground">
        {links.map((link, index) => (
          <span key={link.slug}>
            {index === 0 ? ' ' : ' · '}
            <Link
              className="underline-offset-4 hover:underline"
              href={taxonomyTermPath(kind, link.slug)}
            >
              {link.title}
            </Link>
          </span>
        ))}
      </span>
    </p>
  )
}
