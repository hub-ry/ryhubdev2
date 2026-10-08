// Vercel serverless function.
// Reports what's playing on my Spotify right now, or failing that the last
// thing that played. The client secret and refresh token stay server-side;
// `npm run spotify-auth` mints the refresh token.

const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const API = 'https://api.spotify.com/v1'

// Access tokens last an hour. A warm function instance reuses one instead of
// trading the refresh token on every request.
let cached = { token: null, expires: 0 }

async function accessToken() {
  if (cached.token && Date.now() < cached.expires) return cached.token

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env
  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: SPOTIFY_REFRESH_TOKEN }),
  })
  if (!r.ok) throw new Error(`token exchange failed: ${r.status}`)
  const json = await r.json()
  // Renew a minute early so a token never expires mid-request.
  cached = { token: json.access_token, expires: Date.now() + (json.expires_in - 60) * 1000 }
  return cached.token
}

async function spotify(path, token) {
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (r.status === 204) return null
  if (!r.ok) throw new Error(`${path} failed: ${r.status}`)
  return r.json()
}

function track(item) {
  // Images come widest first (640, 300, 64). Take the smallest that still
  // looks sharp at card size.
  const images = item.album.images ?? []
  const art = images.filter(i => i.width >= 128).at(-1) ?? images[0]
  return {
    title: item.name,
    artists: item.artists.map(a => a.name).join(', '),
    album: item.album.name,
    art: art?.url ?? null,
    url: item.external_urls.spotify,
  }
}

export default async function handler(req, res) {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    res.status(500).json({ error: 'Spotify not configured' })
    return
  }

  try {
    const token = await accessToken()
    let body

    // 204 (nothing open), podcasts and ads all fall through to the last track.
    const now = await spotify('/me/player/currently-playing', token)
    if (now?.currently_playing_type === 'track' && now.item) {
      body = now.is_playing
        ? { playing: true, track: track(now.item), progressMs: now.progress_ms, durationMs: now.item.duration_ms }
        // Paused: the paused track is more current than the history, and the
        // timestamp is when playback last changed, i.e. when it was paused.
        : { playing: false, track: track(now.item), playedAt: new Date(now.timestamp).toISOString() }
    } else {
      const recent = await spotify('/me/player/recently-played?limit=1', token)
      const last = recent?.items?.[0]
      body = last
        ? { playing: false, track: track(last.track), playedAt: last.played_at }
        : { playing: false, track: null }
    }

    // Short CDN cache: every visitor polling shares one upstream call per
    // window, and a song change still shows within seconds.
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=20')
    res.status(200).json(body)
  } catch {
    // Drop the cached token: if it was revoked, the next request mints a new one.
    cached = { token: null, expires: 0 }
    res.status(502).json({ error: 'upstream request failed' })
  }
}
