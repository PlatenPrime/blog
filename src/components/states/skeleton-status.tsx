import type { ReactNode } from 'react'

export const skeletonBarClassName = 'animate-pulse rounded-sm bg-muted motion-reduce:animate-none'

/**
 * Bars are hidden from the accessibility tree.
 * The label is the only text a screen reader should hear while the page is pending.
 */
export function SkeletonStatus({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div aria-busy="true" role="status">
      <p className="sr-only">{label}</p>
      <div aria-hidden="true">{children}</div>
    </div>
  )
}
