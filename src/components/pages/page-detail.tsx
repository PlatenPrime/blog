import { PayloadRichText } from '@/components/rich-text/PayloadRichText'
import type { PublicPage } from '@/content/pagesQuery'

type PageDetailLabels = {
  contact: string
}

type PageDetailProps = {
  labels: PageDetailLabels
  mailto: string | null
  page: PublicPage
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
 * Reading column for one CMS page. Title and body come from Payload.
 * The mailto is optional chrome under the text, not a substitute for the body.
 */
export function PageDetail({ labels, mailto, page }: PageDetailProps) {
  return (
    <article>
      <h1 className="m-0 font-serif text-h1 text-foreground">{page.title}</h1>
      <PayloadRichText className={bodyClassName} data={page.body} />
      {mailto ? (
        <p className="mt-12 mb-0 font-sans text-small">
          <a className="text-primary underline-offset-4 hover:underline" href={mailto}>
            {labels.contact}
          </a>
        </p>
      ) : null}
    </article>
  )
}
