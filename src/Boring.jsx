import GitHubChart from './GitHubChart'
import { useContributions } from './useContributions'
import { useStars } from './useStars'
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

// Public page — deliberately only the internship. BoilerMake and Purdue Grand
// Prix stay on the PDF resume only, since anyone can find this page.
const EXPERIENCE = [
  {
    org: 'Lynco Products',
    date: 'Jun – Aug 2026',
    line: 'Full Stack Software Engineer Intern',
    note: 'Shipped internal React tools, a multi-carrier shipping rate engine, and an in-house Debian dev server for a five-person team.',
  },
]

const PROJECTS = [
  {
    name: 'Swatch - clothing recommender',
    href: 'https://github.com/hub-ry/phackers-hacknight1',
    live: 'https://swatch.ryhub.dev',
    tags: ['Python', 'NumPy', 'CLIP'],
    desc: 'Swipe on clothes, it learns your taste. CLIP embeddings over 1,762 scraped items, with taste modelled as several clusters instead of one average so two different styles stay two different styles.',
  },
  {
    name: 'Event Ticketing Platform',
    // Source stays private: the README documents real attack surface (a scan
    // only marks the ticket used at the station that scanned it), so linking
    // the repo would publish the weaknesses along with the design.
    href: '',
    live: '',
    tags: ['Python', 'FastAPI', 'SQLite'],
    desc: 'Offline-first event ticketing. Ed25519-signed tickets verify on-device, so the gate keeps admitting people when the network drops.',
    note: "not open source for security, but please ask if you're interested",
  },
  {
    name: 'dum-intern - agentic programming environment',
    href: 'https://github.com/hub-ry/dum-intern',
    live: '',
    tags: ['Agents', 'TypeScript'],
    desc: "A coding agent that interrogates you about what you're asking for and won't build anything you can't explain.",
  },
  {
    name: 'Self-Hosted Health Data Platform',
    href: '',
    live: '',
    tags: ['Python', 'Svelte', 'Tailscale'],
    desc: 'Time-series ingestion API and dashboard on a hardened Linux server, reachable only over a Tailscale network with nothing exposed to the public internet.',
  },
  {
    name: 'Vector Search Engine',
    href: '',
    live: '',
    wip: true,
    tags: ['C++'],
    desc: 'Vector search and ranking, built from the retrieval layer up.',
  },
]

const SKILLS = ['Python', 'C++', 'C', 'TypeScript', 'Java', 'SQL', 'FastAPI', 'PostgreSQL', 'Docker', 'Linux', 'React', 'Git'
]

/* ───────────────────────────────────────────── */

// "owner/name" from a github.com project link, so a project can look up its
// own star count.
function repoKey(href) {
  const m = href?.match(/github\.com\/([^/]+\/[^/?#]+)/)
  return m ? m[1] : null
}

function Stars({ count }) {
  return (
    <span className="r-stars" title={`${count} star${count === 1 ? '' : 's'} on GitHub`}>
      <svg className="r-star-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 .8l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L.8 6.1l5-.7z" />
      </svg>
      {count}
    </span>
  )
}

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
  const stars = useStars()

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
                  {/* No repo yet on work-in-progress entries — render plain text
                      rather than an anchor that goes nowhere. */}
                  {p.href ? (
                    <a className="r-link" href={p.href} target="_blank" rel="noopener noreferrer">
                      {p.name}
                    </a>
                  ) : (
                    <span className="r-proj-name">{p.name}</span>
                  )}
                  {/* Only once a repo actually has stars - a "0" next to a
                      project reads worse than no counter at all. */}
                  {stars[repoKey(p.href)] > 0 && <Stars count={stars[repoKey(p.href)]} />}
                  {p.live && (
                    <a className="r-live" href={p.live} target="_blank" rel="noopener noreferrer">
                      [live →]
                    </a>
                  )}
                </span>
                <span className="r-tags">
                  {p.wip && <span className="r-tag r-tag--wip">in progress</span>}
                  {p.tags.map(t => (
                    <span key={t} className="r-tag">{t}</span>
                  ))}
                </span>
              </div>
              <p className="r-entry-line">{p.desc}</p>
              {p.note && <p className="r-entry-note">{p.note}</p>}
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
