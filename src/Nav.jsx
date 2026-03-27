import { useState } from 'react'
import { motion } from 'framer-motion'
import './Nav.css'

const EMAIL = 'rhubbart@purdue.edu'

export default function Nav({ activeSection, onNav, light }) {
  const [showContact, setShowContact] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(EMAIL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const atTop = activeSection !== null

  return (
    <motion.nav
      className={`nav${light ? ' nav-light' : ''}`}
      animate={atTop
        ? { top: '24px', y: 0 }
        : { top: '50%', y: '-50%' }
      }
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
    >
      <button className="nav-btn" onClick={() => onNav('about')}>About</button>

      <div
        className="contact-wrap"
        onMouseEnter={() => setShowContact(true)}
        onMouseLeave={() => setShowContact(false)}
      >
        <button className="nav-btn">Contact</button>
        {showContact && (
          <div className="contact-card">
            <div className="contact-card-inner">
              <button className="contact-email" onClick={handleCopy}>
                {copied ? '✓ Copied!' : `✉ ${EMAIL}`}
              </button>
            </div>
          </div>
        )}
      </div>

      <button className="nav-btn" onClick={() => onNav('resume')}>Resume</button>
    </motion.nav>
  )
}
