import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

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

async function raster(svg, width, height) {
  return sharp(Buffer.from(svg), { density: 144 })
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

for (const item of catalog) {
  const buffer = await raster(item.svg(), item.width, item.height)
  const file = resolve(outDir, item.file)
  writeFileSync(file, buffer)
  const bytes = statSync(file).size
  const alpha = await clearRatio(buffer)
  if (bytes > item.maxBytes) failures.push(`${item.file} is ${bytes} bytes, budget ${item.maxBytes}`)
  if (bytes > SINGLE_LIMIT) failures.push(`${item.file} exceeds the 250KB raster cap`)
  if (item.needsAlpha && alpha < 0.45) failures.push(`${item.file} is not a mostly transparent overlay (${alpha.toFixed(2)} clear)`)
  if (!item.needsAlpha && alpha > 0.05) failures.push(`${item.file} base plate is not opaque`)
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
  })
}

async function sheet(cells, columns, cell, fileName, spec) {
  const rows = Math.ceil(cells.length / columns)
  const width = cell.width * columns
  const height = cell.height * rows
  const layers = []
  for (let index = 0; index < cells.length; index += 1) {
    layers.push({
      input: await raster(cells[index], cell.width, cell.height),
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
  })
}

const pipCells = []
for (const scarf of SCARVES) {
  for (const pose of PIP_POSES) pipCells.push(pipCellSvg(pose, scarf))
}
await sheet(pipCells, PIP_POSES.length, PIP_CELL, 'pip_poses.webp', {
  id: 'pip_poses',
  worldFlag: 'pip',
  role: 'initial',
  maxBytes: SINGLE_LIMIT,
  alt: 'Pip the fox in working poses, with red, leaf, and stone scarves.',
})

await sheet(KIT_POSES.map((pose) => kitCellSvg(pose)), KIT_POSES.length, KIT_CELL, 'kit_poses.webp', {
  id: 'kit_poses',
  worldFlag: 'kit',
  role: 'lazy',
  maxBytes: SINGLE_LIMIT,
  alt: 'Kit the cat standing, sitting, and aboard the workboat.',
})

const initialBytes = assets.filter((asset) => asset.role === 'initial').reduce((sum, asset) => sum + asset.bytes, 0)
if (initialBytes > 1.5 * 1024 * 1024) failures.push(`initial visual payload is ${initialBytes} bytes, budget 1.5MB`)

const manifest = {
  frame: FRAME,
  compression: 'webp quality 85, metadata stripped',
  license: 'CC0-1.0',
  attribution: 'Original cut-paper artwork made for Pebble Crossing.',
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

const previous = readFileSync(manifestPath, 'utf8')
if (!previous.includes('"creek_base_morning"')) {
  console.error('manifest was not written')
  process.exit(1)
}
