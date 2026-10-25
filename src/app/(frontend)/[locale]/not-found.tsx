import { Link } from '@/i18n/navigation'

export default function NotFound() {
  return (
    <div className="home">
      <h1>Page not found</h1>
      <p>
        <Link href="/">Back home</Link>
      </p>
    </div>
  )
}
