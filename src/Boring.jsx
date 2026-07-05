import GitHubChart from './GitHubChart'
import { useContributions } from './useContributions'

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

/* ─────────────────────────────────────────────
   Edit everything below to update the /boring page.
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
  { name: 'Open Source Event Ticketing System', href: '#', live: '', tag: 'Python', desc: 'A SAAS project, fun fact: ticketmaster is considered an illegal monopoly.' },
  { name: 'Content Ranking Engine', href: '#', live: '', tag: 'C++', desc: '' },
  { name: 'BoilerGPA', href: '#', live: '', tag: 'React', desc: '' },
  { name: 'Music Sharing Platform', href: '#', live: '', tag: 'WIP', desc: '' },
]

const SKILLS = ['C++', 'Python', 'TypeScript', 'React', 'C', 'Docker', 'Linux', 'Git', 'PostgreSQL', 'Java'
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
                <span className="r-tag">{p.tag}</span>
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

      <button
        className="theme-toggle"
        onClick={() => setDark(d => !d)}
        aria-label="Toggle dark/light mode"
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>
    </div>
  )
}
