import type { ReactNode } from 'react'

/**
 * The same reading column as the feed.
 * 404, 500, and full-page skeletons stay inside the locale chrome.
 */
export function StateColumn({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background font-serif text-foreground">
      <div className="mx-auto w-full max-w-measure px-5 pt-16 pb-24 sm:px-6 sm:pt-24">
        {children}
      </div>
    </div>
  )
}
