import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensurePlaceholders } from './generate-placeholders.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), 'utf8'))
}

function writeIfChanged(file, content) {
  const path = join(root, file)
  mkdirSync(dirname(path), { recursive: true })
  if (existsSync(path) && readFileSync(path, 'utf8') === content) return
  writeFileSync(path, content)
}

function safeRel(path, fallback) {
  if (typeof path !== 'string' || path.startsWith('/') || path.includes('..')) return fallback
  return path
}

function asset(depth, path) {
  return `${'../'.repeat(depth)}${path}`
}

function isReal(project) {
  return project.placeholder === false
}

function imagesFor(project) {
  const base = `images/${project.slug}`
  const custom = project.images ?? null
  if (!custom) {
    return {
      cover: `${base}/cover.svg`,
      hero: `${base}/hero.svg`,
      sitePlan: `${base}/site-plan.svg`,
      sketches: [1, 2, 3].map((n) => `${base}/sketch-${n}.svg`),
      wide: false,
    }
  }
  return {
    cover: safeRel(custom.cover, `${base}/cover.svg`),
    hero: safeRel(custom.hero, custom.cover || `${base}/hero.svg`),
    sitePlan: custom.sitePlan ? safeRel(custom.sitePlan, null) : null,
    sketches: Array.isArray(custom.sketches) ? custom.sketches.map((item) => safeRel(item, null)).filter(Boolean) : [],
    wide: Boolean(custom.wide),
    contain: Boolean(custom.contain),
    albums: Array.isArray(custom.albums) ? custom.albums : [],
    compareTitle: custom.compareTitle || '',
    compare: Array.isArray(custom.compare) ? custom.compare : [],
    video: custom.video || null,
    modelSlot: Boolean(custom.modelSlot),
    gallery: Array.isArray(custom.gallery) ? custom.gallery : [],
  }
}

function layout({ title, description, current, depth, body, site }) {
  const href = (path) => asset(depth, path)
  const items = [
    ['work.html', 'Work', 'work'],
    ['about.html', 'About', 'about'],
    ['resume.html', 'Resume', 'resume'],
    ['contact.html', 'Contact', 'contact'],
  ]
  const linkedInIcon = `<svg class="li-icon" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8.5h4V24h-4V8.5zM8.5 8.5h3.8v2.1h.05c.53-1 1.84-2.1 3.79-2.1 4.05 0 4.8 2.67 4.8 6.14V24h-4v-7.9c0-1.88-.03-4.3-2.62-4.3-2.62 0-3.02 2.05-3.02 4.16V24h-4V8.5z"/></svg>`
  const nav = items
    .map(([path, label, id]) => {
      const currentAttr = id === current ? ' aria-current="page"' : ''
      return `<li><a href="${href(path)}"${currentAttr}>${label}</a></li>`
    })
    .join('')
  const linkedInNav = `<li><a class="nav-external" href="${esc(site.linkedin)}" target="_blank" rel="noopener noreferrer">${linkedInIcon}LinkedIn</a></li>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#0c0e12">
  <link rel="icon" href="${href('favicon.svg')}" type="image/svg+xml">
  <link rel="stylesheet" href="${href('src/styles.css')}">
</head>
<body>
  <a class="skip" href="#content">Skip to content</a>
  <header class="site-header">
    <div class="inner header-bar">
      <a class="wordmark" href="${href('index.html')}">${esc(site.name)}</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <nav id="site-nav" aria-label="Primary">
        <ul class="nav">
          ${nav}
          ${linkedInNav}
        </ul>
      </nav>
    </div>
  </header>
  <main id="content">
    ${body}
  </main>
  <footer class="site-footer">
    <div class="inner footer-grid">
      <div>
        <p class="footer-name">${esc(site.name)}</p>
        <p class="footer-line">${esc(site.shift)}</p>
        ${site.footerNote ? `<p class="footer-note">${esc(site.footerNote)}</p>` : ''}
      </div>
      <ul class="footer-links">
        <li><a href="mailto:${esc(site.email)}">Email</a></li>
        <li><a href="${esc(site.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
        <li><a href="${href('resume.html')}">Resume</a></li>
      </ul>
    </div>
  </footer>
  <script type="module" src="${href('src/main.js')}"></script>
</body>
</html>
`
}

