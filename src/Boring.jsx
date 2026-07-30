import GitHubChart from './GitHubChart'
import { useContributions } from './useContributions'
import ThemeToggle from './ThemeToggle'

/* ─────────────────────────────────────────────
   Edit everything below to update the /resume page.
   ───────────────────────────────────────────── */

const NAME = 'Ryan Hubbart'
const ROLE = 'Computer Science @ Purdue'
const TAGLINES = ['Systems + Automation', 'Graduating Spring 2028']

const LINKS = [
  { label: 'github.com/hub-ry', href: 'https://github.com/hub-ry' }
  // { label: 'resume', href: '/hubbart_resume.pdf' },
]

const EXPERIENCE = [
  {
    org: 'Lynco Products',
    date: 'Summer 2026',
    line: 'Full Stack Engineering Intern',
    note: 'Current',
  },

]

const PROJECTS = [
  { name: 'Open Source Event Ticketing System', href: '#', live: '', tags: ['Python'], desc: 'A SAAS project.' },  { name: 'Content Ranking Engine', href: '#', live: '', tags: ['C++'], desc: '' },
]

const SKILLS = ['C++', 'C', 'Python', 'RestAPI', 'TypeScript', 'React', 'Docker', 'Linux', 'Git', 'PostgreSQL', 'Java', 'Assembly / ARM'
]

/* ───────────────────────────────────────────── */

function Section({ label, children }) {
  return (
    <section className="r-section">
      <h2 className="r-label">{label}</h2>
      {children}
    </section>
  )
}

export default function Boring({ dark, setDark }) {
  const { calendar, loading } = useContributions()

  return (
    <div className="page">
      <a className="back-home" href="/">← home</a>

      <main className="resume">
        <header className="r-header">
          <h1 className="r-name">{NAME}</h1>
          <p className="r-role">{ROLE}</p>
          {TAGLINES.map(t => (
            <p key={t} className="r-tagline">{t}</p>
          ))}
          <div className="r-links">
            {LINKS.map(l => (
              <a key={l.label} className="r-link" href={l.href} target="_blank" rel="noopener noreferrer">
                {l.label}
              </a>
            ))}
          </div>
        </header>

        <Section label="About">
          <GitHubChart calendar={calendar} loading={loading} cellSize={8} gap={3} />
        </Section>

        <Section label="Experience">
          {EXPERIENCE.map(e => (
            <div key={e.org} className="r-entry">
              <div className="r-entry-row">
                <span className="r-entry-title">{e.org}</span>
                <span className="r-meta">{e.date}</span>
              </div>
              <p className="r-entry-line">{e.line}</p>
              {e.note && <p className="r-entry-note">{e.note}</p>}
            </div>
          ))}
        </Section>

        <Section label="Projects">
          {PROJECTS.map(p => (
            <div key={p.name} className="r-entry">
              <div className="r-entry-row">
                <span className="r-proj-head">
                  <a className="r-link" href={p.href} target="_blank" rel="noopener noreferrer">
                    {p.name}
                  </a>
                  {p.live && (
                    <a className="r-live" href={p.live} target="_blank" rel="noopener noreferrer">
                      [live →]
                    </a>
                  )}
                </span>
                <span className="r-tags">
                  {p.tags.map(t => (
                    <span key={t} className="r-tag">{t}</span>
                  ))}
                </span>
              </div>
              <p className="r-entry-line">{p.desc}</p>
            </div>
          ))}
        </Section>

        <Section label="Skills">
          <div className="r-chips">
            {SKILLS.map(s => (
              <span key={s} className="r-chip">{s}</span>
            ))}
          </div>
        </Section>

        <footer className="r-footer">Built with React</footer>
      </main>

      <ThemeToggle dark={dark} setDark={setDark} />
    </div>
  )
}
