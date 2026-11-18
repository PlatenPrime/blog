import type { ComponentProps, ReactNode } from 'react'

import { Link } from '@/i18n/navigation'

/**
 * Index column: wider than the reading measure, narrower than the 72rem shell.
 * Reading pages stay on `max-w-measure`.
 */
export const listColumnClassName = 'mx-auto w-full max-w-list px-5 pt-16 pb-24 sm:px-6 sm:pt-24'

const rowClassName =
  '-mx-3 block rounded-md px-3 py-3 font-sans no-underline hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

type ContentRowProps = {
  href: ComponentProps<typeof Link>['href']
  meta?: ReactNode
  title: string
}

/**
 * One material row shared by the home lists, feed, articles, notes,
 * taxonomy, and search. The whole row is the link, so hover and keyboard
 * focus land on the row. Hover is a solid accent fill, not a second glow.
 */
export function ContentRow({ href, meta, title }: ContentRowProps) {
  return (
    <li>
      <Link className={rowClassName} href={href}>
        <span className="block text-h3 font-medium wrap-break-word text-pretty text-foreground">
          {title}
        </span>
        {meta ? <span className="mt-1 block text-small text-muted-foreground">{meta}</span> : null}
      </Link>
    </li>
  )
}
