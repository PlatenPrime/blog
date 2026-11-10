'use client'

import { useEffect, useRef } from 'react'

import { TURNSTILE_RESPONSE_FIELD } from '@/security/turnstile'

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string
      callback?: (token: string) => void
      'error-callback'?: () => void
      'expired-callback'?: () => void
    },
  ) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptLoadPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }
  if (window.turnstile) {
    return Promise.resolve()
  }
  if (scriptLoadPromise) {
    return scriptLoadPromise
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src^="https://challenges.cloudflare.com/turnstile"]',
    )
    if (existing) {
      if (window.turnstile) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Turnstile script failed')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Turnstile script failed'))
    document.head.appendChild(script)
  })

  return scriptLoadPromise
}

type TurnstileWidgetProps = {
  /** Bump after submit so a one-time token is replaced. */
  resetSignal?: number
}

/**
 * Explicit Turnstile widget. Renders nothing when the public site key is unset.
 * Writes the response into a hidden input named `cf-turnstile-response` for FormData.
 */
export function TurnstileWidget({ resetSignal = 0 }: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? ''
  const containerRef = useRef<HTMLDivElement>(null)
  const tokenInputRef = useRef<HTMLInputElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      return
    }

    let cancelled = false

    const clearToken = () => {
      if (tokenInputRef.current) {
        tokenInputRef.current.value = ''
      }
    }

    void loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) {
          return
        }

        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch {
            // Widget may already be gone after a remount.
          }
          widgetIdRef.current = null
        }

        containerRef.current.replaceChildren()
        clearToken()

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            if (tokenInputRef.current) {
              tokenInputRef.current.value = token
            }
          },
          'error-callback': clearToken,
          'expired-callback': clearToken,
        })
      })
      .catch(() => {
        clearToken()
      })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // ignore
        }
        widgetIdRef.current = null
      }
    }
  }, [siteKey, resetSignal])

  if (!siteKey) {
    return null
  }

  return (
    <div className="turnstile-widget">
      <input name={TURNSTILE_RESPONSE_FIELD} ref={tokenInputRef} type="hidden" defaultValue="" />
      <div ref={containerRef} />
    </div>
  )
}
