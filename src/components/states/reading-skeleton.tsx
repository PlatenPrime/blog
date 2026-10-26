import { SkeletonStatus, skeletonBarClassName } from '@/components/states/skeleton-status'
import { StateColumn } from '@/components/states/state-column'

const lineWidths = ['w-full', 'w-full', 'w-11/12', 'w-3/4'] as const

/** Title and a few lines, for an article, a note, or the about page. */
export function ReadingSkeleton({ label }: { label: string }) {
  return (
    <StateColumn>
      <SkeletonStatus label={label}>
        <div className={`h-10 w-4/5 max-w-md ${skeletonBarClassName}`} />
        <div className="mt-8 space-y-3">
          {lineWidths.map((width, index) => (
            <div className={`h-4 ${width} ${skeletonBarClassName}`} key={`${width}-${index}`} />
          ))}
        </div>
      </SkeletonStatus>
    </StateColumn>
  )
}
