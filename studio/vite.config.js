import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

const fromStudio = (path) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [svelte()],
  publicDir: false,
  build: {
    outDir: fromStudio('./dist'),
    emptyOutDir: true,
    lib: {
      entry: fromStudio('./preview.js'),
      name: 'StudioPreview',
      formats: ['iife'],
      fileName: () => 'preview.js',
      cssFileName: 'preview',
    },
  },
})
