const files = import.meta.glob([
  '../content/{blog,projects}/*.md',
  '!../content/{blog,projects}/TEMPLATE.md',
], { query: '?raw', import: 'default', eager: true })

function mediaPath(value) {
  return /^\/(?!\/)[\w./%-]+$/.test(value ?? '') ? value : ''
}

export const localPosts = Object.entries(files).flatMap(([path, text]) => {
  const [, kind, id] = /\/([^/]+)\/([^/]+)\.md$/.exec(path)
  const parts = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)
  const meta = {}
  for (const line of parts?.[1].split(/\r?\n/) ?? []) {
    const field = /^(title|author|date|tags|cover|video):\s*(.*)$/.exec(line)
    if (field) meta[field[1]] = field[2].trim()
  }
  if (!/^(?![0-9]+$)[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || !meta.title) {
    console.warn(`${path}: use a lowercase slug with hyphens between words, not digits alone, and add a title.`)
    return []
  }
  return {
    kind, id, title: meta.title, markdown: text.slice(parts[0].length).trim(),
    author: meta.author ?? '',
    date: /^\d{4}-\d{2}-\d{2}$/.test(meta.date ?? '') ? meta.date : '',
    tags: [...new Set((meta.tags ?? '').split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean))],
    cover: kind === 'projects' ? mediaPath(meta.cover) : '',
    video: kind === 'projects' ? mediaPath(meta.video) : '',
  }
})

export function newestFirst(a, b) {
  return (b.date ?? '').localeCompare(a.date ?? '')
    || Number(typeof b.id === 'string') - Number(typeof a.id === 'string')
    || (typeof a.id === 'number' ? b.id - a.id : a.title.localeCompare(b.title))
}
