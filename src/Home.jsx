import { useEffect, useState } from 'react'

// Add / reorder your photos here. Files live in public/photos/.
const PHOTOS = [
  { src: '/photos/purdue_snow.jpg', alt: 'Snowy Purdue campus at night' },
]

const INTERVAL = 6000 // ms between photos

// The title flips through these on load and stops on a random one, so the
// landing page reads differently every visit. All are loaded in index.html.
const TITLE_FONTS = [
  "'Anton', sans-serif",
  "'Bebas Neue', sans-serif",
  "'Playfair Display', serif",
  "'Space Mono', monospace",
  "'Archivo Black', sans-serif",
  "'Major Mono Display', monospace",
  "'Rubik Mono One', sans-serif",
]

const FLIP_MS = 70    // time on each font mid-animation
const FLIP_COUNT = 22 // flips before it settles

export default function Home() {
  const [i, setI] = useState(0)
  const [fontIdx, setFontIdx] = useState(0)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    document.title = 'ryhub.dev'
  }, [])

  useEffect(() => {
    // A title strobing through seven typefaces is exactly what this setting
    // exists to suppress. Land on a random font immediately instead.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setFontIdx(Math.floor(Math.random() * TITLE_FONTS.length))
      setSettled(true)
      return
    }

    let flips = 0
    const id = setInterval(() => {
      flips += 1
      if (flips >= FLIP_COUNT) {
        clearInterval(id)
        setFontIdx(Math.floor(Math.random() * TITLE_FONTS.length))
        setSettled(true)
        return
      }
      // Step by a stride co-prime with the list length so consecutive frames
      // never repeat a font and the cycle looks scrambled, not sequential.
      setFontIdx(n => (n + 3) % TITLE_FONTS.length)
    }, FLIP_MS)

    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (PHOTOS.length < 2) return
    const id = setInterval(() => setI(n => (n + 1) % PHOTOS.length), INTERVAL)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="page home">
      <div className="home-inner">
        <h1
          className={`home-title${settled ? ' is-settled' : ''}`}
          style={{ fontFamily: TITLE_FONTS[fontIdx] }}
        >
          ryhub.dev
        </h1>

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
