'use client'

import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

type ThemeTone = 'dark' | 'light' | 'pending'

function subscribeToThemeClass(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange)
  observer.observe(document.documentElement, {
    attributeFilter: ['class'],
    attributes: true,
  })
  return () => observer.disconnect()
}

function getThemeTone(): ThemeTone {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function getServerThemeTone(): ThemeTone {
  return 'pending'
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function ThemeIcon({ tone }: { tone: ThemeTone }) {
  if (tone === 'dark') return <SunIcon />
  if (tone === 'light') return <MoonIcon />
  return null
}

/**
 * Binary theme control. The server render has no icon, so hydration matches.
 * After that the button follows the `light` / `dark` class on `<html>`.
 * A click stores the opposite explicit choice.
 */
export function ThemeToggle() {
  const t = useTranslations('nav')
  const { setTheme } = useTheme()
  const tone = useSyncExternalStore(subscribeToThemeClass, getThemeTone, getServerThemeTone)
  const isDark = tone === 'dark'

  return (
    <button
      aria-label={isDark ? t('themeToLight') : t('themeToDark')}
      className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      type="button"
    >
      <ThemeIcon tone={tone} />
    </button>
  )
}
