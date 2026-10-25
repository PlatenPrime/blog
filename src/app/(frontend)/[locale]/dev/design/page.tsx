import type { Metadata } from 'next'

import { ThemeSpecimen } from './theme-specimen'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Design system',
}

/**
 * Dev scaffold for the design system. Not product chrome and not linked from the nav.
 * The header toggle switches the live theme of this page.
 */
export default function DesignSmokePage() {
  return (
    <div className="bg-background font-sans text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-small text-muted-foreground">
          Dev scaffold. Not product chrome. The header button switches the theme.
        </p>
        <h1 className="mt-2 font-serif text-h1">Design tokens</h1>
        <p className="mt-3 max-w-measure font-serif text-lead text-muted-foreground">
          One specimen follows the document theme. Reading is serif. Controls are sans.
        </p>
        <div className="mt-8">
          <ThemeSpecimen />
        </div>
      </div>
    </div>
  )
}
