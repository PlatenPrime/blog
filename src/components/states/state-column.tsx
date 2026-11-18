import type { ReactNode } from 'react'

/**
 * Reading-width column for 404, 500, and reading skeletons.
 * List routes use `listColumnClassName` so a loading list does not jump width.
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
