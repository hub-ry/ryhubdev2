import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import GitHubChart, { ChartGrid } from './GitHubChart'
import Projects from './Projects'
import { useContributions } from './useContributions'

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function UpIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/>
      <polyline points="5 12 12 5 19 12"/>
    </svg>
  )
}

function App() {
  const [dark, setDark] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [hovering, setHovering] = useState(false)
  const { calendar, loading } = useContributions()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="app">
      <header className="site-header">
        <div className="header-inner">
          <GitHubChart calendar={calendar} loading={loading} />
        </div>
      </header>

      <main className="main-content">
        <h1 className="name">Ryan Hubbart</h1>
        <p className="subtitle">Software Engineer</p>
        <p className="bio">Computer Science @ Purdue, Systems Concentration — interested in automation.</p>
        <p className="bio">Graduating Spring 2028</p>
        <div className="hero-actions">
          <a
            className="btn btn-ghost"
            href="https://github.com/hub-ry"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubIcon /> GitHub
          </a>
          <a className="btn btn-outline" href="#work">
            View My Work
          </a>
        </div>
      </main>

      <Projects />

      <button
        className="theme-toggle"
        onClick={() => setDark(d => !d)}
        aria-label="Toggle dark/light mode"
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>

      <AnimatePresence>
        {scrolled && (
          <div
            className="back-to-top-wrap"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            <AnimatePresence>
              {hovering && calendar && (
                <motion.div
                  className="chart-preview"
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                >
                  <ChartGrid weeks={calendar.weeks} cellSize={4} gap={2} />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              className="back-to-top"
              aria-label="Back to top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              <UpIcon />
            </motion.button>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
