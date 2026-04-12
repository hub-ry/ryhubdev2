import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { projects } from './projects'
import './Resume.css'

export default function Resume() {
  const [hovered, setHovered] = useState(null)   // project id with a video
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  const onMouseMove = useCallback(e => {
    setMouse({ x: e.clientX, y: e.clientY })
  }, [])

  const hoveredProject = projects.find(p => p.id === hovered)

  return (
    <motion.div
      className="projects-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onMouseMove={onMouseMove}
    >
      <div className="projects-grid">
        {projects.map((p, i) => (
          <motion.div
            key={p.id}
            className="proj-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            onMouseEnter={() => p.video && setHovered(p.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="proj-card-top">
              <span className="proj-title">{p.title}</span>
              <span className="proj-date">{p.start.replace(/\s\d{4}/, '')} — {p.end.replace(/\s\d{4}/, '')} {p.end.match(/\d{4}/)}</span>
            </div>

            <p className="proj-sub">{p.subtitle}</p>

            <div className="proj-tags">
              {p.techStack.map(t => (
                <span key={t} className="proj-tag">{t}</span>
              ))}
            </div>

            <div className="proj-footer">
              <span className={`proj-source ${p.source.toLowerCase().replace(/[\s-]/g, '')}`}>
                {p.source}
              </span>
              {p.links && p.links.map(l => (
                <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className="proj-link">
                  {l.label} ↗
                </a>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Floating video window that follows cursor */}
      <AnimatePresence>
        {hoveredProject?.video && (
          <motion.div
            className="proj-video-float"
            style={{ left: mouse.x + 24, top: mouse.y - 80 }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.18 }}
          >
            <video
              src={hoveredProject.video}
              autoPlay
              loop
              muted
              playsInline
              className="proj-video-el"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <a className="resume-dl" href="/hubbart_resume.pdf" download>
        ↓ Résumé
      </a>
    </motion.div>
  )
}
