import { useEffect, useState } from 'react'

const number = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

export default function TokenBurn() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      if (document.hidden) return
      try {
        const response = await fetch('https://tokens.ryhub.dev/usage.json', { signal: controller.signal })
        if (!response.ok) throw new Error('Usage unavailable')
        const snapshot = await response.json()
        if (Date.now() - Date.parse(snapshot.updatedAt) > 180_000) {
          setData(null)
          return
        }
        setData(snapshot)
      } catch {
        if (!controller.signal.aborted) setData(null)
      }
    }
    load()
    const timer = setInterval(load, 60_000)
    document.addEventListener('visibilitychange', load)
    return () => {
      controller.abort()
      clearInterval(timer)
      document.removeEventListener('visibilitychange', load)
    }
  }, [])

  if (!data) return null
  const { claude, codex } = data.providers
  return (
    <p className="cur-token-burn" title={`Recorded Claude Code, Codex and omp sessions on hub. Includes cached context, not subscription quota. Today in ${data.timezone}. Updated ${new Date(data.updatedAt).toLocaleTimeString()}.`}>
      tokens today: {number.format(claude.tokens + codex.tokens)}
      {' · '}Claude {number.format(claude.tokens)}
      {' · '}Codex {number.format(codex.tokens)}
      <span className="cur-row-note">includes {number.format(claude.cached + codex.cached)} cached · updates every minute</span>
    </p>
  )
}
