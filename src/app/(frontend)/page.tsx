import React from 'react'
import './styles.css'

export default function HomePage() {
  return (
    <div className="home">
      <h1>Blog</h1>
      <p>Personal blog — Next.js + Payload CMS.</p>
      <p>
        <a href="/admin">Open admin</a>
      </p>
    </div>
  )
}
