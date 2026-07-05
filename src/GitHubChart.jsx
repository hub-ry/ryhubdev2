import { useState } from 'react'
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
  let dayIdx = 0

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
            {days.map(day => {
              const dayProps = {
                className: 'chart-day',
                'data-level': level(day.contributionCount),
                title: showTooltip ? undefined : tooltipText(day),
                onMouseEnter: showTooltip ? onEnter(day) : undefined,
                onMouseLeave: showTooltip ? onLeave : undefined,
              }
              if (animate) {
                const delay = dayIdx * step
                dayIdx += 1
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

export default function GitHubChart({ calendar, loading, cellSize = 11, gap = 3 }) {
  const gridHeight = 7 * cellSize + 6 * gap

  if (loading || !calendar) {
    return (
      <div className="chart-wrap">
        <div className="chart-skeleton" style={{ height: gridHeight }} />
        <p className="chart-meta">&nbsp;</p>
      </div>
    )
  }

  return (
    <div className="chart-wrap">
      <ChartGrid weeks={calendar.weeks} showTooltip cellSize={cellSize} gap={gap} />
      <p className="chart-meta">
        {calendar.totalContributions.toLocaleString()} contributions in the last year
      </p>
    </div>
  )
}
