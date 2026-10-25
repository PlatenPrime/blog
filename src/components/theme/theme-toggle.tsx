'use client'

import { Moon, Sun } from 'lucide-react'
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

function ThemeIcon({ tone }: { tone: ThemeTone }) {
  if (tone === 'dark') return <Sun aria-hidden="true" className="size-4" />
  if (tone === 'light') return <Moon aria-hidden="true" className="size-4" />
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
      className="theme-toggle"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      type="button"
    >
      <ThemeIcon tone={tone} />
    </button>
  )
}
