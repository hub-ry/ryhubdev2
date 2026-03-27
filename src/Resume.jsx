import { motion } from 'framer-motion'
import { projects } from './projects'
import './Resume.css'

export default function Resume() {
  return (
    <motion.div
      className="resume-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="resume-inner">
        <div className="resume-header">
          <a className="resume-download" href="/hubbart_resume.pdf" download>
            ↓ Download Résumé
          </a>
        </div>

        <div className="resume-list">
          {projects.map((p) => (
            <div key={p.id} className="project-card">

              {/* header: title left, badge right */}
              <div className="project-card-header">
                <h2 className="project-title">{p.title}</h2>
                <span className="project-badge">{p.source}</span>
              </div>

              {/* body: text left, media right */}
              <div className="project-card-body">
                <div className="project-text">
                  <p className="project-subtitle">{p.subtitle}</p>
                  <p className="project-desc">{p.description}</p>

                  <div className="project-tags">
                    {p.techStack.map(t => (
                      <span key={t} className="project-tag">{t}</span>
                    ))}
                  </div>
                  {p.links && (
                    <div className="project-links">
                      {p.links.map(l => (
                        <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className="project-link">
                          {l.label} ↗
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="project-media">
                  {p.image
                    ? <img className="project-image" src={p.image} alt={p.title} />
                    : <div className="project-media-placeholder" />
                  }
                </div>
              </div>

              <p className="project-dates">{p.start} — {p.end}</p>

            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
