/** Public app origin without trailing slash (links, CSRF, metadata). */
export function getServerUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SERVER_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')

  const vercelHost = process.env.VERCEL_URL?.trim()
  if (vercelHost) {
    const host = vercelHost.replace(/^https?:\/\//, '').replace(/\/$/, '')
    return `https://${host}`
  }

  return 'http://localhost:3000'
}
