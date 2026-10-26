import { TaxonomyIndexPage, taxonomyIndexMetadata } from '@/components/taxonomy/taxonomy-pages'

type CategoriesPageProps = {
  params: Promise<{ locale: string }>
}

export function generateMetadata({ params }: CategoriesPageProps) {
  return taxonomyIndexMetadata('categories', params)
}

export default function CategoriesPage({ params }: CategoriesPageProps) {
  return <TaxonomyIndexPage collection="categories" params={params} />
}
