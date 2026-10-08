- built with React + Vite Template + Claude Code

- live at [ryhub.dev](https://ryhub.dev/)

- `/resume`: experience, implementation-focused project descriptions and skills ordered for systems and interactive product roles. `/currently`: live Spotify, dev setup, projects and a notes link.
- The token line counts today's recorded Claude Code, Codex and omp usage on hub, including cached context. Days use `America/Chicago`; it is not subscription quota or browser-chat usage.
- `scripts/token-usage.py` reads local usage metadata incrementally and serves only aggregate JSON on `127.0.0.1:8081/usage.json`. The enabled `ryhub-token-usage` user service runs it; Cloudflare Tunnel exposes it at `https://tokens.ryhub.dev/usage.json`. Collection and browser polling run every minute. The line disappears if data is unavailable or over three minutes old.
- Run aggregation regressions with `python3 scripts/token-usage-test.py`. After collector changes, restart it with `systemctl --user restart ryhub-token-usage`.
