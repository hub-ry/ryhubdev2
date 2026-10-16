import { useState, useEffect, lazy, Suspense } from 'react'
import Home from './Home'
import Boring from './Boring'

// /clash carries a bundled Clash of Clans dataset. Loading it lazily keeps the
// landing page and resume from paying for it.
const Clash = lazy(() => import('./clash/Clash.jsx'))

const routeFor = (path) => {
  if (path === '/resume' || path.startsWith('/resume/')) return 'resume'
  if (path === '/clash' || path.startsWith('/clash/')) return 'clash'
  return 'home'
}

function App() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])

  const route = routeFor(window.location.pathname)

  if (route === 'resume') return <Boring dark={dark} setDark={setDark} />
  if (route === 'clash') {
    return (
      <Suspense fallback={<div className="page" />}>
        <Clash dark={dark} setDark={setDark} />
      </Suspense>
    )
  }
  return <Home />
}

export default App
