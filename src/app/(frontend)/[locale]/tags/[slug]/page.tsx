import { TaxonomyTermPage, taxonomyTermMetadata } from '@/components/taxonomy/taxonomy-pages'

type TagPageProps = {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ page?: string | string[] }>
}

export function generateMetadata({ params }: TagPageProps) {
  return taxonomyTermMetadata('tags', params)
}

export default function TagPage({ params, searchParams }: TagPageProps) {
  return <TaxonomyTermPage collection="tags" params={params} searchParams={searchParams} />
}
