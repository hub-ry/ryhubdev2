- built with React + Vite Template + Claude Code

- live at [ryhub.dev](https://ryhub.dev/)

- `/resume`: project names, links, and tech tags, with no descriptions for now. `/currently` (live Spotify, dev setup, projects, notes link) is unrouted for now; `src/Currently.jsx` is kept so it can come back.
- Dum links to `dumintern.com` and the source. clothingRec replaces Swatch and links only to the GitHub repo, not the private rating site. scheduler and clash-optimization are not listed. `/clash` is still a route.
- The token line counts today's recorded Claude Code, Codex and omp usage on hub, including cached context. Days use `America/Chicago`; it is not subscription quota or browser-chat usage.
- `scripts/token-usage.py` reads local usage metadata incrementally and serves only aggregate JSON on `127.0.0.1:8081/usage.json`. The enabled `ryhub-token-usage` user service runs it; Cloudflare Tunnel exposes it at `https://tokens.ryhub.dev/usage.json`. Collection and browser polling run every minute. The line disappears if data is unavailable or over three minutes old.
- Run aggregation regressions with `python3 scripts/token-usage-test.py`. After collector changes, restart it with `systemctl --user restart ryhub-token-usage`.
