<script>
  import PostContent from './PostContent.svelte'
  import { localPosts, newestFirst } from './localPosts.js'

  let { section, id } = $props()
  const base = import.meta.env.VITE_POSTS_API_URL?.replace(/\/+$/, '')
  let endpoint = $derived(`${base}/posts/${section}${id ? `/${id}` : ''}`)
  let recent = $derived(section === 'recent')
  let blog = $derived(section === 'blog')
  let local = $derived(localPosts.filter((post) => recent || post.kind === section))
  let file = $derived(id ? local.find((post) => post.id === id) : null)
  let entries = $state(null)
  let message = $state('')
  let selectedTags = $state([])
  let posts = $derived(id ? [] : [...local, ...(entries ?? [])].sort(newestFirst))
  let tags = $derived([...new Set(posts.flatMap((post) => post.tags ?? []))].sort())
  let filtered = $derived(selectedTags.length
    ? posts.filter((post) => post.tags?.some((tag) => selectedTags.includes(tag)))
    : posts)

  $effect(() => {
    if (file) return
    if (id && (!base || !/^\d+$/.test(id))) {
      message = 'Post not found.'
      return
    }
    if (!base) return
    const controller = new AbortController()
    const load = async (url) => {
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal })
      if (!response.ok) throw new Error(response.status === 404 ? 'Post not found.' : 'Could not load posts.')
      return response.json()
    }

    const request = recent
      ? Promise.allSettled(['blog', 'projects'].map(async (kind) => {
          const posts = await load(`${base}/posts/${kind}`)
          return posts.map((post) => ({ ...post, kind }))
        })).then((groups) => {
          if (groups.every((group) => group.status === 'rejected')) throw new Error('Could not load posts.')
          return groups.flatMap((group) => group.status === 'fulfilled' ? group.value : [])
        })
      : load(endpoint)

    request.then((data) => { if (!controller.signal.aborted) entries = data })
      .catch((error) => {
        if (!controller.signal.aborted) message = error.message
      })
    return () => controller.abort()
  })
</script>

{#if blog && id && !(file || entries)}
  <p><a href="#blog">← back</a></p>
{/if}

{#if id && (file || entries)}
  {@const post = file ?? entries}
  <PostContent
    title={post.title}
    author={post.author}
    markdown={post.markdown}
    date={post.date}
    cover={blog ? '' : (file ? post.cover : post.has_cover ? `${endpoint}/cover` : '')}
    video={blog ? '' : (file ? post.video : post.has_video ? `${endpoint}/video` : '')}
    href={`#${section}/${id}`}
    backHref={blog ? '#blog' : ''}
  />
{:else if blog && !id}
  <div class="blog-index">
    <div>
      {#if filtered.length}
        <ul class="link-list">
          {#each filtered as post (post.id)}
            <li>
              <a href={`#blog/${post.id}`}>{post.title}</a>{#if post.author}<small>{` by ${post.author}`}</small>{/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p>{message || (base && !entries ? 'Loading…' : 'No posts yet.')}</p>
      {/if}
    </div>
    <aside aria-label="Blog tags">
      <fieldset>
        <legend>Filter by tag</legend>
        {#each tags as tag (tag)}
          <label><input type="checkbox" value={tag} bind:group={selectedTags} /> {tag}</label>
        {/each}
      </fieldset>
    </aside>
  </div>
{:else if !id && posts.length}
  {#each (recent ? posts.slice(0, 5) : posts) as post (`${post.kind ?? section}/${post.id}`)}
    <p class="section-title">
      <strong><a href={`#${post.kind ?? section}/${post.id}`}>{post.title}</a></strong>
      {#if recent}
        {#if post.kind === 'blog'}
          <small> — blog{post.author ? ` by ${post.author}` : ''}</small>
        {:else}
          <small> — Project</small>
        {/if}
      {/if}
    </p>
  {/each}
{:else if message}
  <p>{message}</p>
{:else if base && !entries}
  <p class="section-title">Loading…</p>
{:else}
  <p class="section-title">No posts yet.</p>
{/if}

<style>
  .blog-index {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 8rem);
    gap: 1rem;
    overflow-wrap: anywhere;
  }

  aside {
    margin-block: 1em;
    padding-inline-start: 0.75rem;
    border-inline-start: 1px solid #e8e4dc;
  }

  fieldset {
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  fieldset label {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    margin-top: 0.25rem;
  }

  @media (max-width: 420px) {
    .blog-index {
      grid-template-columns: minmax(0, 1fr);
      gap: 0;
    }

    aside {
      grid-row: 1;
      margin-bottom: 0;
      padding-inline-start: 0;
      border-inline-start: 0;
    }

  }
</style>
