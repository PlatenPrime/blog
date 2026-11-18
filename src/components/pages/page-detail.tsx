import { ReadingFrame } from '@/components/reading/reading-frame'
import { readingProseClassName, readingTitleClassName } from '@/components/reading/reading-prose'
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

/**
 * Reading room for one CMS page. Title and body come from Payload.
 * There is no date, share, or related list: a page is not a material.
 * The mailto is optional chrome under the text, not a substitute for the body.
 */
export function PageDetail({ labels, mailto, page }: PageDetailProps) {
  return (
    <ReadingFrame header={<h1 className={`${readingTitleClassName} text-h1`}>{page.title}</h1>}>
      <PayloadRichText className={readingProseClassName('reading')} data={page.body} />
      {mailto ? (
        <p className="mt-12 mb-0 font-sans text-small">
          <a className="text-primary underline-offset-4 hover:underline" href={mailto}>
            {labels.contact}
          </a>
        </p>
      ) : null}
    </ReadingFrame>
  )
}
