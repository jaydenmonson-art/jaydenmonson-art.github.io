import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const force = process.argv.includes('--force')

const kindByCategory = {
  Exhibit: 'bays',
  Immersive: 'tunnel',
  Interactive: 'screen',
  Illustration: 'drawing',
  'Operations/CX': 'grid',
  Concept: 'theater',
}

const palettes = {
  bays: ['#efeae2', '#d5cdc0', '#cfc6b8', '#b7aea0', '#8a8176'],
  tunnel: ['#dddcd8', '#b9bab6', '#2e2b28', '#f7f4ef', '#8d8880'],
  screen: ['#e8e3da', '#d4cec3', '#f7f4ef', '#1c1916', '#c8c0b4'],
  drawing: ['#f7f4ef', '#e4ddd2', '#1c1916', '#cfc6b8', '#8a8176'],
  grid: ['#e6e4de', '#d0cdc4', '#f7f4ef', '#8a8176', '#3a342e'],
  theater: ['#ece7df', '#d4cdc2', '#1c1916', '#f7f4ef', '#8a8176'],
}

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function svg(width, height, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
${body}
</svg>
`
}

function labelBand(width, height, caption) {
  const band = Math.round(height * 0.16)
  const titleSize = Math.round(height * 0.042)
  const captionSize = Math.round(height * 0.026)
  const pad = Math.round(width * 0.04)
  return `
  <rect x="0" y="${height - band}" width="${width}" height="${band}" fill="#f3efe6"/>
  <line x1="0" y1="${height - band}" x2="${width}" y2="${height - band}" stroke="#1c1916" stroke-opacity="0.12"/>
  <text x="${pad}" y="${height - band * 0.55}" fill="#1c1916" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="${titleSize}" letter-spacing="3">PLACEHOLDER</text>
  <text x="${pad}" y="${height - band * 0.24}" fill="#6e675e" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="${captionSize}">${esc(caption)}</text>`
}

function background(width, height, from, to) {
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>`
}

function composition(kind, width, height) {
  const p = palettes[kind]
  const top = height * 0.1
  const art = height * 0.68
  if (kind === 'bays') {
    const gap = width * 0.04
    const bayW = (width * 0.84 - gap * 2) / 3
    const x0 = width * 0.08
    return [0, 1, 2]
      .map((i) => {
        const x = x0 + i * (bayW + gap)
        return `<rect x="${x}" y="${top}" width="${bayW}" height="${art}" fill="${p[2 + i]}"/>
        <rect x="${x + bayW * 0.38}" y="${top + art - height * 0.02}" width="${bayW * 0.24}" height="${height * 0.02}" fill="${p[0]}"/>`
      })
      .join('')
  }
  if (kind === 'tunnel') {
    return `
      <rect x="${width * 0.08}" y="${top}" width="${width * 0.84}" height="${art}" fill="${p[2]}"/>
      <rect x="${width * 0.36}" y="${top + art * 0.22}" width="${width * 0.28}" height="${art * 0.5}" fill="${p[3]}"/>
      <rect x="${width * 0.08}" y="${top + art * 0.78}" width="${width * 0.84}" height="${art * 0.08}" fill="#1c1916" fill-opacity="0.35"/>`
  }
  if (kind === 'screen') {
    return `
      <rect x="${width * 0.1}" y="${top}" width="${width * 0.8}" height="${art}" rx="${width * 0.02}" fill="${p[2]}" stroke="${p[3]}" stroke-width="4"/>
      <rect x="${width * 0.16}" y="${top + art * 0.14}" width="${width * 0.68}" height="${art * 0.58}" fill="${p[1]}"/>
      <circle cx="${width * 0.74}" cy="${top + art * 0.78}" r="${height * 0.045}" fill="none" stroke="${p[3]}" stroke-width="4"/>
      <circle cx="${width * 0.74}" cy="${top + art * 0.78}" r="${height * 0.018}" fill="${p[3]}"/>`
  }
  if (kind === 'drawing') {
    return `
      <ellipse cx="${width * 0.4}" cy="${top + art * 0.42}" rx="${width * 0.2}" ry="${art * 0.32}" fill="none" stroke="${p[2]}" stroke-width="4"/>
      <ellipse cx="${width * 0.56}" cy="${top + art * 0.46}" rx="${width * 0.16}" ry="${art * 0.36}" fill="none" stroke="${p[2]}" stroke-width="4"/>
      <ellipse cx="${width * 0.48}" cy="${top + art * 0.4}" rx="${width * 0.08}" ry="${art * 0.16}" fill="${p[3]}"/>
      <path d="M ${width * 0.16} ${top + art * 0.7} C ${width * 0.32} ${top + art * 0.1}, ${width * 0.58} ${top + art * 0.9}, ${width * 0.84} ${top + art * 0.22}" fill="none" stroke="${p[2]}" stroke-width="4" stroke-linecap="round"/>`
  }
  if (kind === 'grid') {
    const cols = 4
    const rows = 3
    const gap = width * 0.018
    const x0 = width * 0.1
    const y0 = top
    const cellW = (width * 0.8 - gap * (cols - 1)) / cols
    const cellH = (art - gap * (rows - 1)) / rows
    const dark = new Set(['1-1', '2-0', '3-2'])
    let cells = ''
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const fill = dark.has(`${c}-${r}`) ? p[4] : p[2]
        cells += `<rect x="${x0 + c * (cellW + gap)}" y="${y0 + r * (cellH + gap)}" width="${cellW}" height="${cellH}" fill="${fill}"/>`
      }
    }
    return cells
  }
  const cx = width * 0.5
  const stageY = top + art * 0.72
  return `
    <rect x="${width * 0.18}" y="${stageY}" width="${width * 0.64}" height="${art * 0.16}" fill="${p[2]}"/>
    <path d="M ${width * 0.18} ${stageY} A ${width * 0.32} ${art * 0.55} 0 0 1 ${width * 0.82} ${stageY}" fill="none" stroke="${p[2]}" stroke-width="4"/>
    <path d="M ${width * 0.26} ${stageY} A ${width * 0.24} ${art * 0.38} 0 0 1 ${width * 0.74} ${stageY}" fill="none" stroke="${p[2]}" stroke-width="3"/>
    <path d="M ${width * 0.34} ${stageY} A ${width * 0.16} ${art * 0.22} 0 0 1 ${width * 0.66} ${stageY}" fill="none" stroke="${p[4]}" stroke-width="3"/>
    <circle cx="${cx}" cy="${top + art * 0.22}" r="${height * 0.03}" fill="${p[4]}"/>`
}

