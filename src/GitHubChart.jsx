import { useLayoutEffect, useRef, useState } from 'react'
import { motion as Motion } from 'framer-motion'

function level(count) {
  if (count === 0) return 0
  if (count <= 3) return 1
  if (count <= 6) return 2
  if (count <= 9) return 3
  return 4
}

function dayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${m}/${d}/${y.slice(2)}`
}

function tooltipText(day) {
  return `${day.contributionCount} · ${formatDate(day.date)}`
}

export function ChartGrid({ weeks, cellSize = 11, gap = 3, showTooltip = false, animate = false, revealDuration = 10 }) {
  const [tip, setTip] = useState(null)

  const totalDays = weeks.reduce((sum, w) => sum + w.contributionDays.length, 0)
  const step = totalDays > 0 ? revealDuration / totalDays : 0
  // Day index of the first day of each week, so the stagger delay is derived
  // from position rather than a counter mutated during render.
  const weekOffsets = weeks.reduce(
    (acc, w) => [...acc, acc[acc.length - 1] + w.contributionDays.length],
    [0]
  )

  const onEnter = day => e => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTip({
      text: tooltipText(day),
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
  }
  const onLeave = () => setTip(null)

  return (
    <div className="chart-grid" style={{ '--cell': `${cellSize}px`, '--gap': `${gap}px` }}>
      {weeks.map((week, wi) => {
        const days = week.contributionDays
        const topPad = wi === 0 ? dayOfWeek(days[0].date) : 0
        const botPad = wi === weeks.length - 1 ? 6 - dayOfWeek(days[days.length - 1].date) : 0

        return (
          <div key={wi} className="chart-week">
            {Array.from({ length: topPad }, (_, i) => (
              <div key={`tp${i}`} className="chart-day" data-level="0" />
            ))}
            {days.map((day, di) => {
              const dayProps = {
                className: 'chart-day',
                'data-level': level(day.contributionCount),
                title: showTooltip ? undefined : tooltipText(day),
                onMouseEnter: showTooltip ? onEnter(day) : undefined,
                onMouseLeave: showTooltip ? onLeave : undefined,
              }
              if (animate) {
                const delay = (weekOffsets[wi] + di) * step
                return (
                  <Motion.div
                    key={day.date}
                    {...dayProps}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay, ease: 'easeOut' }}
                  />
                )
              }
              return <div key={day.date} {...dayProps} />
            })}
            {Array.from({ length: botPad }, (_, i) => (
              <div key={`bp${i}`} className="chart-day" data-level="0" />
            ))}
          </div>
        )
      })}

      {showTooltip && tip && (
        <div className="chart-tooltip" style={{ left: tip.x, top: tip.y }}>
          {tip.text}
        </div>
      )}
    </div>
  )
}

// Columns in a year of contributions. Used to size the skeleton before the
// real calendar arrives, so the fitted placeholder matches the loaded chart.
const DEFAULT_WEEKS = 53

// Largest cell/gap pair, at most the requested size and keeping its
// proportions, that lays `weeks` columns out within `width`. Sizes snap to
// whole device pixels so every square and gap renders identically instead of
// alternating between neighbouring pixel widths.
function fitGrid(width, weeks, cellSize, gap) {
  const natural = weeks * cellSize + (weeks - 1) * gap
  if (!width || natural <= width) return { cell: cellSize, gap }
  const dpr = window.devicePixelRatio || 1
  for (let cellDev = Math.floor(cellSize * dpr); cellDev >= 1; cellDev--) {
    const gapDev = Math.max(1, Math.round((cellDev * gap) / cellSize))
    if (weeks * cellDev + (weeks - 1) * gapDev <= width * dpr) {
      return { cell: cellDev / dpr, gap: gapDev / dpr }
    }
  }
  return { cell: 1 / dpr, gap: 1 / dpr }
}

// Width of the element behind `ref`, tracked as it resizes. Measured before
// paint so a narrow screen never shows the full-size chart first.
function useWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth)
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

export default function GitHubChart({ calendar, loading, cellSize = 11, gap = 3 }) {
  const [wrapRef, width] = useWidth()
  const weeks = calendar?.weeks.length || DEFAULT_WEEKS
  // Desktop keeps the requested size; narrow screens scale the whole year
  // down to fit rather than cutting off the most recent weeks.
  const fit = fitGrid(width, weeks, cellSize, gap)
  const gridHeight = 7 * fit.cell + 6 * fit.gap

  if (loading || !calendar) {
    return (
      <div className="chart-wrap" ref={wrapRef}>
        <div className="chart-skeleton" style={{ height: gridHeight }} />
        <p className="chart-meta">&nbsp;</p>
      </div>
    )
  }

  return (
    <div className="chart-wrap" ref={wrapRef}>
      <ChartGrid weeks={calendar.weeks} showTooltip cellSize={fit.cell} gap={fit.gap} />
      <p className="chart-meta">
        {calendar.totalContributions.toLocaleString()} contributions in the last year
      </p>
    </div>
  )
}
