/**
 * Bust from approved master + seven styled grade-1 floater sprites (SVG → PNG/WebP).
 * Run: node scripts/landing-assets.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.join(root, '..')
const landingSrc = path.join(appRoot, 'src/assets/landing')
const landingPublic = path.join(appRoot, 'public/landing')

const MASTER = path.join(landingSrc, 'source/pebble-open-head-hero-approved.jpg')
const MASTER_FALLBACK = path.join(landingSrc, 'source/open-head-bust.jpg')

const BUST_CROP = { left: 200 / 1152, top: 320 / 864, width: 752 / 1152, height: 540 / 864 }

const BUST_PNG = path.join(landingSrc, 'open_head_bust.png')
const BUST_WEBP = path.join(landingPublic, 'open_head_bust.webp')

const FLOATER_IDS = [
  'floater_sh',
  'floater_ship',
  'floater_8',
  'floater_plus',
  'floater_2',
  'floater_cat',
  'floater_sentence',
]

/** Distinct 3D-ish tiles (inspired by approved hero art). */
const STYLED_FLOATERS = {
  floater_sh: {
    w: 184,
    h: 160,
    svg: `
<svg width="184" height="160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7ec9cf"/>
      <stop offset="100%" stop-color="#4fa8b5"/>
    </linearGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="7" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect filter="url(#s)" x="16" y="18" width="132" height="118" rx="26" fill="url(#g)"/>
  <rect x="16" y="18" width="132" height="118" rx="26" fill="none" stroke="#2d6e75" stroke-opacity="0.25"/>
  <text x="82" y="98" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="700" fill="#0d2224">sh</text>
</svg>`,
  },
  floater_ship: {
    w: 180,
    h: 184,
    svg: `
<svg width="180" height="184" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#faf6ee"/>
      <stop offset="100%" stop-color="#e8dfd0"/>
    </linearGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="7" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect filter="url(#s)" x="14" y="20" width="136" height="132" rx="28" fill="url(#g)" stroke="#c8bfb0" stroke-width="1"/>
  <text x="82" y="106" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="600" fill="#1a1a1a">ship</text>
</svg>`,
  },
  floater_8: {
    w: 116,
    h: 152,
    svg: `
<svg width="116" height="152" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="#ff6a6a"/>
      <stop offset="100%" stop-color="#d42b2b"/>
    </linearGradient>
    <filter id="s" x="-30%" y="-20%" width="160%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="8" flood-opacity="0.28"/>
    </filter>
  </defs>
  <text filter="url(#s)" x="58" y="118" text-anchor="middle" font-family="Georgia, serif" font-size="108" font-weight="700" fill="url(#g)">8</text>
</svg>`,
  },
  floater_plus: {
    w: 96,
    h: 128,
    svg: `
<svg width="96" height="128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4a4a4a"/>
      <stop offset="100%" stop-color="#1c1c1c"/>
    </linearGradient>
    <filter id="s" x="-30%" y="-20%" width="160%" height="140%">
      <feDropShadow dx="0" dy="9" stdDeviation="7" flood-opacity="0.3"/>
    </filter>
  </defs>
  <g filter="url(#s)" fill="url(#g)">
    <rect x="38" y="22" width="20" height="84" rx="5"/>
    <rect x="16" y="54" width="64" height="20" rx="5"/>
  </g>
</svg>`,
  },
  floater_2: {
    w: 116,
    h: 120,
    svg: `
<svg width="116" height="120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="#8fd278"/>
      <stop offset="100%" stop-color="#4fa848"/>
    </linearGradient>
    <filter id="s" x="-25%" y="-20%" width="150%" height="140%">
      <feDropShadow dx="0" dy="9" stdDeviation="7" flood-opacity="0.22"/>
    </filter>
  </defs>
  <ellipse filter="url(#s)" cx="58" cy="62" rx="50" ry="44" fill="url(#g)"/>
  <ellipse cx="58" cy="62" rx="50" ry="44" fill="none" stroke="#2e6b24" stroke-opacity="0.2"/>
  <text x="58" y="78" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="#f4fff0">2</text>
</svg>`,
  },
  floater_cat: {
    w: 144,
    h: 128,
    svg: `
<svg width="144" height="128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffb06b"/>
      <stop offset="100%" stop-color="#e8782e"/>
    </linearGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="7" flood-opacity="0.22"/>
    </filter>
  </defs>
  <circle filter="url(#s)" cx="72" cy="64" r="48" fill="url(#g)"/>
  <text x="72" y="76" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#2a1406">cat</text>
</svg>`,
  },
  floater_sentence: {
    w: 368,
    h: 88,
    svg: `
<svg width="368" height="88" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="s" x="-10%" y="-30%" width="120%" height="160%">
      <feDropShadow dx="0" dy="6" stdDeviation="5" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect filter="url(#s)" x="6" y="20" width="356" height="48" rx="8" fill="#ffffff" stroke="#d8d8d8"/>
  <text x="184" y="54" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="#1a1a1a">The cat sat</text>
</svg>`,
  },
}

