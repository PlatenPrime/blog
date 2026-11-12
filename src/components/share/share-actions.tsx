'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

export type ShareLabels = {
  heading: string
  copy: string
  copied: string
  native: string
  x: string
  telegram: string
  facebook: string
}

type ShareActionsProps = {
  url: string
  title: string
  labels: ShareLabels
}

function shareHref(network: 'x' | 'telegram' | 'facebook', url: string, title: string): string {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  switch (network) {
    case 'x':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
    case 'telegram':
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
  }
}

function subscribeNoop() {
  return () => undefined
}

function getCanNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

export function ShareActions({ url, title, labels }: ShareActionsProps) {
  const [copied, setCopied] = useState(false)
  const canNativeShare = useSyncExternalStore(subscribeNoop, getCanNativeShare, () => false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  async function onNativeShare() {
    try {
      await navigator.share({ title, url })
    } catch {
      // User cancel or unsupported — ignore.
    }
  }

  const linkClassName =
    'text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <section
      aria-label={labels.heading}
      className="mt-12 border-t border-border pt-8 font-sans text-small text-muted-foreground"
    >
      <h2 className="m-0 text-foreground">{labels.heading}</h2>
      <ul className="mt-4 mb-0 flex list-none flex-wrap items-center gap-x-4 gap-y-2 p-0">
        <li>
          <button
            className={`cursor-pointer border-0 bg-transparent p-0 ${linkClassName}`}
            onClick={onCopy}
            type="button"
          >
            {copied ? labels.copied : labels.copy}
          </button>
        </li>
        {canNativeShare ? (
          <li>
            <button
              className={`cursor-pointer border-0 bg-transparent p-0 ${linkClassName}`}
              onClick={onNativeShare}
              type="button"
            >
              {labels.native}
            </button>
          </li>
        ) : null}
        <li>
          <a
            className={linkClassName}
            href={shareHref('x', url, title)}
            rel="noopener noreferrer"
            target="_blank"
          >
            {labels.x}
          </a>
        </li>
        <li>
          <a
            className={linkClassName}
            href={shareHref('telegram', url, title)}
            rel="noopener noreferrer"
            target="_blank"
          >
            {labels.telegram}
          </a>
        </li>
        <li>
          <a
            className={linkClassName}
            href={shareHref('facebook', url, title)}
            rel="noopener noreferrer"
            target="_blank"
          >
            {labels.facebook}
          </a>
        </li>
      </ul>
    </section>
  )
}
