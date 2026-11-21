import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

import {
  compositeScarf,
  placeOnGround,
  sharedScale,
  trimPng,
} from './raster-art.mjs'
import {
  FRAME,
  KIT_CELL,
  KIT_POSES,
  PIP_CELL,
  PIP_POSES,
  SCARVES,
  creekBaseSvg,
  fishHelpedSvg,
  kitCellSvg,
  mapUnfurledSvg,
  pipCellSvg,
  ropeSvg,
  shellLiftedSvg,
  shipDockedSvg,
  shopOpenSvg,
} from './world-art.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'public/world')
const manifestPath = resolve(root, 'src/assets/world/manifest.json')
const sceneDir = resolve(root, 'src/assets/world/source/scene')
const pipDir = resolve(root, 'src/assets/world/source/pip')
const kitDir = resolve(root, 'src/assets/world/source/kit')
const QUALITY = 85
const INITIAL_LIMIT = 250 * 1024
const SINGLE_LIMIT = 250 * 1024

const catalog = [
  { id: 'creek_base_morning', file: 'creek_base_morning.webp', worldFlag: 'base', role: 'initial', alt: 'Morning creek worksite. The cedar shop is on the left bank and the center span is still open.', width: FRAME.width, height: FRAME.height, maxBytes: INITIAL_LIMIT, needsAlpha: false, svg: creekBaseSvg },
  { id: 'shop_open', file: 'shop_open.webp', worldFlag: 'shop:open', role: 'lazy', alt: 'The creek shop is open and the bolt tray is out.', width: FRAME.width, height: FRAME.height, maxBytes: SINGLE_LIMIT, needsAlpha: true, svg: shopOpenSvg },
  { id: 'ship_docked', file: 'ship_docked.webp', worldFlag: 'ship:docked', role: 'lazy', alt: "Kit's workboat is tied at the landing.", width: FRAME.width, height: FRAME.height, maxBytes: SINGLE_LIMIT, needsAlpha: true, svg: shipDockedSvg },
  { id: 'shell_lifted', file: 'shell_lifted.webp', worldFlag: 'shell:lifted', role: 'lazy', alt: 'A shell sits up on the bank.', width: FRAME.width, height: FRAME.height, maxBytes: SINGLE_LIMIT, needsAlpha: true, svg: shellLiftedSvg },
  { id: 'fish_helped', file: 'fish_helped.webp', worldFlag: 'fish:helped', role: 'lazy', alt: 'A fish is in the creek by the span.', width: FRAME.width, height: FRAME.height, maxBytes: SINGLE_LIMIT, needsAlpha: true, svg: fishHelpedSvg },
  { id: 'map_unfurled', file: 'map_unfurled.webp', worldFlag: 'map:open', role: 'lazy', alt: "Kit's map is open on the bank.", width: FRAME.width, height: FRAME.height, maxBytes: SINGLE_LIMIT, needsAlpha: true, svg: mapUnfurledSvg },
  { id: 'rope_shore', file: 'rope_shore.webp', worldFlag: 'rope:shore', role: 'lazy', alt: 'The mooring rope has come back to shore.', width: FRAME.width, height: FRAME.height, maxBytes: SINGLE_LIMIT, needsAlpha: true, svg: () => ropeSvg(false) },
  { id: 'rope_tight', file: 'rope_tight.webp', worldFlag: 'rope:tight', role: 'lazy', alt: 'The mooring rope is pulled tight.', width: FRAME.width, height: FRAME.height, maxBytes: SINGLE_LIMIT, needsAlpha: true, svg: () => ropeSvg(true) },
]

mkdirSync(outDir, { recursive: true })
mkdirSync(dirname(manifestPath), { recursive: true })

function scenePng(id) {
  const file = resolve(sceneDir, `${id}.png`)
  return existsSync(file) ? file : null
}

function pipMastersReady() {
  return PIP_POSES.every((pose) => existsSync(resolve(pipDir, `${pose}.png`)))
    && SCARVES.every((scarf) => existsSync(resolve(pipDir, `scarf-${scarf}.png`)))
}

