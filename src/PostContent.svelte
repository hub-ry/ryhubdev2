<script>
  import MarkdownIt from 'markdown-it'

  let { title, markdown, author = '', cover = '', video = '', date = '', href = '#post-title', backHref = '' } = $props()
  let [year, month, day] = $derived(date.split('-'))
  let dateLabel = $derived(`${month}/${day}/${year}`)
  const parser = new MarkdownIt({ html: false })
  let body = $derived(parser.render(markdown))
</script>

<article>
  {#if title}
    <div class:post-title-row={backHref}>
      {#if backHref}<a href={backHref}>← back</a>{/if}
      <p class="section-title" id="post-title"><strong><a {href}>{title}</a></strong></p>
    </div>
  {/if}
  {#if author || date}
    <p class="section-title">
      {#if author}By {author}{/if}
      {#if author && date}{' · '}{/if}
      {#if date}<time datetime={date}>{dateLabel}</time>{/if}
    </p>
  {/if}
  {#if cover}
    <img class="cover" src={cover} alt="" />
  {/if}
  {#if video}
    <!-- svelte-ignore a11y_media_has_caption (Add a transcript in the post for videos with speech.) -->
    <video src={video} controls playsinline preload="metadata" aria-label={`Video for ${title || 'this project'}`}></video>
  {/if}
  {@html body}
</article>

<style>
  article {
    overflow-wrap: anywhere;
  }

  .post-title-row {
    display: grid;
    grid-template-columns: 4rem minmax(0, 1fr) 4rem;
    align-items: baseline;
  }

  .cover,
  video {
    display: block;
    width: 100%;
    height: auto;
    margin-block: 16px;
  }

  article :global(pre) {
    overflow: auto;
  }
</style>
