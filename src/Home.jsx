import { useEffect } from 'react'

const PHOTO = { src: '/photos/purdue_snow.jpg', alt: 'Snowy Purdue campus at night' }

export default function Home() {
  useEffect(() => {
    document.title = 'ryhub.dev'
  }, [])

  return (
    <div className="home">
      <main className="home-inner">
        <h1 className="home-title">ryhub.dev</h1>

        <figure className="home-gallery">
          <img src={PHOTO.src} alt={PHOTO.alt} className="home-photo" />
        </figure>

        <nav className="home-links">
          <a href="/resume">ryhub.dev/resume</a>
          <a href="/currently">ryhub.dev/currently</a>
        </nav>
      </main>
    </div>
  )
}
