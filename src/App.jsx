import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Background from './Background'
import Nav from './Nav'
import About from './About'
import Resume from './Resume'

function App() {
  const [activeSection, setActiveSection] = useState(null)

  const handleNav = (section) => {
    setActiveSection(prev => prev === section ? null : section)
  }

  return (
    <>
      <Background />
      <AnimatePresence>
        {activeSection === 'about' && <About key="about" onClose={() => setActiveSection(null)} />}
        {activeSection === 'resume' && <Resume key="resume" />}
      </AnimatePresence>
      <Nav
        activeSection={activeSection}
        onNav={handleNav}
        light={activeSection === 'resume'}
      />
      <footer className="footer" onClick={() => window.location.reload()}>
        Ryan Hubbart &copy; 2026
      </footer>
    </>
  )
}

export default App