function badge(label = 'Placeholder') {
  return `<span class="badge">${esc(label)}</span>`
}

function frame(src, alt, width, height, options = {}) {
  const classes = ['frame']
  if (options.wide) classes.push('wide')
  if (options.contain) classes.push('contain')
  const badgeHtml = options.badge ? badge(options.badge) : ''
  return `<div class="${classes.join(' ')}">
      <img src="${esc(src)}" alt="${esc(alt)}" width="${width}" height="${height}">
      ${badgeHtml}
    </div>`
}

function projectCard(project, index, depth) {
  const images = imagesFor(project)
  const href = asset(depth, `projects/${project.slug}.html`)
  const number = String(index + 1).padStart(2, '0')
  const real = isReal(project)
  const compact = project.card === 'compact'
  let label = 'Placeholder'
  if (project.study) label = 'Design study'
  else if (real) label = ''
  const alt = project.cardAlt
    || (project.study
      ? `Reference material, not my work: ${project.title}`
      : real
        ? project.heroAlt || project.title
        : `Placeholder image for ${project.title}, ${project.category}`)
  const flag = project.study ? `<p class="study-flag">Reference · not my work</p>` : ''
  return `<a class="card${compact ? ' card-compact' : ''}" href="${href}">
    ${frame(asset(depth, images.cover), alt, images.contain ? 1600 : images.wide ? 1800 : 1600, images.contain ? 900 : images.wide ? 811 : 1200, { wide: images.wide, contain: images.contain, badge: label })}
    <p class="card-kicker"><span>${number}</span><span>${esc(project.category)}</span></p>
    <h2>${esc(project.title)}</h2>
    ${flag}
    <p class="card-summary">${esc(project.summary)}</p>
  </a>`
}

function homePage(site, projects) {
  const preferred = ['buglands', 'smithsonian-exhibit-study', 'jurassic-jungle-shoe-room']
  const featuredProjects = []
  for (const slug of preferred) {
    const match = projects.find((project) => project.slug === slug)
    if (match) featuredProjects.push(match)
  }
  for (const project of projects) {
    if (featuredProjects.length >= 3) break
    if (!featuredProjects.includes(project)) featuredProjects.push(project)
  }
  const featured = featuredProjects.map((project) => projectCard(project, projects.indexOf(project), 0)).join('\n')
  const focus = site.focus
    .map(
      (item, index) => `<article>
        <p class="index">${String(index + 1).padStart(2, '0')}</p>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.text)}</p>
      </article>`,
    )
    .join('\n')
  const workBlock = projects.length
    ? `<div class="feature-row">${featured}</div>
        <p class="more"><a href="work.html">All ${projects.length} projects</a></p>`
    : `<p class="empty">No projects yet. Add one in data/projects.json.</p>`

  return layout({
    title: `${site.name} — Experience designer and operations leader`,
    description: site.positioning,
    current: 'home',
    depth: 0,
    site,
    body: `<section class="hero">
      <div class="inner">
        <p class="eyebrow">${esc(site.role)}</p>
        <div class="hero-grid">
          <div class="hero-id">
            <figure class="headshot">
              ${frame(site.portrait, 'Jayden Monson', 864, 1080)}
            </figure>
            <h1><span>Jayden</span><span>Monson</span></h1>
          </div>
          <div class="hero-copy">
            <p class="lede">${esc(site.positioning)}</p>
            <div class="actions">
              <a class="btn btn-primary" href="work.html">View the work</a>
              <a class="btn btn-ghost" href="contact.html">Get in touch</a>
            </div>
            <p class="shift">${esc(site.shift)}</p>
          </div>
        </div>
      </div>
    </section>
    <section class="band" aria-labelledby="selected-work">
      <div class="inner">
        <div class="section-head">
          <h2 id="selected-work">Selected work</h2>
          <a href="work.html">Work index</a>
        </div>
        ${workBlock}
      </div>
    </section>
    <section class="band band-tight" aria-labelledby="focus-title">
      <div class="inner">
        <h2 id="focus-title" class="section-label">Focus</h2>
        <div class="focus">${focus}</div>
      </div>
    </section>`,
  })
}

