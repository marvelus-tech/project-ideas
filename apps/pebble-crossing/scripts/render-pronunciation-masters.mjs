import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

import { PRONUNCIATION_MASTERS } from './pronunciation-art.mjs'
import { keyMagenta, trimPng } from './raster-art.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'src/assets/world/source/pronunciation')

mkdirSync(outDir, { recursive: true })

for (const { id, svg } of PRONUNCIATION_MASTERS) {
  const keyed = await keyMagenta(
    await sharp(Buffer.from(svg()), { density: 144 }).png().toBuffer(),
  )
  const trimmed = await trimPng(keyed)
  writeFileSync(resolve(outDir, `${id}.png`), trimmed)
  console.log(`wrote ${id}.png`)
}