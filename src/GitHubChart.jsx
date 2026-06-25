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

export function ChartGrid({ weeks, cellSize = 11, gap = 3 }) {
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
            {days.map(day => (
              <div
                key={day.date}
                className="chart-day"
                data-level={level(day.contributionCount)}
                title={`${day.date} — ${day.contributionCount} contribution${day.contributionCount !== 1 ? 's' : ''}`}
              />
            ))}
            {Array.from({ length: botPad }, (_, i) => (
              <div key={`bp${i}`} className="chart-day" data-level="0" />
            ))}
          </div>
        )
      })}
    </div>
  )
}

export default function GitHubChart({ calendar, loading }) {
  if (loading) return <div className="chart-skeleton" />
  if (!calendar) return null

  return (
    <div className="chart-wrap">
      <ChartGrid weeks={calendar.weeks} />
      <p className="chart-meta">
        {calendar.totalContributions.toLocaleString()} contributions in the last year
      </p>
    </div>
  )
}
