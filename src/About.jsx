import { motion } from 'framer-motion'
import './About.css'

export default function About({ onClose }) {
  return (
    <motion.div
      className="about-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onClose}
    >
      <motion.div
        className="about-content"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.45, delay: 0.1 }}
      >
        <p className="about-eyebrow">Hi, here is my name</p>
        <h1 className="about-name">Ryan Hubbart</h1>

        <p className="about-bio">
          My name is Ryan, I'm a sophomore in college. I'm interested in marketing, language, and music.
        </p>

        <div className="about-divider" />

        <div className="about-grid">
          <div className="about-block">
            <span className="about-label">Studying</span>
            <span className="about-value">Computer Science at Purdue</span>
          </div>
          <div className="about-block">
            <span className="about-label">github</span>
            <span className="about-value"><a href="https://github.com/hub-ry">hub-ry</a></span>
          </div>
          <div className="about-block">
            <span className="about-label">LinkedIn</span>
            <span className="about-value"><a href="https://www.linkedin.com/in/ryanhubbart/">link 4 u</a></span>
          </div>
          <div className="about-block">
            <span className="about-label">Currently</span>
            <span className="about-value">I just built a fun mobile app with the Spotify API. If you haven't checked, the resume tab holds my projects too.</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
