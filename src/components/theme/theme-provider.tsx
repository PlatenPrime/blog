'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ReactNode } from 'react'

type ThemeProviderProps = {
  children: ReactNode
}

/**
 * Public-site color theme. The blocking script is the server layout's
 * `themeInitScript`, not the script this provider would render: a client
 * component script does not run and Next.js reports it as an error.
 * Payload admin does not mount this provider.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
      scriptProps={{ type: 'text/plain' }}
    >
      {children}
    </NextThemesProvider>
  )
}
