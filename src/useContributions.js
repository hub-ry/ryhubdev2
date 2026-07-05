import { useState, useEffect } from 'react'

export function useContributions() {
  const [calendar, setCalendar] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/github?type=contributions')
      .then(r => r.json())
      .then(json => {
        const cal = json.data?.user?.contributionsCollection?.contributionCalendar
        if (cal) setCalendar(cal)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { calendar, loading }
}