function workPage(site, projects) {
  const cards = projects.length
    ? `<div class="work-grid">${projects.map((project, index) => projectCard(project, index, 0)).join('\n')}</div>`
    : `<p class="empty">No projects yet. Add one in data/projects.json and refresh.</p>`
  return layout({
    title: `Work — ${site.name}`,
    description: site.workIntro,
    current: 'work',
    depth: 0,
    site,
    body: `<section class="page-head">
      <div class="inner">
        <p class="eyebrow">Work · ${projects.length} ${projects.length === 1 ? 'project' : 'projects'}</p>
        <h1>Work</h1>
        <p class="dek">${esc(site.workIntro)}</p>
        ${cards}
      </div>
    </section>`,
  })
}

function aboutPage(site) {
  const bio = site.bio.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('\n')
  const skills = site.skills
    .map(
      (skill, index) =>
        `<li><span class="index">${String(index + 1).padStart(2, '0')}</span><span>${esc(skill)}</span></li>`,
    )
    .join('\n')
  return layout({
    title: `About — ${site.name}`,
    description: site.positioning,
    current: 'about',
    depth: 0,
    site,
    body: `<section class="page-head">
      <div class="inner">
        <p class="eyebrow">About</p>
        <div class="about-grid">
          <div class="prose">
            <blockquote>${esc(site.positioning)}</blockquote>
            ${bio}
          </div>
          <figure class="portrait">
            ${frame(site.portrait, 'Jayden Monson', 864, 1080)}
            <figcaption>Jayden Monson</figcaption>
          </figure>
        </div>
        <h2 class="section-label skills-label">Skills</h2>
        <ul class="skills">${skills}</ul>
      </div>
    </section>`,
  })
}

function timelineItems(entries) {
  return (entries || [])
    .map((role) => {
      const highlights = (role.highlights || []).map((item) => `<li>${esc(item)}</li>`).join('')
      const previous = role.previous ? `<p class="previous">${esc(role.previous)}</p>` : ''
      const detail = role.detail ? `<p class="previous">${esc(role.detail)}</p>` : ''
      const place = [role.org, role.location].filter(Boolean).join(' · ')
      return `<li>
        <p class="dates">${esc(role.dates)}</p>
        <h2>${esc(role.title)}</h2>
        ${previous}
        ${detail}
        <p class="org">${esc(place)}</p>
        ${highlights ? `<ul class="highlights">${highlights}</ul>` : ''}
      </li>`
    })
    .join('\n')
}

function resumePage(site) {
  const groups = (site.skillGroups || [])
    .map(
      (group) => `<section>
        <h3>${esc(group.title)}</h3>
        <p>${esc(group.items)}</p>
      </section>`,
    )
    .join('\n')
  return layout({
    title: `Resume — ${site.name}`,
    description: `Resume for ${site.name}, operations lead and experience designer.`,
    current: 'resume',
    depth: 0,
    site,
    body: `<section class="page-head">
      <div class="inner narrow">
        <p class="eyebrow">Resume</p>
        <h1>Experience</h1>
        <p class="dek">Operations, exhibit design, and the guest experience.</p>
        <p class="actions">
          <a class="btn btn-ghost" href="${esc(site.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </p>
        <ol class="timeline">${timelineItems(site.roles)}</ol>
        <h2 class="section-label timeline-label">Education</h2>
        <ol class="timeline">${timelineItems(site.education)}</ol>
        <h2 class="section-label timeline-label">Skills</h2>
        <div class="skill-groups">${groups}</div>
      </div>
    </section>`,
  })
}

