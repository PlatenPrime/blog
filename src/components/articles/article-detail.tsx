import { PayloadRichText } from '@/components/rich-text/PayloadRichText'
import type { ArticleHeroImage, PublicArticle } from '@/content/articlesQuery'
import { formatPublishedOn } from '@/content/formatPublishedOn'

type ArticleDetailLabels = {
  categories: string
  tags: string
}

type ArticleDetailProps = {
  article: PublicArticle
  labels: ArticleDetailLabels
  locale: string
}

const bodyClassName = [
  'mt-12 font-serif text-body text-foreground',
  '[&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:font-serif [&_h2]:text-h2',
  '[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-serif [&_h3]:text-h3',
  '[&_p]:my-4',
  '[&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline',
  '[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6',
  '[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_blockquote]:my-6 [&_blockquote]:border-l [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground',
  '[&_img]:my-6 [&_img]:h-auto [&_img]:max-w-full',
  '[&_.payload-richtext-youtube]:my-6',
  '[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:font-sans [&_pre]:text-small',
].join(' ')

/**
 * Reading column for one article. Category and tag names are text:
 * their routes arrive with taxonomy browsing.
 */
export function ArticleDetail({ article, labels, locale }: ArticleDetailProps) {
  const publishedOn = article.publishedAt ? formatPublishedOn(article.publishedAt, locale) : null
  const hasTaxonomy = article.categories.length > 0 || article.tags.length > 0

  return (
    <article>
      {article.hero ? <ArticleHero hero={article.hero} /> : null}
      <h1 className="m-0 font-serif text-h1 text-foreground">{article.title}</h1>
      {publishedOn && article.publishedAt ? (
        <time
          className="mt-3 block font-sans text-small text-muted-foreground"
          dateTime={article.publishedAt}
        >
          {publishedOn}
        </time>
      ) : null}
      {hasTaxonomy ? (
        <div className="mt-4 flex flex-col gap-1">
          <TaxonomyLine label={labels.categories} titles={article.categories} />
          <TaxonomyLine label={labels.tags} titles={article.tags} />
        </div>
      ) : null}
      <PayloadRichText className={bodyClassName} data={article.body} />
    </article>
  )
}

function ArticleHero({ hero }: { hero: ArticleHeroImage }) {
  return (
    // next/image and sizes are step 105. A plain img serves both local files and R2 URLs.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={hero.alt}
      className="mb-10 h-auto w-full"
      height={hero.height ?? undefined}
      src={hero.url}
      width={hero.width ?? undefined}
    />
  )
}

function TaxonomyLine({ label, titles }: { label: string; titles: string[] }) {
  if (titles.length === 0) return null

  return (
    <p className="m-0 font-sans text-small text-muted-foreground">
      {label}
      <span className="text-foreground"> {titles.join(' · ')}</span>
    </p>
  )
}
