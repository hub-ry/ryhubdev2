import { useState, useEffect } from 'react'

// Star counts for the owner's public repos, keyed by "owner/name" so a project
// entry can look itself up by the repo in its GitHub link.
export function useStars() {
  const [stars, setStars] = useState({})

  useEffect(() => {
    fetch('/api/github?type=stars')
      .then(r => r.json())
      .then(json => {
        const nodes = json.data?.user?.repositories?.nodes
        if (!nodes) return
        setStars(Object.fromEntries(nodes.map(n => [n.nameWithOwner, n.stargazerCount])))
      })
      .catch(() => {})
  }, [])

  return stars
}
