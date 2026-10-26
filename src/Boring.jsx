import GitHubChart from './GitHubChart'
import { useContributions } from './useContributions'
import { useStars } from './useStars'
import ThemeToggle from './ThemeToggle'

/* ─────────────────────────────────────────────
   Edit everything below to update the /resume page.
   ───────────────────────────────────────────── */

const NAME = 'Ryan Hubbart'
const ROLE = 'Computer Science @ Purdue'
const TAGLINES = ['Systems Software concentration', 'Junior, graduating May 2028']

const LINKS = [
  { label: 'github.com/hub-ry', href: 'https://github.com/hub-ry' },
  { label: 'linkedin.com/in/ryanhubbart', href: 'https://www.linkedin.com/in/ryanhubbart/' },
  // { label: 'resume', href: '/hubbart_resume.pdf' },
]

// Public page. Grand Prix is not on the current resume, so it stays off.
const EXPERIENCE = [
  {
    org: 'Lynco Products',
    date: 'Jun – Aug 2026',
    line: 'Full Stack Software Engineer Intern',
    note: 'Invited to return, Winter 2026. Replaced 4–5 hours a day of manual rate shopping for 500+ weekly orders with a React app and config-driven scripts on an always-on Linux server that query carrier APIs and pick the cheapest rate. A Python pipeline parses FedEx billing PDFs into structured data, cutting about 6 hours a week of manual entry. Co-designed the GitLab CI/CD pipeline (dev, staging, prod) that in-development apps deploy through, moved untracked production SQL stored procedures into version control, and rolled out AI coding agents to the five-person dev team. They are used daily, including multi-agent workflows where parallel subagents take file locks so they do not overwrite each other.',
  },
  {
    org: 'BoilerMake',
    date: 'Apr 2025 – Present',
    line: 'Outreach Team Lead',
    note: 'Leads a six-person outreach team for Purdue\'s 500-person hackathon. A TypeScript Discord bot automates sponsor research, email verification, and outreach drafting, with code-enforced permissions and human sign-off on risky actions, and helped secure $10,000+ in sponsorships. Analyzed 1,000+ applications by major, year, and school to retarget outreach, growing the audience 9.5% in 5 months.',
  },
  {
    org: 'Purdue Hackers',
    date: 'Aug 2026 – Present',
    line: 'Organizer',
    note: 'Helped organize Codex Cafe, an invite-only workshop with OpenAI for about 40 student developers, handling logistics and venue selection. Helps run weekly Hack Nights, six-hour build sessions that end with students showcasing their projects at midnight.',
  },
]

