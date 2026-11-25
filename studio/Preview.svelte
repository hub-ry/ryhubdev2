<script>
  import SiteLayout from '../src/SiteLayout.svelte'
  import PostContent from '../src/PostContent.svelte'

  let { form, page } = $props()
  let title = $state('')
  let markdown = $state('')
  let date = $state('')
  let cover = $state('')
  let video = $state('')

  function mediaPreview(name) {
    let file
    let url = ''
    return {
      read() {
        const selected = form.elements[name]?.files[0]
        if (selected !== file) {
          if (url) URL.revokeObjectURL(url)
          file = selected
          url = file ? URL.createObjectURL(file) : ''
        }
        return url || (form.elements[`remove_${name}`]?.checked ? '' : form.dataset[name])
      },
      close() {
        if (url) URL.revokeObjectURL(url)
      },
    }
  }

  $effect(() => {
    const coverPreview = mediaPreview('cover')
    const videoPreview = mediaPreview('video')

    function update() {
      title = form.elements.title.value
      markdown = form.elements.markdown.value
      date = form.elements.date?.value ?? ''
      cover = coverPreview.read()
      video = videoPreview.read()
    }

    update()
    form.addEventListener('input', update)
    return () => {
      form.removeEventListener('input', update)
      coverPreview.close()
      videoPreview.close()
    }
  })
</script>

<SiteLayout {page}>
  <h2 class="page-title">{page === '#projects' ? 'Projects' : 'Blog'}</h2>
  <PostContent {title} {markdown} {date} {cover} {video} />
</SiteLayout>