function contactPage(site) {
  return layout({
    title: `Contact — ${site.name}`,
    description: `Contact ${site.name} by email or LinkedIn.`,
    current: 'contact',
    depth: 0,
    site,
    body: `<section class="page-head">
      <div class="inner narrow">
        <p class="eyebrow">Contact</p>
        <h1>Tell me about the space.</h1>
        <p class="dek">A note, a collaboration, or a role. Email and LinkedIn are how to reach me.</p>
        <div class="contact-list">
          <a href="mailto:${esc(site.email)}">
            <span class="label">Email</span>
            <span class="big">${esc(site.email)}</span>
          </a>
          <a href="${esc(site.linkedin)}" target="_blank" rel="noopener noreferrer">
            <span class="label">LinkedIn</span>
            <span class="big">${esc(site.linkedinLabel)}</span>
          </a>
        </div>
      </div>
    </section>`,
  })
}

function relatedBlock(project, projects, depth) {
  if (!project.series) return ''
  const others = projects.filter((item) => item.slug !== project.slug && item.series === project.series)
  if (!others.length) return ''
  const links = others
    .map(
      (item) => `<a class="next-project" href="${asset(depth, `projects/${item.slug}.html`)}">
        <span class="label">Related · ${esc(project.series)}</span>
        <span class="next-title">${esc(item.title)}</span>
        <span class="label">${esc(item.category)}</span>
      </a>`,
    )
    .join('\n')
  return `<div class="related">${links}</div>`
}

function compareBlock(images, depth) {
  if (!images.compare?.length) return ''
  const figures = images.compare
    .map(
      (item) => `<figure>
        <p class="label">${esc(item.label || '')}</p>
        ${frame(asset(depth, safeRel(item.src, '')), item.alt || item.caption || item.label || '', 1800, 811, { wide: true })}
        <figcaption>${esc(item.caption || '')}</figcaption>
      </figure>`,
    )
    .join('\n')
  return `<section class="block">
          <h2>${esc(images.compareTitle || 'Comparison')}</h2>
          <div class="compare-grid">${figures}</div>
        </section>`
}

