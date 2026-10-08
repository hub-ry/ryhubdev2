/**
 * Mints the Spotify refresh token /api/spotify runs on.
 *
 *   npm run spotify-auth
 *
 * Needs SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local, and the
 * redirect URI below registered on the app at developer.spotify.com/dashboard
 * (Spotify only accepts loopback redirects as 127.0.0.1, not localhost).
 *
 * Open the printed URL and approve. If the browser runs on this machine, the
 * redirect lands on the server below. If it doesn't (you're over SSH), the
 * browser shows a connection error: copy the URL from its address bar and
 * paste it here instead.
 *
 * Writes SPOTIFY_REFRESH_TOKEN into .env.local. Copy it to the Vercel project's
 * environment variables too.
 */
import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ENV_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local')
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:4321/callback'
const SCOPES = 'user-read-currently-playing user-read-recently-played'

const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret } = process.env
if (!id || !secret) {
  console.error('Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local first.')
  process.exit(1)
}

const state = randomBytes(16).toString('hex')
const authorize = new URL('https://accounts.spotify.com/authorize')
authorize.search = new URLSearchParams({
  client_id: id,
  response_type: 'code',
  redirect_uri: REDIRECT_URI,
  scope: SCOPES,
  state,
})

let done = false

// Takes the full redirect URL, whichever way it arrived. Returns a message for
// the browser, or null if the URL wasn't the callback.
async function finish(redirected) {
  const url = new URL(redirected, REDIRECT_URI)
  if (url.pathname !== new URL(REDIRECT_URI).pathname) return null
  if (done) return 'Already done.'

  const error = url.searchParams.get('error')
  if (error) return fail(`Spotify said: ${error}`)
  if (url.searchParams.get('state') !== state) return fail('State mismatch: that URL is from a different attempt.')

  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: url.searchParams.get('code'),
      redirect_uri: REDIRECT_URI,
    }),
  })
  const json = await r.json()
  if (!json.refresh_token) return fail(`Token exchange failed: ${r.status} ${json.error_description ?? json.error ?? ''}`)

  saveToken(json.refresh_token)
  done = true
  console.log(`\nWrote SPOTIFY_REFRESH_TOKEN to ${ENV_FILE}.`)
  console.log('Add the same value to the Vercel project: Settings > Environment Variables.')
  setImmediate(() => process.exit(0))
  return 'Done. Back to the terminal.'
}

function fail(message) {
  console.error(message)
  setImmediate(() => process.exit(1))
  return message
}

function saveToken(token) {
  const line = `SPOTIFY_REFRESH_TOKEN=${token}`
  const env = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : ''
  const next = /^SPOTIFY_REFRESH_TOKEN=.*$/m.test(env)
    ? env.replace(/^SPOTIFY_REFRESH_TOKEN=.*$/m, line)
    : `${env}${env && !env.endsWith('\n') ? '\n' : ''}${line}\n`
  writeFileSync(ENV_FILE, next)
}

const { hostname, port } = new URL(REDIRECT_URI)
createServer(async (req, res) => {
  const message = await finish(req.url)
  res.writeHead(message ? 200 : 404, { 'Content-Type': 'text/plain' })
  res.end(message ?? 'Not found')
}).listen(Number(port), hostname, () => {
  console.log(`Open this URL and approve:\n\n${authorize}\n`)
  console.log('Waiting for the redirect, or paste the URL you landed on:')
})

createInterface({ input: process.stdin }).on('line', async (line) => {
  if (!line.trim()) return
  try {
    if ((await finish(line.trim())) === null) console.error(`That isn't a ${REDIRECT_URI} URL.`)
  } catch {
    console.error("Couldn't read that as a URL.")
  }
})
