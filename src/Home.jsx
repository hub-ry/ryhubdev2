import { useEffect, useState } from 'react'

// Add / reorder your photos here. Files live in public/photos/.
const PHOTOS = [
  { src: '/photos/purdue_snow.jpg', alt: 'Snowy Purdue campus at night' },
]

const INTERVAL = 6000 // ms between photos

export default function Home() {
  const [i, setI] = useState(0)

  useEffect(() => {
    document.title = 'ryhub.dev'
  }, [])

  useEffect(() => {
    if (PHOTOS.length < 2) return
    const id = setInterval(() => setI(n => (n + 1) % PHOTOS.length), INTERVAL)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="page home">
      <div className="home-inner">
        <h1 className="home-title">ryhub.dev</h1>

        <div className="home-gallery">
          {PHOTOS.map((p, idx) => (
            <img
              key={p.src}
              src={p.src}
              alt={p.alt}
              className={`home-photo${idx === i ? ' is-active' : ''}`}
              loading={idx === 0 ? 'eager' : 'lazy'}
            />
          ))}
        </div>

        <a className="home-link" href="/resume">
          ryhub.dev/resume
        </a>
      </div>
    </div>
  )
}
