import { listColumnClassName } from '@/components/content/content-row'
import { SkeletonStatus, skeletonBarClassName } from '@/components/states/skeleton-status'

type ListSkeletonProps = {
  label: string
}

function SkeletonRows({ className }: { className: string }) {
  return (
    <ul className={className}>
      {['first', 'second', 'third'].map((row) => (
        <li className="py-3" key={row}>
          <div className={`h-6 w-2/3 max-w-sm ${skeletonBarClassName}`} />
          <div className={`mt-2 h-3 w-24 ${skeletonBarClassName}`} />
        </li>
      ))}
    </ul>
  )
}

/** Feed-shaped placeholder for a list route. The real heading replaces the bar. */
export function ListSkeleton({ label }: ListSkeletonProps) {
  return (
    <div className="font-sans text-foreground">
      <div className={listColumnClassName}>
        <SkeletonStatus label={label}>
          <div className={`h-10 w-40 ${skeletonBarClassName}`} />
          <SkeletonRows className="m-0 mt-10 list-none p-0" />
        </SkeletonStatus>
      </div>
    </div>
  )
}

/**
 * Rows under a heading that is already on the page.
 * The home hero stays put; only the lists wait.
 */
export function EmbeddedListSkeleton({ label }: ListSkeletonProps) {
  return (
    <div className="mt-14">
      <SkeletonStatus label={label}>
        <SkeletonRows className="m-0 list-none p-0" />
      </SkeletonStatus>
    </div>
  )
}
