import Link from 'next/link'
import React from 'react'
import './styles.css'

export default function HomePage() {
  return (
    <div className="home">
      <h1>Blog</h1>
      <p>Personal blog — Next.js + Payload CMS.</p>
      <p>
        <Link href="/admin">Open admin</Link>
      </p>
    </div>
  )
}