function labeledArt(width, height, kind, caption) {
  const [from, to] = palettes[kind]
  return svg(
    width,
    height,
    `${background(width, height, from, to)}
    ${composition(kind, width, height)}
    ${labelBand(width, height, caption)}`,
  )
}

function plan(width, height, variant, caption) {
  const rooms = {
    0: [
      [140, 150, 380, 520],
      [560, 150, 380, 520],
      [980, 150, 460, 520],
    ],
    1: [
      [140, 300, 860, 280],
      [1040, 180, 400, 520],
    ],
    2: [
      [160, 150, 1280, 600],
      [660, 340, 280, 180],
    ],
    3: [
      [140, 220, 280, 420],
      [460, 220, 280, 420],
      [780, 220, 280, 420],
      [1100, 220, 340, 420],
    ],
    4: [
      [160, 160, 620, 250],
      [820, 160, 620, 250],
      [160, 460, 620, 250],
      [820, 460, 620, 250],
    ],
    5: [
      [180, 160, 1240, 560],
      [260, 520, 1080, 120],
    ],
  }[variant]
  const paths = {
    0: [[200, 680], [330, 410], [560, 410], [750, 410], [980, 410], [1200, 410], [1400, 300]],
    1: [[180, 440], [500, 440], [900, 440], [1240, 440]],
    2: [[240, 280], [500, 430], [800, 430], [1100, 280], [1280, 500]],
    3: [[180, 640], [280, 430], [460, 430], [600, 430], [780, 430], [920, 430], [1100, 430], [1280, 360]],
    4: [[300, 280], [700, 280], [1100, 280], [1100, 580], [470, 580], [300, 400]],
    5: [[260, 360], [500, 300], [800, 280], [1100, 320], [1320, 480]],
  }[variant]
  const roomMarkup = rooms
    .map(([x, y, w, h], i) => {
      const fill = i === 1 && variant === 2 ? '#d9d3c7' : '#f7f4ef'
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#1c1916" stroke-width="4"/>`
    })
    .join('')
  const d = paths.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt[0]} ${pt[1]}`).join(' ')
  const dots = paths
    .map(
      (pt, i) => `<g>
        <circle cx="${pt[0]}" cy="${pt[1]}" r="18" fill="#1c1916"/>
        <text x="${pt[0]}" y="${pt[1] + 6}" text-anchor="middle" fill="#f7f4ef" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="16">${i + 1}</text>
      </g>`,
    )
    .join('')
  return svg(
    width,
    height,
    `${background(width, height, '#e7e2d8', '#d5cec3')}
    <text x="80" y="90" fill="#6e675e" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="22" letter-spacing="3">GUEST FLOW</text>
    ${roomMarkup}
    <path d="${d}" fill="none" stroke="#1c1916" stroke-width="3" stroke-dasharray="10 8"/>
    ${dots}
    ${labelBand(width, height, caption)}`,
  )
}

function sketch(width, height, motif, caption) {
  const ink = '#2c2824'
  let body = ''
  if (motif === 'plan') {
    body = `
      <rect x="120" y="140" width="420" height="640" fill="none" stroke="${ink}" stroke-width="3"/>
      <rect x="560" y="140" width="500" height="300" fill="none" stroke="${ink}" stroke-width="3"/>
      <rect x="560" y="480" width="500" height="300" fill="none" stroke="${ink}" stroke-width="3"/>
      <path d="M180 780 L330 460 L700 300 L980 620" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`
  } else if (motif === 'elevation') {
    body = `
      <line x1="100" y1="860" x2="1100" y2="860" stroke="${ink}" stroke-width="3"/>
      <rect x="180" y="260" width="760" height="600" fill="none" stroke="${ink}" stroke-width="3"/>
      <rect x="300" y="380" width="420" height="240" fill="none" stroke="${ink}" stroke-width="3"/>
      <circle cx="940" cy="220" r="46" fill="none" stroke="${ink}" stroke-width="3"/>
      <line x1="180" y1="700" x2="940" y2="700" stroke="${ink}" stroke-width="2"/>`
  } else {
    body = `
      <rect x="90" y="360" width="200" height="200" fill="none" stroke="${ink}" stroke-width="3"/>
      <rect x="390" y="300" width="200" height="200" fill="none" stroke="${ink}" stroke-width="3"/>
      <rect x="690" y="380" width="200" height="200" fill="none" stroke="${ink}" stroke-width="3"/>
      <rect x="960" y="280" width="160" height="200" fill="none" stroke="${ink}" stroke-width="3"/>
      <path d="M300 460 L390 400 M590 400 L690 480 M890 480 L960 380" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`
  }
  return svg(
    width,
    height,
    `<rect width="${width}" height="${height}" fill="#f6f3ed"/>
    ${body}
    ${labelBand(width, height, caption)}`,
  )
}

function portrait(width, height) {
  return svg(
    width,
    height,
    `${background(width, height, '#e8e2d8', '#d2cbc0')}
    <text x="${width / 2}" y="${height * 0.48}" text-anchor="middle" fill="#1c1916" font-family="Liberation Serif, DejaVu Serif, serif" font-size="${Math.round(width * 0.22)}">JM</text>
    ${labelBand(width, height, 'Portrait')}`,
  )
}

function writeIfNeeded(file, contents) {
  if (!force && existsSync(file)) return false
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
  return true
}

function pdfBytes() {
  const stream = `BT
