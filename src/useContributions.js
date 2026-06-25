import { useState, useEffect } from 'react'

const QUERY = `{
  user(login: "hub-ry") {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
  }
}`

export function useContributions() {
  const [calendar, setCalendar] = useState(null)
  const [loading, setLoading] = useState(true)
  const token = import.meta.env.VITE_GITHUB_TOKEN

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: QUERY }),
    })
      .then(r => r.json())
      .then(json => {
        const cal = json.data?.user?.contributionsCollection?.contributionCalendar
        if (cal) setCalendar(cal)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  return { calendar, loading }
}
