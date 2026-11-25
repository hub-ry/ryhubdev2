<script>
  let { children, page } = $props()
  const links = ['Home', 'Blog', 'Projects', 'About']
</script>

<div class="column">
  <header>
    <h1>Ryan's Website</h1>
    <nav aria-label="Main navigation">
      {#each links as label, index (label)}
        {@const href = `#${label.toLowerCase()}`}
        {#if index > 0}<span aria-hidden="true">/</span>{/if}
        <a {href} aria-current={(page || '#home') === href ? 'page' : undefined}>{label}</a>
      {/each}
    </nav>
  </header>

  <main>{@render children?.()}</main>
  <footer>Created with <a href="https://svelte.dev/">Svelte</a></footer>
</div>

<style>
  .column {
    --outer-gap: 16px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: min(565px, calc(100% - 16px));
    min-height: calc(100svh - 2 * var(--outer-gap));
    margin: var(--outer-gap) auto;
    padding: 24px 16px;
    background: white;
  }

  header {
    text-align: center;
  }

  h1 {
    margin: 0;
    font: bold 36px/1.15 Arial, sans-serif;
  }

  nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: 6px;
    font: 12px/1.4 Arial, sans-serif;
    text-transform: uppercase;
    color: #42364f;
  }

  footer {
    margin-top: auto;
    font: 12px/1.4 Arial, sans-serif;
    text-align: center;
    color: #555;
  }
</style>