/F1 26 Tf
72 730 Td
(Jayden Monson) Tj
/F1 13 Tf
0 -34 Td
(Resume placeholder) Tj
0 -24 Td
(Replace this file with the real resume PDF.) Tj
0 -20 Td
(public/jayden-monson-resume.pdf) Tj
0 -40 Td
(Operations Lead, Painter1 Franchise) Tj
0 -22 Td
(Experience designer and operations leader.) Tj
0 -36 Td
(This page is a stand-in so the download button has a file.) Tj
ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf))
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`
  })
  const xref = Buffer.byteLength(pdf)
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return pdf
}

export function ensurePlaceholders() {
  const projects = JSON.parse(readFileSync(join(root, 'data/projects.json'), 'utf8'))
  let written = 0
  projects.forEach((project, index) => {
    if (project.placeholder === false) return
    const kind = kindByCategory[project.category] || 'bays'
    const dir = join(root, 'public/images', project.slug)
    const files = [
      ['cover.svg', labeledArt(1600, 1200, kind, `${project.category} · cover`)],
      ['hero.svg', labeledArt(1920, 1080, kind, `${project.category} · hero`)],
      ['site-plan.svg', plan(1600, 1000, index % 6, `${project.category} · guest flow`)],
      ['sketch-1.svg', sketch(1200, 1200, 'plan', 'Process sketch 1')],
      ['sketch-2.svg', sketch(1200, 1200, 'elevation', 'Process sketch 2')],
      ['sketch-3.svg', sketch(1200, 1200, 'sequence', 'Process sketch 3')],
    ]
    for (const [name, contents] of files) {
      if (writeIfNeeded(join(dir, name), contents)) written += 1
    }
  })
  if (writeIfNeeded(join(root, 'public/jayden-monson-resume.pdf'), pdfBytes())) written += 1
  return written
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
  const count = ensurePlaceholders()
  console.log(force ? `Wrote placeholder assets (${count} files).` : `Placeholder assets ready (${count} new files).`)
}