function idx(width, x, y) {
  return (y * width + x) * 4
}

function nearWhite(data, i, threshold = 246) {
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  return r >= threshold && g >= threshold && b >= threshold
}

function keyOuterWhite(data, width, height) {
  const out = Buffer.from(data)
  const bg = new Uint8Array(width * height)
  const queue = []

  const pushIfBg = (x, y) => {
    const p = y * width + x
    if (bg[p]) return
    const i = idx(width, x, y)
    if (!nearWhite(out, i)) return
    bg[p] = 1
    queue.push([x, y])
  }

  for (let x = 0; x < width; x += 1) {
    pushIfBg(x, 0)
    pushIfBg(x, height - 1)
  }
  for (let y = 0; y < height; y += 1) {
    pushIfBg(0, y)
    pushIfBg(width - 1, y)
  }

  while (queue.length > 0) {
    const [x, y] = queue.pop()
    for (const [nx, ny] of [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
      pushIfBg(nx, ny)
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const p = y * width + x
      const i = idx(width, x, y)
      if (bg[p]) {
        out[i + 3] = 0
        continue
      }
      const avg = (out[i] + out[i + 1] + out[i + 2]) / 3
      if (avg > 238) out[i + 3] = Math.min(out[i + 3], Math.round((248 - avg) * 42))
    }
  }

  return out
}

async function rasterWithAlpha(inputBuffer) {
  const { data, info } = await sharp(inputBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const keyed = keyOuterWhite(data, info.width, info.height)
  return sharp(keyed, { raw: { width: info.width, height: info.height, channels: 4 } }).png()
}

async function loadMaster() {
  const src = fs.existsSync(MASTER) ? MASTER : MASTER_FALLBACK
  if (!fs.existsSync(src)) {
    throw new Error(`landing-assets: missing master at ${src}`)
  }
  const meta = await sharp(src).metadata()
  return { src, meta }
}

function toPixels(meta, region) {
  return {
    left: Math.round(meta.width * region.left),
    top: Math.round(meta.height * region.top),
    width: Math.round(meta.width * region.width),
    height: Math.round(meta.height * region.height),
  }
}

async function ensureBust(master, meta) {
  const extract = toPixels(meta, BUST_CROP)
  const cropped = await sharp(master).extract(extract).toBuffer()
  const pngBuf = await (await rasterWithAlpha(cropped)).png().toBuffer()
  const trimmed = await sharp(pngBuf).trim({ threshold: 8 }).png().toBuffer()
  const sized = await sharp(trimmed)
    .resize({ width: 720, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer()

  fs.mkdirSync(path.dirname(BUST_PNG), { recursive: true })
  fs.mkdirSync(landingPublic, { recursive: true })
  fs.writeFileSync(BUST_PNG, sized)
  fs.copyFileSync(BUST_PNG, path.join(landingPublic, 'open_head_bust.png'))
  await sharp(sized).webp({ quality: 86, alphaQuality: 100, effort: 6 }).toFile(BUST_WEBP)
}

async function ensureStyledFloaters() {
  const outDir = path.join(landingPublic, 'floaters')
  fs.mkdirSync(outDir, { recursive: true })

  for (const id of FLOATER_IDS) {
    const spec = STYLED_FLOATERS[id]
    if (!spec) throw new Error(`landing-assets: missing styled spec for ${id}`)
    const svgBuf = Buffer.from(spec.svg.trim())
    const pngBuf = await sharp(svgBuf).png().toBuffer()
    const trimmed = await sharp(pngBuf).trim().png().toBuffer()
    const srcPng = path.join(landingSrc, `${id}.png`)
    const pubPng = path.join(outDir, `${id}.png`)
    const pubWebp = path.join(outDir, `${id}.webp`)
    fs.writeFileSync(srcPng, trimmed)
    fs.writeFileSync(pubPng, trimmed)
    await sharp(trimmed).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(pubWebp)
  }
}

async function writeLayeredQa() {
  const bustPath = path.join(landingPublic, 'open_head_bust.png')
  if (!fs.existsSync(bustPath)) return

  const canvasW = 840
  const canvasH = 630
  const bust = await sharp(bustPath)
    .resize(Math.round(canvasW * 0.78), Math.round(canvasH * 0.72), { fit: 'inside' })
    .toBuffer()
  const bustMeta = await sharp(bust).metadata()

  const placements = [
    { id: 'floater_sh', x: 0.09, y: 0.14, w: 0.11 },
    { id: 'floater_ship', x: 0.21, y: 0.12, w: 0.1 },
    { id: 'floater_8', x: 0.34, y: 0.1, w: 0.07 },
    { id: 'floater_plus', x: 0.46, y: 0.09, w: 0.055 },
    { id: 'floater_2', x: 0.58, y: 0.1, w: 0.07 },
    { id: 'floater_cat', x: 0.7, y: 0.12, w: 0.085 },
    { id: 'floater_sentence', x: 0.86, y: 0.13, w: 0.22 },
  ]

  const overlays = [
    {
      input: bust,
      left: Math.round((canvasW - bustMeta.width) / 2),
      top: canvasH - bustMeta.height - 12,
    },
  ]

  for (const place of placements) {
    const chipPath = path.join(landingPublic, 'floaters', `${place.id}.png`)
    if (!fs.existsSync(chipPath)) continue
    const targetW = Math.round(canvasW * place.w)
    const chip = await sharp(chipPath).resize({ width: targetW }).toBuffer()
    const chipMeta = await sharp(chip).metadata()
    overlays.push({
      input: chip,
      left: Math.round(canvasW * place.x - chipMeta.width / 2),
      top: Math.round(canvasH * place.y),
    })
  }

  const buf = await sharp({
    create: { width: canvasW, height: canvasH, channels: 3, background: '#fafafa' },
  })
    .composite(overlays)
    .png()
    .toBuffer()

  fs.writeFileSync(path.join(landingPublic, 'open-head-hero-layered-qa.png'), buf)

  const qaOut = process.env.PEBBLE_HERO_LAYERED_QA_OUT
  if (qaOut) {
    fs.mkdirSync(path.dirname(qaOut), { recursive: true })
    fs.writeFileSync(qaOut, buf)
  }
}

function pruneLegacyAssets() {
  const dirs = [landingPublic, path.join(landingPublic, 'floaters'), landingSrc]
  const keep = new Set([...FLOATER_IDS.map((id) => `${id}.png`), 'open_head_bust.png'])
  const drop = new Set([
    'open-head-bust.png',
    'open-head-bust.webp',
    'open-head-hero-qa.png',
    'cat.png',
    'cat.webp',
    'sh.png',
    'ship.png',
    'sum7.png',
    'sum8.png',
    'ten.png',
    'the.png',
  ])
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue
    for (const f of fs.readdirSync(dir)) {
      if (drop.has(f) || (f.startsWith('floater-') && !f.startsWith('floater_'))) {
        fs.unlinkSync(path.join(dir, f))
      }
      if (dir === landingSrc && f.startsWith('floater_') && !keep.has(f)) {
        fs.unlinkSync(path.join(dir, f))
      }
    }
  }
}

const { src, meta } = await loadMaster()
pruneLegacyAssets()
await ensureStyledFloaters()
await ensureBust(src, meta)
await writeLayeredQa()
console.log('landing-assets: done (7 styled floaters + bust)')