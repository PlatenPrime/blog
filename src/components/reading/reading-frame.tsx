import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type ReadingMetaItem = {
  id: string
  node: ReactNode
}

type ReadingFrameProps = {
  children: ReactNode
  footer?: ReactNode
  header: ReactNode
  toc?: ReactNode
}

const shellClassName = 'mx-auto w-full max-w-shell px-5 pt-16 pb-24 sm:px-6 sm:pt-24'

/**
 * One meta line under the document title. Callers pass only the parts that exist.
 */
export function ReadingMeta({ items }: { items: readonly ReadingMetaItem[] }) {
  if (items.length === 0) return null

  return (
    <p className="mt-3 mb-0 font-sans text-small text-muted-foreground">
      {items.map((item, index) => (
        <span key={item.id}>
          {index > 0 ? <span aria-hidden="true"> · </span> : null}
          {item.node}
        </span>
      ))}
    </p>
  )
}

/**
 * Reading room inside the 72rem shell. Prose, share, and related stay on the
 * 65ch measure. A single TOC sits between the header and the text until `lg`,
 * then in a sticky column beside that measure. No second nav is rendered.
 */
export function ReadingFrame({ children, footer, header, toc }: ReadingFrameProps) {
  return (
    <div className={shellClassName}>
      <div
        className={cn(
          'mx-auto w-full max-w-measure',
          toc &&
            'lg:grid lg:max-w-none lg:grid-cols-[minmax(0,65ch)_minmax(11rem,15rem)] lg:items-start lg:justify-center lg:gap-x-12',
        )}
      >
        <div className={cn('min-w-0', toc && 'lg:col-start-1 lg:row-start-1')}>{header}</div>
        {toc ? (
          <div className="lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto lg:px-1">
            {toc}
          </div>
        ) : null}
        <div className={cn('min-w-0', toc && 'lg:col-start-1 lg:row-start-2')}>{children}</div>
        {footer ? (
          <div className={cn('min-w-0', toc && 'lg:col-start-1 lg:row-start-3')}>{footer}</div>
        ) : null}
      </div>
    </div>
  )
}