function realProjectPage(site, project, projects) {
  const images = imagesFor(project)
  const depth = 1
  const meta = [project.category, project.place].filter(Boolean).join(' · ')
  const studyBanner = project.study
    ? `<p class="study-banner">Design study. These drawings are other designers’ concept documents. I studied them. I did not create them.</p>`
    : ''
  const hero = images.hero && !project.card
    ? `<figure class="hero-figure">
          ${frame(asset(depth, images.hero), project.heroAlt || project.title, images.contain ? 1600 : 1800, images.contain ? 900 : 811, { wide: images.wide, contain: images.contain })}
          ${project.heroCaption ? `<figcaption>${esc(project.heroCaption)}</figcaption>` : ''}
        </figure>`
    : ''
  const facts = [
    project.role ? `<section><h2>Role</h2><p>${esc(project.role)}</p></section>` : '',
    project.challenge ? `<section><h2>Challenge</h2><p>${esc(project.challenge)}</p></section>` : '',
    project.gained ? `<section><h2>What I gained</h2><p>${esc(project.gained)}</p></section>` : '',
  ].filter(Boolean)
  const factsHtml = facts.length ? `<div class="trio">${facts.join('\n')}</div>` : ''
  const steps = Array.isArray(project.steps) && project.steps.length
    ? `<section class="block"><h2>Process</h2><ol class="steps">${project.steps
        .map((step, stepIndex) => `<li><span>${String(stepIndex + 1).padStart(2, '0')}</span><p>${esc(step)}</p></li>`)
        .join('')}</ol></section>`
    : ''
  const video = images.video
    ? `<section class="block"><h2>Video</h2>
        <video controls muted playsinline poster="${esc(asset(depth, images.video.poster))}" width="1280" height="720">
          <source src="${esc(asset(depth, images.video.src))}" type="video/mp4">
        </video>
        ${images.video.caption ? `<p class="file-note">${esc(images.video.caption)}</p>` : ''}
      </section>`
    : ''
  const modelPath = project.images?.model || `images/${project.slug}/model.jpg`
  const modelReady = images.modelSlot && existsSync(join(root, 'public', modelPath))
  const model = modelReady
    ? `<section class="block"><h2>Model</h2>
        ${frame(asset(depth, modelPath), `SketchUp model of ${project.title}`, 1600, 1000, { wide: true })}
      </section>`
    : ''
  const regions = Array.isArray(project.regions) && project.regions.length
    ? `<section class="block"><h2>Regions</h2><ul class="regions">${project.regions
        .map((region) => `<li><span>${esc(region.name)}</span><p>${esc(region.text)}</p></li>`)
        .join('')}</ul></section>`
    : ''
  const albums = images.albums
    .map((album) => {
      const scrolling = album.layout === 'scroll'
      const stacked = album.layout === 'stack'
      const figures = (album.images || [])
        .map((item) => {
          const contain = item.fit === 'contain' || scrolling || stacked
          return `<figure>
            ${frame(asset(depth, safeRel(item.src, '')), item.alt || item.caption || album.title, contain ? 1600 : 1800, contain ? 900 : 811, { wide: !contain, contain })}
            <figcaption>${esc(item.caption || '')}</figcaption>
          </figure>`
        })
        .join('')
      return `<section class="block">
          <h2>${esc(album.title)}</h2>
          ${scrolling ? '<p class="file-note">Scroll sideways through the slides.</p>' : ''}
          <div class="${scrolling ? 'deck-scroll' : stacked ? 'album-grid album-stack' : 'album-grid'}">${figures}</div>
        </section>`
    })
    .join('\n')
  const gallery = images.gallery.length
    ? `<section class="block"><h2>Reference material</h2><div class="study-gallery">${images.gallery
        .map(
          (item) => `<figure>
            ${frame(asset(depth, safeRel(item.src, '')), item.alt || item.caption || '', 1800, 811, { wide: true, badge: 'Reference' })}
            <figcaption>${esc(item.caption || '')}</figcaption>
          </figure>`,
        )
        .join('')}</div></section>`
    : ''
  const goal = project.goalNote
    ? `<section class="block"><h2>Goal and outcome</h2><p>${esc(project.goalNote)}</p></section>`
    : ''
  const takeaways = project.takeaways
    ? `<section class="block"><h2>Key takeaways</h2><p>${esc(project.takeaways)}</p></section>`
    : ''
  const outcome = project.outcome
    ? `<section class="block outcome"><h2>Outcome</h2><p>${esc(project.outcome)}</p></section>`
    : ''
  const overview = project.overview
    ? `<section class="overview prose"><h2>Overview</h2><p>${esc(project.overview)}</p></section>`
    : ''

  return layout({
    title: `${project.title} · ${project.category} — ${site.name}`,
    description: project.summary,
    current: 'project',
    depth,
    site,
    body: `<article class="page-head project">
      <div class="inner">
        <p class="back"><a href="../work.html">All work</a></p>
        <p class="meta">${esc(meta)}</p>
        <h1>${esc(project.title)}</h1>
        <p class="dek">${esc(project.summary)}</p>
        ${studyBanner}
        ${hero}
        ${overview}
        ${factsHtml}
        ${regions}
        ${albums}
        ${steps}
        ${compareBlock(images, depth)}
        ${video}
        ${model}
        ${gallery}
        ${goal}
        ${takeaways}
        ${outcome}
        ${relatedBlock(project, projects, depth)}
      </div>
    </article>`,
  })
}

