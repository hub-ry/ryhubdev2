import { useEffect } from 'react'
import ThemeToggle from './ThemeToggle'

/* ─────────────────────────────────────────────
   Edit everything below to update the /software page.
   ───────────────────────────────────────────── */

const GROUPS = [
  {
    label: 'Terminal',
    items: [
      { name: 'WezTerm', href: 'https://wezterm.org', note: 'terminal' },
      { name: 'tmux', href: 'https://github.com/tmux/tmux/wiki', note: 'sessions that outlive the SSH connection' },
      { name: 'herdr', href: 'https://herdr.dev', note: 'tmux for coding agents' },
      { name: 'Starship', href: 'https://starship.rs', note: 'prompt' },
    ],
  },
  {
    label: 'Editor and git',
    items: [
      { name: 'Neovim', href: 'https://neovim.io' },
      { name: 'lazygit', href: 'https://github.com/jesseduffield/lazygit' },
    ],
  },
  {
    label: 'Command line',
    items: [
      { name: 'ripgrep', href: 'https://github.com/BurntSushi/ripgrep', note: 'search' },
      { name: 'fd', href: 'https://github.com/sharkdp/fd', note: 'find' },
      { name: 'fzf', href: 'https://github.com/junegunn/fzf', note: 'fuzzy finder' },
      { name: 'jq', href: 'https://jqlang.org', note: 'JSON' },
    ],
  },
  {
    label: 'Agents',
    items: [
      { name: 'omp', href: 'https://omp.sh' },
      { name: 'Claude Code', href: 'https://claude.com/product/claude-code' },
      { name: 'Codex', href: 'https://github.com/openai/codex' },
      { name: 'Antigravity', href: 'https://antigravity.google' },
      { name: 'no-mistakes', href: 'https://github.com/kunchenguid/no-mistakes', note: 'validation before anything gets pushed' },
    ],
  },
  {
    label: 'Servers and network',
    items: [
      { name: 'Tailscale', href: 'https://tailscale.com' },
      { name: 'Ollama', href: 'https://ollama.com', note: 'local models' },
      { name: 'Docker', href: 'https://www.docker.com' },
      { name: 'Cloudflare Tunnel', href: 'https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/' },
    ],
  },
  {
    label: 'Config',
    items: [
      { name: 'Nix', href: 'https://nixos.org', note: 'with home-manager for the dotfiles' },
      { name: 'Hack', href: 'https://sourcefoundry.org/hack/', note: 'font' },
      { name: 'Rosé Pine', href: 'https://rosepinetheme.com', note: 'color scheme' },
    ],
  },
]

/* ───────────────────────────────────────────── */

export default function Software({ dark, setDark }) {
  useEffect(() => {
    document.title = 'software · ryhub.dev'
  }, [])

  return (
    <div className="page">
      <a className="back-home" href="/">← home</a>

      <main className="resume">
        <header className="r-header">
          <h1 className="r-name">Software</h1>
          <p className="r-tagline">stuff I like to use</p>
        </header>

        {GROUPS.map(g => (
          <section key={g.label} className="r-section">
            <h2 className="r-label">{g.label}</h2>
            <ul className="sw-list">
              {g.items.map(i => (
                <li key={i.name}>
                  <a className="r-link" href={i.href} target="_blank" rel="noopener noreferrer">{i.name}</a>
                  {i.note && <span className="sw-note"> - {i.note}</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      <ThemeToggle dark={dark} setDark={setDark} />
    </div>
  )
}
