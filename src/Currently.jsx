import { useEffect, useState } from 'react'
import { useNowPlaying } from './useNowPlaying'
import ThemeToggle from './ThemeToggle'
import TokenBurn from './TokenBurn'

/* ─────────────────────────────────────────────
   Edit everything below to update the /currently page.
   ───────────────────────────────────────────── */

const INSPIRATION = { name: 'Kun Chen', href: 'https://www.youtube.com/@kunchenguid' }

// Each row is a label and the tools behind it. `note` is the plan or detail
// shown in muted text after the name; leave `href` out for something with no
// page worth linking.
const SETUP = [
  {
    label: 'terminal',
    tools: [
      { name: 'WezTerm', href: 'https://wezterm.org' },
      { name: 'tmux', href: 'https://github.com/tmux/tmux/wiki' },
      { name: 'herdr', href: 'https://herdr.dev' },
    ],
  },
  {
    label: 'editor',
    tools: [
      { name: 'Neovim', href: 'https://neovim.io' },
      { name: 'lazygit', href: 'https://github.com/jesseduffield/lazygit' },
    ],
  },
  {
    label: 'agent',
    tools: [{ name: 'omp', href: 'https://omp.sh' }],
  },
  {
    label: 'models',
    tools: [
      { name: 'Claude Code', href: 'https://claude.com/product/claude-code', note: 'Opus 5.5 High writes the code (Max plan)' },
      { name: 'Codex', href: 'https://github.com/openai/codex', note: 'I try to review with GPT 5.6 Sol (free for students)' },
      { name: 'Antigravity', href: 'https://antigravity.google', note: 'comes with the Gemini plan' },
    ],
  },
  {
    label: 'hub',
    tools: [
      { name: 'Tailscale', href: 'https://tailscale.com' },
      { name: 'Ollama', href: 'https://ollama.com' },
      { name: 'Cloudflare Tunnel', href: 'https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/' },
    ],
    note: 'an always-on Ubuntu box (HP Pavilion, Ryzen 5) the agents run on',
  },
]

const PROJECTS = [
  { name: 'dum-intern', href: 'https://github.com/hub-ry/dum-intern', line: 'Electron macOS companion with zone-based context, a global skill tree and skill-gated file edits.' },
  { name: 'swatch', href: 'https://swatch.ryhub.dev', line: 'Python/FastAPI recommender using image embeddings, multiple taste clusters and batch ranking with brand and garment-type limits.' },
]

/* ───────────────────────────────────────────── */

const fmt = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function ago(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.round(hours / 24)} d ago`
}

function Card({ label, children }) {
  return (
    <section className="cur-card">
      <h2 className="r-label">{label}</h2>
      {children}
    </section>
  )
}

function Tool({ name, href, note }) {
  return (
    <span className="cur-tool">
      {href ? (
        <a className="r-link" href={href} target="_blank" rel="noopener noreferrer">{name}</a>
      ) : (
        name
      )}
      {note && <span className="cur-quiet"> {note}</span>}
    </span>
  )
}

function Music() {
  const { data, loading, fetchedAt } = useNowPlaying()
  const [now, setNow] = useState(() => Date.now())
  const playing = data?.playing

  // Advance the progress bar between polls; idle while nothing is playing.
  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [playing])

  if (loading) return <div className="chart-skeleton cur-skeleton" />
  if (!data?.track) return <p className="cur-quiet">nothing right now</p>

  const { track } = data
  const progress = playing ? Math.min(data.durationMs, data.progressMs + (now - fetchedAt)) : 0

  return (
    <div className="cur-music">
      {track.art && <img className="cur-art" src={track.art} alt="" width="64" height="64" />}
      <div className="cur-track">
        <a className="r-link cur-title" href={track.url} target="_blank" rel="noopener noreferrer">
          {track.title}
        </a>
        <p className="cur-quiet">{track.artists}</p>
        {playing ? (
          <div className="cur-progress">
            <span className="cur-live">playing</span>
            <span className="cur-bar"><span style={{ width: `${(progress / data.durationMs) * 100}%` }} /></span>
            <span className="cur-time">{fmt(progress)} / {fmt(data.durationMs)}</span>
          </div>
        ) : (
          <p className="cur-quiet">last played {ago(data.playedAt)}</p>
        )}
      </div>
    </div>
  )
}

export default function Currently({ dark, setDark }) {
  useEffect(() => {
    document.title = 'currently · ryhub.dev'
  }, [])

  return (
    <div className="page">
      <a className="back-home" href="/">← home</a>

      <main className="resume">
        <header className="r-header">
          <h1 className="r-name">Currently</h1>
        </header>

        <div className="cur-cards">
          <Card label="Listening">
            <Music />
          </Card>

          <Card label="Dev setup">
            <dl className="cur-setup">
              {SETUP.map(row => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>
                    <span className="cur-tools">
                      {row.tools.map(t => <Tool key={t.name} {...t} />)}
                    </span>
                    {row.note && <span className="cur-quiet cur-row-note">{row.note}</span>}
                  </dd>
                </div>
              ))}
            </dl>
            <TokenBurn />
            <p className="cur-credit">
              inspired by{' '}
              <a className="r-link" href={INSPIRATION.href} target="_blank" rel="noopener noreferrer">
                {INSPIRATION.name}'s YouTube channel
              </a>
              {' '}and setup
            </p>
          </Card>

          <Card label="Building">
            {PROJECTS.map(p => (
              <div key={p.name} className="r-entry">
                <a className="r-link" href={p.href} target="_blank" rel="noopener noreferrer">{p.name}</a>
                <p className="r-entry-line">{p.line}</p>
              </div>
            ))}
          </Card>
        </div>
        <p className="cur-notes">
          <a className="r-link" href="https://feyn.ryhub.dev" target="_blank" rel="noopener noreferrer">notes</a>
          {' '}<span className="cur-quiet">- teaching slides from Feynman Slides</span>
        </p>
      </main>

      <ThemeToggle dark={dark} setDark={setDark} />
    </div>
  )
}