async function rasterSvg(svg, width, height) {
  return sharp(Buffer.from(svg), { density: 144 })
    .resize(width, height, { fit: 'fill' })
    .webp({ quality: QUALITY, alphaQuality: 100, effort: 4 })
    .toBuffer()
}

async function rasterPng(file, width, height) {
  return sharp(file)
    .resize(width, height, { fit: 'fill' })
    .webp({ quality: QUALITY, alphaQuality: 100, effort: 4 })
    .toBuffer()
}

async function clearRatio(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let clear = 0
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 16) clear += 1
  }
  return clear / (info.width * info.height)
}

const failures = []
const assets = []
let usedPngMasters = false

async function publish(buffer, item, extra = {}) {
  const file = resolve(outDir, item.file)
  writeFileSync(file, buffer)
  const bytes = statSync(file).size
  const alpha = await clearRatio(buffer)
  if (bytes > item.maxBytes) failures.push(`${item.file} is ${bytes} bytes, budget ${item.maxBytes}`)
  if (bytes > SINGLE_LIMIT) failures.push(`${item.file} exceeds the 250KB raster cap`)
  if (item.needsAlpha && alpha < 0.45) failures.push(`${item.file} is not a mostly transparent overlay (${alpha.toFixed(2)} clear)`)
  if (item.needsAlpha === false && alpha > 0.05) failures.push(`${item.file} base plate is not opaque`)
  assets.push({
    id: item.id,
    path: `world/${item.file}`,
    worldFlag: item.worldFlag,
    role: item.role,
    width: item.width,
    height: item.height,
    bytes,
    maxBytes: item.maxBytes,
    alt: item.alt,
    ...extra,
  })
}

for (const item of catalog) {
  const png = scenePng(item.id)
  const buffer = png ? await rasterPng(png, item.width, item.height) : await rasterSvg(item.svg(), item.width, item.height)
  if (png) usedPngMasters = true
  await publish(buffer, item)
}

async function sheetFromPng(cells, columns, cell, fileName, spec) {
  const rows = Math.ceil(cells.length / columns)
  const width = cell.width * columns
  const height = cell.height * rows
  const layers = []
  for (let index = 0; index < cells.length; index += 1) {
    layers.push({
      input: await sharp(cells[index]).resize(cell.width, cell.height, { fit: 'fill' }).png().toBuffer(),
      left: (index % columns) * cell.width,
      top: Math.floor(index / columns) * cell.height,
    })
  }
  const buffer = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite(layers).webp({ quality: QUALITY, alphaQuality: 100, effort: 4 }).toBuffer()
  const file = resolve(outDir, fileName)
  writeFileSync(file, buffer)
  const bytes = statSync(file).size
  const alpha = await clearRatio(buffer)
  if (bytes > spec.maxBytes) failures.push(`${fileName} is ${bytes} bytes, budget ${spec.maxBytes}`)
  if (bytes > SINGLE_LIMIT) failures.push(`${fileName} exceeds the 250KB raster cap`)
  if (alpha < 0.2) failures.push(`${fileName} sprite sheet lost its alpha`)
  assets.push({
    id: spec.id,
    path: `world/${fileName}`,
    worldFlag: spec.worldFlag,
    role: spec.role,
    width,
    height,
    columns,
    rows,
    bytes,
    maxBytes: spec.maxBytes,
    alt: spec.alt,
    source: spec.source,
  })
}

async function sheetFromSvg(cells, columns, cell, fileName, spec) {
  const pngs = []
  for (const svg of cells) pngs.push(await rasterSvg(svg, cell.width, cell.height))
  await sheetFromPng(pngs, columns, cell, fileName, spec)
}

async function illustratedCells(dir, names, master) {
  const trimmed = []
  for (const name of names) trimmed.push(await trimPng(await sharp(resolve(dir, `${name}.png`)).png().toBuffer()))
  const metas = []
  for (const png of trimmed) metas.push(await sharp(png).metadata())
  const scale = sharedScale(metas, master)
  const placed = []
  for (const png of trimmed) placed.push(await placeOnGround(png, scale, master))
  return placed
}

