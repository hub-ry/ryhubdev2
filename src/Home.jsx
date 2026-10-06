import { useEffect, useRef } from 'react'

const PHOTO = { src: '/photos/purdue_snow.jpg', alt: 'Snowy Purdue campus at night' }

const QUOTE = [
  'llms code well',
  "because we've been implementing",
  'the same three apps and websites',
  'for the last three decades.',
]

const GLYPHS = '.:;/\\|_-=+*<>{}[]#01'

// Each character cycles through glyph noise before settling, roughly left to right.
function decode(el, text, startAt, onDone) {
  const chars = [...text]
  const settleAt = chars.map((_, i) => startAt + i * 32 + Math.random() * 280)
  const end = Math.max(...settleAt)
  let raf
  let t0 = null
  const tick = (now) => {
    t0 ??= now
    const t = now - t0
    el.textContent = chars
      .map((ch, i) => {
        if (ch === ' ' || t >= settleAt[i]) return ch
        if (t < settleAt[i] - 650) return ' '
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      })
      .join('')
    if (t < end) raf = requestAnimationFrame(tick)
    else onDone?.()
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}

export default function Home() {
  const lineRefs = useRef([])
  const quoteRef = useRef(null)

  useEffect(() => {
    document.title = 'ryhub.dev'
    document.documentElement.classList.add('is-home')
    return () => document.documentElement.classList.remove('is-home')
  }, [])

  useEffect(() => {
    const lines = lineRefs.current
    const done = () => quoteRef.current?.classList.add('is-done')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      lines.forEach((el, i) => (el.textContent = QUOTE[i]))
      done()
      return
    }
    const last = lines.length - 1
    const stops = lines.map((el, i) => decode(el, QUOTE[i], 700 + i * 650, i === last ? done : undefined))
    return () => stops.forEach(s => s())
  }, [])

  return (
    <div className="home">
      <nav className="home-nav">
        <a href="/" className="home-logo">ryhub.dev</a>
        <ul className="home-nav-links">
          <li><a href="/resume">resume</a></li>
          <li><a href="https://feyn.ryhub.dev">notes</a></li>
        </ul>
      </nav>

      <section className="home-cover">
        <img className="home-cover-frost" src={PHOTO.src} alt="" aria-hidden="true" />

        <div className="home-cover-inner">
          <figure className="home-gallery">
            <img src={PHOTO.src} alt={PHOTO.alt} className="home-photo" />
          </figure>

          <p ref={quoteRef} className="home-quote" aria-label={QUOTE.join(' ')}>
            {QUOTE.map((line, i) => (
              <span key={i} ref={el => (lineRefs.current[i] = el)} aria-hidden="true">
                {'\u00a0'.repeat(line.length)}
              </span>
            ))}
          </p>
        </div>
      </section>
    </div>
  )
}
