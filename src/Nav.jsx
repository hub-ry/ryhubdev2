import { motion } from 'framer-motion'
import './Nav.css'

const EMAIL = 'rhubbart@purdue.edu'

export default function Nav({ activeSection, onNav, light }) {
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
      <button className="nav-btn" onClick={() => onNav('resume')}>Projects</button>
      <a className="nav-btn" href={`mailto:${EMAIL}`}>Contact</a>
    </motion.nav>
  )
}