const PROJECTS = [
  {
    name: 'C++ Sandbox',
    href: 'https://github.com/hub-ry/sandbox',
    live: '',
    tags: ['C++', 'Linux'],
    desc: 'A daemon that runs untrusted programs in isolation. Linux namespaces give each job its own process, filesystem, and network view, and seccomp filters block disallowed system calls. cgroups cap each job\'s CPU and memory and stop jobs that exceed their limits. Starts a sandbox in under 50 ms and runs 20 concurrent jobs on one machine.',
  },
  {
    name: 'Dum',
    href: 'https://github.com/hub-ry/dum-intern',
    live: 'https://dumintern.com',
    // The Maritime desktop is on main, and the resume still calls this
    // "Building". dumintern.com is the introduction; it says the public
    // screen-sharing flow is not available yet.
    wip: true,
    tags: ['TypeScript', 'Node.js', 'Linux'],
    desc: 'Building an AI intern you watch code on its own cloud Linux VM and teach through a skill tree. A locked skill stays locked until you explain it, and the intern refuses any task that needs a skill you have not taught yet. The Node.js server checks shell commands against unlocked skills before they run, and connects the intern to a live VM desktop through Maritime (exec, file I/O, screenshots, and watch links).',
    note: 'dumintern.com is the introduction. The Maritime desktop is in the source.',
  },
  {
    name: 'clothingRec',
    href: 'https://github.com/hub-ry/clothesRec',
    // The rating site is private. Do not add a public demo link.
    live: '',
    tags: ['Python', 'SQLite', 'CLIP', 'DeepSeek'],
    desc: 'A clothing recommender that turns your taste into real, cheap pieces with links. About 2,200 products from 4 menswear stores\' Shopify feeds are upserted into SQLite, and product photos are embedded with CLIP (ViT-B/32) for k-means style clustering. The v2.1 rating site runs on a home server with stdlib Python, systemd, and a Cloudflare Tunnel, behind private per-person links. 231 ratings are the eval set for a DeepSeek vision taste summary, spend-guarded at under $0.001 per call. A vision model turns a Pinterest board (91 pins) into a taste profile and keywords. Agents then find the cheapest close new matches and search used listings through typed Depop and eBay queries, with no scraping. Results come back as linked mood boards, refined over feedback rounds.',
    note: 'In progress: a friends-facing site where people submit a board or screenshots and get a mood board with links (IP rate-limited, one free board without a code), growing into an automated resale-sourcing business. Built on chart-to-orc and the C++ sandbox.',
  },
  {
    name: 'Event Ticketing System',
    // Source stays private: the README documents real attack surface (a scan
    // only marks the ticket used at the station that scanned it), so linking
    // the repo would publish the weaknesses along with the design.
    href: '',
    live: '',
    tags: ['Python', 'FastAPI', 'SQLite', 'Stripe', 'Ed25519'],
    desc: 'FastAPI backend with Stripe checkout and emailed QR tickets. Gate entry needs no network: standalone door laptops verify Ed25519-signed QR codes with only the public key, reading USB barcode scanners against a local SQLite snapshot. Conditional UPDATEs prevent overselling and double entry, Stripe webhooks apply exactly once, and 90 PyTest tests cover the purchase and scan races.',
    note: 'Private source; implementation details available on request.',
  },
  {
    name: 'dum-learn',
    href: 'https://github.com/hub-ry/dum-learn',
    live: '',
    tags: ['JavaScript', 'Node.js', 'LaTeX'],
    desc: 'The other half of the dum stack: a keyboard-first place to learn something when you are stuck. A prompt becomes a 1 to 3 page LaTeX PDF explainer, with chat beside the file and prerequisite branching before it writes. The model key stays on the server, behind a passcode, with daily caps.',
  },
  {
    name: 'chart-to-orc',
    href: 'https://github.com/hub-ry/chart-to-orc',
    live: '',
    tags: ['Python', 'Docker', 'NATS'],
    desc: 'Draw a chart and it compiles to a graph of agents. Each agent runs in its own Docker container, and a NATS broker limits messages to the edges that were drawn. A host-side proxy holds the model key and meters each graph. Loopback only, for one trusted user.',
  },
  {
    name: 'scheduler',
    href: 'https://github.com/hub-ry/scheduler',
    live: 'https://scheduler.ryhub.dev',
    tags: ['TypeScript', 'Python', 'SQLite'],
    desc: 'Picks club event dates that miss the exams the audience is actually sitting. Paste the registrar exam table, weight the courses, and it ranks open evenings by how much attendance a slot would cost. FastAPI and SQLite on a Linux box, reached through a Cloudflare Tunnel.',
  },
  {
    name: 'clash-optimization',
    href: 'https://github.com/hub-ry/clash-optimization',
    live: 'https://ryhub.dev/clash',
    tags: ['JavaScript'],
    desc: 'Reads a Clash of Clans village export and lists the upgrades to take next. This is the planner behind /clash, and the whole clan uses it.',
  },
  {
    name: 'Self-Hosted Health Data Platform',
    href: '',
    live: '',
    tags: ['Python', 'Svelte', 'Tailscale'],
    desc: 'Python ingestion API and Svelte dashboard for time-series health data. Runs on Linux with access restricted to a private Tailscale network.',
  },
]

const SKILLS = [
  'C++', 'C', 'Python', 'TypeScript', 'JavaScript', 'Java', 'Bash',
  'Linux', 'Git', 'GitHub Actions', 'GitLab CI/CD', 'React', 'Node.js',
  'SQL', 'PostgreSQL', 'SQLite', 'FastAPI', 'Docker', 'PyTest',
  'NumPy', 'Pandas', 'scikit-learn',
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
    <div className="page page--resume">
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

        <section className="r-section">
          <GitHubChart calendar={calendar} loading={loading} cellSize={8} gap={3} />
        </section>

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
                  {/* The title goes to whatever best shows the project: the
                      running site if there is one, otherwise the repo. Entries
                      with neither are work in progress, so render plain text
                      rather than an anchor that goes nowhere. */}
                  {(p.live || p.href) ? (
                    <a className="r-link" href={p.live || p.href} target="_blank" rel="noopener noreferrer">
                      {p.name}
                    </a>
                  ) : (
                    <span className="r-proj-name">{p.name}</span>
                  )}
                  {/* Only once a repo actually has stars - a "0" next to a
                      project reads worse than no counter at all. */}
                  {stars[repoKey(p.href)] > 0 && <Stars count={stars[repoKey(p.href)]} />}
                  {/* Only when the title took the live link, so the repo still
                      has somewhere to be. */}
                  {p.live && p.href && (
                    <a className="r-side" href={p.href} target="_blank" rel="noopener noreferrer">
                      [source →]
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
              {p.desc && <p className="r-entry-line">{p.desc}</p>}
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
