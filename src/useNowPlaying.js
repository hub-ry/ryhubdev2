import { useState, useEffect } from 'react'

const POLL_MS = 30_000

// Polls /api/spotify while the tab is visible. `fetchedAt` lets the card move
// the progress bar between polls. A failed poll keeps the last good answer.
export function useNowPlaying() {
  const [state, setState] = useState({ data: null, loading: true, fetchedAt: 0 })

  useEffect(() => {
    let timer
    let cancelled = false

    const load = () => {
      clearTimeout(timer)
      fetch('/api/spotify')
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null)
        .then(data => {
          if (cancelled) return
          setState(s => ({ data: data ?? s.data, loading: false, fetchedAt: Date.now() }))
          // Check back when the song should end, so the next one shows up
          // without waiting out a full poll.
          const left = data?.playing ? data.durationMs - data.progressMs + 1500 : POLL_MS
          timer = setTimeout(() => {
            if (!document.hidden) load()
          }, Math.min(POLL_MS, Math.max(5000, left)))
        })
    }

    const onVisibility = () => {
      if (document.hidden) clearTimeout(timer)
      else load()
    }

    load()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return state
}
