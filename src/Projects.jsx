import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Projects() {
  const [repos, setRepos] = useState(null)

  useEffect(() => {
    fetch('/api/github?type=projects')
      .then(r => r.json())
      .then(json => setRepos(json.data?.user?.pinnedItems?.nodes ?? []))
      .catch(() => setRepos([]))
  }, [])

  if (!repos) return null

  return (
    <section id="work" className="projects-section">
      <motion.h2
        className="section-heading"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.4 }}
      >
        Work
      </motion.h2>

      {repos.length === 0 ? (
        <p className="projects-empty">Pin some repos on GitHub and they'll show up here.</p>
      ) : (
        <div className="projects-grid">
          {repos.map((repo, i) => (
            <motion.a
              key={repo.name}
              className="project-tile"
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
            >
              <div className="project-top">
                <span className="project-name">{repo.name}</span>
                {repo.primaryLanguage && (
                  <span
                    className="project-lang"
                    style={{ color: repo.primaryLanguage.color }}
                  >
                    {repo.primaryLanguage.name}
                  </span>
                )}
              </div>
              {repo.description && (
                <p className="project-desc">{repo.description}</p>
              )}
            </motion.a>
          ))}
        </div>
      )}
    </section>
  )
}
