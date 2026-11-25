<script>
  import SiteLayout from './SiteLayout.svelte'
  import PublicPosts from './PublicPosts.svelte'

  let page = $state(window.location.hash)
  let postRoute = $derived(/^#(blog|projects)(?:\/([1-9][0-9]{0,17}|(?![0-9]+$)[a-z0-9]+(?:-[a-z0-9]+)*))?$/.exec(page))

  function markVisited(event) {
    if (event.target instanceof Element) {
      event.target.closest('a[href]')?.classList.add('visited')
    }
  }
</script>

<svelte:window onhashchange={() => (page = window.location.hash)} onclick={markVisited} />

<SiteLayout page={postRoute ? `#${postRoute[1]}` : page}>
  {#if postRoute}
    {#if !postRoute[2]}
      {#if postRoute[1] === 'blog'}
        <img class="section-photo" src="/photos/IMG_2458.jpeg" alt="" />
      {:else}
        <img class="section-photo" src="/photos/IMG_3827.jpg" alt="" />
      {/if}
      <h2 class="page-title" class:blog-title={postRoute[1] === 'blog'}>{postRoute[1] === 'blog' ? 'Blog' : 'Projects'}</h2>
    {/if}
    {#key page}
      <PublicPosts section={postRoute[1]} id={postRoute[2]} />
    {/key}
  {:else if page === '#about'}
    <img class="section-photo" src="/photos/IMG_2604.jpg" alt="" />
    <p class="section-title"><strong>About Me</strong></p>
    <p>Thanks for checking out my website! My name is Ryan, I'm currently a 3rd year university
        student studying computer science. I'm interested in new technologies to help with automation,
        in hope that we can make the world a better place.</p>

    <p>I also like music, architecture + infrastructure, and language.</p>
    <p><strong>Connect with me</strong></p>
    <ul class="link-list">
      <li><a href="https://www.instagram.com/ryanhubbart/">Instagram</a></li>
      <li><a href="https://github.com/hub-ry">GitHub</a></li>
      <li><a href="https://x.com/ryanhubbart">X</a></li>
      <li>rhubbart@purdue.edu</li>
    </ul>
  {:else}
    <img
      class="home-photo"
      src="/photos/IMG_1978.jpg"
      alt="A fountain and statue framed by trees and an ivy-covered wall"
      width="4604"
      height="3066"
    />
    <h2 class="page-title">Recents</h2>
    <PublicPosts section="recent" />
  {/if}
</SiteLayout>

<style>
  .blog-title {
    margin-block-end: 0;
  }

  .section-photo {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 3 / 1;
    object-fit: cover;
    object-position: center 40%;
    margin-block: 16px;
  }

  .home-photo {
    display: block;
    width: 80%;
    height: auto;
    margin: 16px auto;
  }
</style>
