import { useState, useEffect } from 'react'
import Home from './Home'
import Boring from './Boring'

function App() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])

  const path = window.location.pathname
  const isResume = path === '/resume' || path.startsWith('/resume/')

  return isResume ? <Boring dark={dark} setDark={setDark} /> : <Home />
}

export default App
