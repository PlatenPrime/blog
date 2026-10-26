import type { ReactNode } from 'react'

/**
 * A resolved empty list: one sentence, never a skeleton.
 * The page heading stays outside this line.
 */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="mt-14 mb-0 text-body text-muted-foreground" role="status">
      {children}
    </p>
  )
}
