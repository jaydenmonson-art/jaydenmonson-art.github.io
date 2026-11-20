import { existsSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { renderSite } from './scripts/render.mjs'

const root = dirname(fileURLToPath(import.meta.url))
renderSite()

function inputMap() {
  const entries = {
    index: resolve(root, 'index.html'),
    work: resolve(root, 'work.html'),
    about: resolve(root, 'about.html'),
    resume: resolve(root, 'resume.html'),
    contact: resolve(root, 'contact.html'),
    404: resolve(root, '404.html'),
  }
  const dir = resolve(root, 'projects')
  if (existsSync(dir)) {
    for (const name of readdirSync(dir)) {
      if (name.endsWith('.html')) {
        const slug = name.replace(/\.html$/, '')
        entries[`project-${slug}`] = resolve(dir, name)
      }
    }
  }
  return entries
}

function watchDataPlugin() {
  const dataDir = resolve(root, 'data')
  return {
    name: 'watch-portfolio-data',
    configureServer(server) {
      server.watcher.add(dataDir)
      server.watcher.on('change', (file) => {
        if (!file.startsWith(dataDir)) return
        renderSite()
        server.ws.send({ type: 'full-reload' })
      })
    },
  }
}

export default defineConfig({
  base: process.env.BASE_PATH || './',
  plugins: [watchDataPlugin()],
  server: {
    host: '0.0.0.0',
    port: 4721,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4721,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: inputMap(),
    },
  },
})
