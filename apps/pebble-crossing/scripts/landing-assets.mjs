/**
 * Extract transparent bust + floater sprites from the approved hero master.
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

/** Pixel crops from `pebble-open-head-hero-approved.jpg` (1152×864). */
const FLOATER_CROPS = {
  floater_sh: { left: 62 / 1152, top: 102 / 864, width: 112 / 1152, height: 95 / 864 },
  floater_ship: { left: 185 / 1152, top: 98 / 864, width: 105 / 1152, height: 108 / 864 },
  floater_8: { left: 310 / 1152, top: 98 / 864, width: 55 / 1152, height: 75 / 864 },
  floater_plus: { left: 375 / 1152, top: 105 / 864, width: 45 / 1152, height: 65 / 864 },
  floater_2: { left: 435 / 1152, top: 103 / 864, width: 55 / 1152, height: 58 / 864 },
  floater_sentence: { left: 655 / 1152, top: 118 / 864, width: 285 / 1152, height: 52 / 864 },
}

const BUST_CROP = { left: 200 / 1152, top: 320 / 864, width: 752 / 1152, height: 540 / 864 }

const BUST_PNG = path.join(landingSrc, 'open_head_bust.png')
const BUST_WEBP = path.join(landingPublic, 'open_head_bust.webp')

function idx(width, x, y) {
  return (y * width + x) * 4
}

function nearWhite(data, i, threshold = 246) {
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  return r >= threshold && g >= threshold && b >= threshold
}

/** Flood-fill page white from edges; keep interior stipple whites opaque. */
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

function keyBorderWhiteOnly(data, width, height, margin = 4) {
  const out = Buffer.from(data)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = idx(width, x, y)
      const edge = x < margin || y < margin || x >= width - margin || y >= height - margin
      if (edge && nearWhite(out, i)) out[i + 3] = 0
    }
  }
  return out
}

async function rasterWithAlpha(inputBuffer, mode = 'flood') {
  const { data, info } = await sharp(inputBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const keyed = mode === 'border' ? keyBorderWhiteOnly(data, info.width, info.height) : keyOuterWhite(data, info.width, info.height)
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

async function ensureFloaters(master, meta) {
  const outDir = path.join(landingPublic, 'floaters')
  fs.mkdirSync(outDir, { recursive: true })

  for (const [id, region] of Object.entries(FLOATER_CROPS)) {
    const extract = toPixels(meta, region)
    const cropped = await sharp(master).extract(extract).toBuffer()
    const keyMode = id === 'floater_sentence' || id === 'floater_ship' ? 'border' : 'flood'
    const pngBuf = await (await rasterWithAlpha(cropped, keyMode)).png().toBuffer()
    const trimmed = await sharp(pngBuf).trim({ threshold: 6 }).png().toBuffer()
    const srcPng = path.join(landingSrc, `${id}.png`)
    const pubPng = path.join(outDir, `${id}.png`)
    const pubWebp = path.join(outDir, `${id}.webp`)
    fs.writeFileSync(srcPng, trimmed)
    fs.writeFileSync(pubPng, trimmed)
    await sharp(trimmed).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(pubWebp)
  }
}

/** Layered QA composite matching landing rest positions (not a baked bust). */
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
    { id: 'floater_sh', x: 0.1, y: 0.12, w: 0.11 },
    { id: 'floater_ship', x: 0.21, y: 0.11, w: 0.1 },
    { id: 'floater_8', x: 0.31, y: 0.1, w: 0.07 },
    { id: 'floater_plus', x: 0.37, y: 0.11, w: 0.05 },
    { id: 'floater_2', x: 0.43, y: 0.11, w: 0.07 },
    { id: 'floater_sentence', x: 0.58, y: 0.12, w: 0.19 },
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
  const drop = new Set([
    'open-head-bust.png',
    'open-head-bust.webp',
    'open-head-hero-qa.png',
    'open-head-hero-layered-qa.png',
    'cat.png',
    'cat.webp',
    'sh.png',
    'sh.webp',
    'ship.png',
    'ship.webp',
    'sum7.png',
    'sum7.webp',
    'sum8.png',
    'sum8.webp',
    'ten.png',
    'ten.webp',
    'the.png',
    'the.webp',
    'open-head-bust.png',
    'open-head-bust.webp',
    'floater-cat.png',
    'floater-sh.png',
    'floater-ship.png',
    'floater-sum7.png',
    'floater-sum8.png',
    'floater-ten.png',
    'floater-the.png',
    'open-head-bust.png',
  ])
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue
    for (const f of fs.readdirSync(dir)) {
      if (drop.has(f) || f.startsWith('floater-')) {
        fs.unlinkSync(path.join(dir, f))
      }
    }
  }
}

const { src, meta } = await loadMaster()
pruneLegacyAssets()
await ensureFloaters(src, meta)
await ensureBust(src, meta)
await writeLayeredQa()
console.log('landing-assets: done')