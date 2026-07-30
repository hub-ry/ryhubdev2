const DAY = 86400

/** 12d 6h · 6h 30m · 45m · instant */
export function duration(secs) {
  if (secs == null) return '—'
  if (secs <= 0) return 'instant'
  const d = Math.floor(secs / DAY)
  const h = Math.floor((secs % DAY) / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (d && h) return `${d}d ${h}h`
  if (d) return `${d}d`
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

/** Rounded to the nearest day, for long horizons. */
export function days(secs) {
  if (secs == null) return '—'
  const d = secs / DAY
  if (d < 1) return '<1d'
  if (d < 10) return `${d.toFixed(1)}d`
  return `${Math.round(d)}d`
}

export function count(n) {
  if (n == null) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e6) return `${(n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1)}M`
  if (abs >= 1e4) return `${Math.round(n / 1e3)}K`
  return n.toLocaleString('en-US')
}

export const RESOURCE_LABEL = {
  gold: 'gold',
  elixir: 'elixir',
  dark: 'dark',
  goldOrElixir: 'gold/elix',
  gems: 'gems',
}

export function cost(amount, resource) {
  if (!amount) return 'free'
  return `${count(amount)} ${RESOURCE_LABEL[resource] ?? resource}`
}

/** "2 Aug, 14:20" for a finishing upgrade. */
export function finishesAt(secsRemaining, now = Date.now()) {
  const d = new Date(now + secsRemaining * 1000)
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function shortDate(date) {
  if (!date) return null
  return date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ago(date, now = Date.now()) {
  if (!date) return null
  const s = Math.max(0, (now - date.getTime()) / 1000)
  if (s < 3600) return `${Math.round(s / 60)}m ago`
  if (s < DAY) return `${Math.round(s / 3600)}h ago`
  return `${Math.round(s / DAY)}d ago`
}
