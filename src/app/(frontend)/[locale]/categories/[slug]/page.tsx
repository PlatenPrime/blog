import { TaxonomyTermPage, taxonomyTermMetadata } from '@/components/taxonomy/taxonomy-pages'

type CategoryPageProps = {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ page?: string | string[] }>
}

export function generateMetadata({ params }: CategoryPageProps) {
  return taxonomyTermMetadata('categories', params)
}

export default function CategoryPage({ params, searchParams }: CategoryPageProps) {
  return <TaxonomyTermPage collection="categories" params={params} searchParams={searchParams} />
}
