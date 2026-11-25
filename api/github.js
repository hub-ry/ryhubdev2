// Vercel serverless function.
// Keeps the GitHub token out of the browser.

const USERNAME = 'hub-ry'

const query = `{
  user(login: "${USERNAME}") {
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

export default async function handler(req, res) {
  if (req.query.type !== 'contributions') {
    res.status(400).json({ error: 'unknown query type' })
    return
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    res.status(500).json({ error: 'GITHUB_TOKEN not configured' })
    return
  }

  try {
    const upstream = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
    const json = await upstream.json()
    // Cache at the CDN so the token isn't hit on every page load, while
    // still refreshing roughly every 30 minutes.
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')
    res.status(200).json(json)
  } catch {
    res.status(502).json({ error: 'upstream request failed' })
  }
}
