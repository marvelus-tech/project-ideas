/**
 * Stipple bust WebP plus transparent floater chips for the landing hero.
 * Run from apps/pebble-crossing: node scripts/landing-assets.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.join(root, '..')
const landingSrc = path.join(appRoot, 'src/assets/landing')
const landingPublic = path.join(appRoot, 'public/landing')

const FLOATERS = [
  { id: 'sh', label: 'sh', sub: 'digraph', bg: '#e8f4f1', ink: '#173b3a' },
  { id: 'ship', label: 'ship', sub: 'word', bg: '#fff4dc', ink: '#3d2c1a' },
  { id: 'cat', label: 'cat', sub: 'CVC', bg: '#f0ebe3', ink: '#2a2a2a' },
  { id: 'sum8', label: '8 + 2', sub: 'math', bg: '#e3eef8', ink: '#1a3a5c' },
  { id: 'sum7', label: '7 − 3', sub: 'math', bg: '#ebe8f4', ink: '#2e2450' },
  { id: 'ten', label: '10', sub: 'fact', bg: '#f8e8e8', ink: '#5c1f1f' },
  { id: 'the', label: 'the', sub: 'tricky', bg: '#edf5e8', ink: '#2d4a22' },
]

const BUST_SOURCE = path.join(landingSrc, 'source/open-head-bust.jpg')
const BUST_PNG = path.join(landingSrc, 'open-head-bust.png')
const BUST_WEBP = path.join(landingPublic, 'open-head-bust.webp')

async function ensureBust() {
  if (!fs.existsSync(BUST_SOURCE)) {
    console.warn('landing-assets: missing bust source, skipping bust export')
    return
  }
  await sharp(BUST_SOURCE)
    .resize(900, 1200, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9 })
    .toFile(BUST_PNG)

  await sharp(BUST_PNG)
    .webp({ quality: 82, effort: 6 })
    .toFile(BUST_WEBP)

  fs.copyFileSync(BUST_PNG, path.join(landingPublic, 'open-head-bust.png'))
}

function floaterSvg({ label, sub, bg, ink }) {
  const titleSize = label.length > 4 ? 34 : 40
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="168" height="168" viewBox="0 0 168 168">
  <defs>
    <filter id="s" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#1a1a1a" flood-opacity="0.14"/>
    </filter>
  </defs>
  <rect x="12" y="8" width="144" height="144" rx="36" fill="${bg}" filter="url(#s)"/>
  <text x="84" y="82" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${titleSize}" font-weight="700" fill="${ink}">${label}</text>
  <text x="84" y="112" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" letter-spacing="0.12em" fill="${ink}" opacity="0.55">${sub.toUpperCase()}</text>
</svg>`
}

async function ensureFloaters() {
  const outDir = path.join(landingPublic, 'floaters')
  fs.mkdirSync(outDir, { recursive: true })
  for (const token of FLOATERS) {
    const svg = Buffer.from(floaterSvg(token))
    const png = path.join(landingSrc, `floater-${token.id}.png`)
    const webp = path.join(outDir, `${token.id}.webp`)
    await sharp(svg).png().toFile(png)
    await sharp(png).webp({ quality: 90, alphaQuality: 100 }).toFile(webp)
    fs.copyFileSync(png, path.join(outDir, `${token.id}.png`))
  }
}

async function writeHeroQaStill() {
  const bust = path.join(landingPublic, 'open-head-bust.png')
  if (!fs.existsSync(bust)) return
  const qaOut = process.env.PEBBLE_HERO_QA_OUT
  const layers = [await sharp(bust).resize(720, 960, { fit: 'contain', background: '#fafafa' }).png().toBuffer()]
  let composite = sharp(layers[0])
  const overlays = []
  const placements = [
    { id: 'cat', left: 40, top: 70 },
    { id: 'sh', left: 120, top: 30 },
    { id: 'ship', left: 230, top: 20 },
    { id: 'sum8', left: 360, top: 35 },
    { id: 'ten', left: 500, top: 80 },
    { id: 'sum7', left: 580, top: 140 },
    { id: 'the', left: 620, top: 220 },
  ]
  for (const place of placements) {
    const chip = path.join(landingPublic, 'floaters', `${place.id}.png`)
    if (!fs.existsSync(chip)) continue
    overlays.push({ input: await sharp(chip).resize(96).toBuffer(), left: place.left, top: place.top })
  }
  const buf = await composite.composite(overlays).png().toBuffer()
  const localQa = path.join(landingPublic, 'open-head-hero-qa.png')
  fs.writeFileSync(localQa, buf)
  if (qaOut) {
    fs.mkdirSync(path.dirname(qaOut), { recursive: true })
    fs.writeFileSync(qaOut, buf)
  }
}

await ensureBust()
await ensureFloaters()
await writeHeroQaStill()
console.log('landing-assets: done')