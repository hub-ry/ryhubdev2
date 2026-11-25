import { mount } from 'svelte'
import '../src/app.css'
import './studio.css'
import Preview from './Preview.svelte'

const form = document.getElementById('draft-form')
const target = document.getElementById('post-preview')
for (const type of ['click', 'auxclick']) {
  target.addEventListener(type, (event) => {
    if (event.target instanceof Element && event.target.closest('a[href]')) event.preventDefault()
  })
}
mount(Preview, {
  target,
  props: { form, page: form.dataset.page },
})
