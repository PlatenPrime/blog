import { TaxonomyIndexPage, taxonomyIndexMetadata } from '@/components/taxonomy/taxonomy-pages'

type TagsPageProps = {
  params: Promise<{ locale: string }>
}

export function generateMetadata({ params }: TagsPageProps) {
  return taxonomyIndexMetadata('tags', params)
}

export default function TagsPage({ params }: TagsPageProps) {
  return <TaxonomyIndexPage collection="tags" params={params} />
}
