/** Public app origin without trailing slash (links, CSRF, metadata). */
export function getServerUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SERVER_URL?.trim()
  if (!raw) return 'http://localhost:3000'
  return raw.replace(/\/$/, '')
}