if (pipMastersReady()) {
  usedPngMasters = true
  const bodies = await illustratedCells(pipDir, PIP_POSES, { width: 400, height: 460, ground: 440, maxW: 370, maxH: 420 })
  const bodyByPose = Object.fromEntries(PIP_POSES.map((pose, index) => [pose, bodies[index]]))
  const scarves = {}
  for (const scarf of SCARVES) scarves[scarf] = await trimPng(await sharp(resolve(pipDir, `scarf-${scarf}.png`)).png().toBuffer())
  const cells = []
  for (const scarf of SCARVES) {
    for (const pose of PIP_POSES) {
      const { cell, box } = bodyByPose[pose]
      cells.push(await compositeScarf(cell, scarves[scarf], pose, box))
    }
  }
  await sheetFromPng(cells, PIP_POSES.length, PIP_CELL, 'pip_poses.webp', {
    id: 'pip_poses',
    worldFlag: 'pip',
    role: 'initial',
    maxBytes: SINGLE_LIMIT,
    source: 'png-masters',
    alt: 'Pip the fox in working poses, with red, leaf, and stone scarves.',
  })
} else {
  const pipCells = []
  for (const scarf of SCARVES) {
    for (const pose of PIP_POSES) pipCells.push(pipCellSvg(pose, scarf))
  }
  await sheetFromSvg(pipCells, PIP_POSES.length, PIP_CELL, 'pip_poses.webp', {
    id: 'pip_poses',
    worldFlag: 'pip',
    role: 'initial',
    maxBytes: SINGLE_LIMIT,
    source: 'svg-fallback',
    alt: 'Pip the fox in working poses, with red, leaf, and stone scarves.',
  })
}

const kitReady = KIT_POSES.every((pose) => existsSync(resolve(kitDir, `${pose}.png`)))
if (kitReady) {
  usedPngMasters = true
  const placed = await illustratedCells(kitDir, KIT_POSES, { width: 400, height: 440, ground: 420, maxW: 360, maxH: 400 })
  await sheetFromPng(placed.map((item) => item.cell), KIT_POSES.length, KIT_CELL, 'kit_poses.webp', {
    id: 'kit_poses',
    worldFlag: 'kit',
    role: 'lazy',
    maxBytes: SINGLE_LIMIT,
    source: 'png-masters',
    alt: 'Kit the cat standing, sitting, and aboard the workboat.',
  })
} else {
  await sheetFromSvg(KIT_POSES.map((pose) => kitCellSvg(pose)), KIT_POSES.length, KIT_CELL, 'kit_poses.webp', {
    id: 'kit_poses',
    worldFlag: 'kit',
    role: 'lazy',
    maxBytes: SINGLE_LIMIT,
    source: 'svg-fallback',
    alt: 'Kit the cat standing, sitting, and aboard the workboat.',
  })
}

const initialBytes = assets.filter((asset) => asset.role === 'initial').reduce((sum, asset) => sum + asset.bytes, 0)
if (initialBytes > 1.5 * 1024 * 1024) failures.push(`initial visual payload is ${initialBytes} bytes, budget 1.5MB`)

const manifest = {
  frame: FRAME,
  compression: 'webp quality 85, metadata stripped',
  license: 'CC0-1.0',
  attribution: 'Original illustrated artwork made for Pebble Crossing.',
  generator: usedPngMasters
    ? 'Illustrated PNG masters. Pip bodies and scarf overlays are composed by scripts/optimize-world-assets.mjs. WebP quality 85, metadata stripped.'
    : 'Cut-paper SVG rasterized by scripts/optimize-world-assets.mjs.',
  assets,
}
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

for (const asset of assets) {
  console.log(`${asset.path} ${(asset.bytes / 1024).toFixed(1)}KB`)
}