function projectPage(site, project, index, projects) {
  if (isReal(project)) return realProjectPage(site, project, projects)
  const images = imagesFor(project)
  const depth = 1
  const next = projects[(index + 1) % projects.length]
  const sketchFigures = images.sketches
    .map(
      (src, sketchIndex) => `<figure>
        ${frame(asset(depth, src), `Placeholder process sketch ${sketchIndex + 1} for ${project.title}`, 1200, 1200, { badge: 'Placeholder' })}
        <figcaption>Process sketch ${sketchIndex + 1}. Placeholder.</figcaption>
      </figure>`,
    )
    .join('\n')

  return layout({
    title: `${project.title} · ${project.category} — ${site.name}`,
    description: project.summary,
    current: 'project',
    depth,
    site,
    body: `<article class="page-head project">
      <div class="inner">
        <p class="back"><a href="../work.html">All work</a></p>
        <p class="meta">${esc(project.category)} · ${esc(project.year)} · Placeholder</p>
        <h1>${esc(project.title)}</h1>
        <p class="dek">${esc(project.summary)}</p>
        <figure class="hero-figure">
          ${frame(asset(depth, images.hero), `Placeholder hero image for ${project.title}, ${project.category}`, 1920, 1080, { badge: 'Placeholder' })}
          <figcaption>Hero image placeholder. Replace with a photograph of the finished space, or the key drawing if it was not built.</figcaption>
        </figure>
        <section class="overview prose">
          <h2>Overview</h2>
          <p>${esc(project.overview)}</p>
        </section>
        <div class="trio">
          <section>
            <h2>Role</h2>
            <p>${esc(project.role)}</p>
          </section>
          <section>
            <h2>Challenge</h2>
            <p>${esc(project.challenge)}</p>
          </section>
          <section>
            <h2>Approach</h2>
            <p>${esc(project.approach)}</p>
          </section>
        </div>
        <section class="block">
          <h2>Guest flow</h2>
          <figure class="plan-figure">
            ${frame(asset(depth, images.sitePlan), `Placeholder guest flow plan for ${project.title}`, 1600, 1000, { badge: 'Placeholder' })}
            <figcaption>Guest flow / site plan placeholder. Replace with a plan, diagram, or circulation sketch.</figcaption>
          </figure>
        </section>
        <section class="block">
          <h2>Process sketches</h2>
          <div class="sketches">${sketchFigures}</div>
        </section>
        <section class="block outcome">
          <h2>Outcome</h2>
          <p>${esc(project.outcome)}</p>
        </section>
        <a class="next-project" href="${esc(next.slug)}.html">
          <span class="label">Next project</span>
          <span class="next-title">${esc(next.title)}</span>
          <span class="label">${esc(next.category)}</span>
        </a>
      </div>
    </article>`,
  })
}

function notFoundPage(site) {
  return layout({
    title: `Page not found — ${site.name}`,
    description: 'That page is not on this site.',
    current: '',
    depth: 0,
    site,
    body: `<section class="page-head">
      <div class="inner narrow">
        <p class="eyebrow">404</p>
        <h1>That page isn’t here.</h1>
        <p class="dek">The work, the bio, and the contact links are still on the site.</p>
        <p class="actions"><a class="btn btn-primary" href="index.html">Back home</a></p>
      </div>
    </section>`,
  })
}

export function renderSite() {
  ensurePlaceholders()
  const site = readJson('data/site.json')
  const projects = readJson('data/projects.json')
  if (!Array.isArray(projects)) throw new Error('data/projects.json must be an array')

  const slugs = new Set()
  for (const project of projects) {
    if (!project.slug || !/^[a-z0-9-]+$/.test(project.slug)) {
      throw new Error(`Project slug "${project.slug}" must use lowercase letters, numbers, and hyphens.`)
    }
    if (slugs.has(project.slug)) throw new Error(`Duplicate project slug: ${project.slug}`)
    slugs.add(project.slug)
    const required = isReal(project)
      ? ['title', 'category', 'summary']
      : ['title', 'category', 'summary', 'overview', 'role', 'challenge', 'approach', 'outcome']
    for (const key of required) {
      if (!project[key]) throw new Error(`Project "${project.slug}" is missing ${key}.`)
    }
  }

  writeIfChanged('index.html', homePage(site, projects))
  writeIfChanged('work.html', workPage(site, projects))
  writeIfChanged('about.html', aboutPage(site))
  writeIfChanged('resume.html', resumePage(site))
  writeIfChanged('contact.html', contactPage(site))
  writeIfChanged('404.html', notFoundPage(site))

  const projectDir = join(root, 'projects')
  mkdirSync(projectDir, { recursive: true })
  projects.forEach((project, index) => {
    writeIfChanged(`projects/${project.slug}.html`, projectPage(site, project, index, projects))
  })
  if (existsSync(projectDir)) {
    for (const name of readdirSync(projectDir)) {
      if (name.endsWith('.html') && !slugs.has(name.replace(/\.html$/, ''))) {
        unlinkSync(join(projectDir, name))
      }
    }
  }
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
  renderSite()
  console.log('Site pages rendered from data/site.json and data/projects.json.')
}
