import { readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import manifest from './manifest.json'

const worldDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../public/world')

describe('world asset budget', () => {
  it('keeps the morning base and every other raster inside the 250KB cap', () => {
    let initial = 0
    for (const asset of manifest.assets) {
      const bytes = statSync(resolve(worldDir, asset.path.replace(/^world\//, ''))).size
      expect(bytes).toBe(asset.bytes)
      expect(bytes).toBeLessThanOrEqual(250 * 1024)
      expect(asset.maxBytes).toBeLessThanOrEqual(250 * 1024)
      if (asset.role === 'initial') initial += bytes
    }
    expect(initial).toBeLessThan(1.5 * 1024 * 1024)
    const base = manifest.assets.find((asset) => asset.id === 'creek_base_morning')
    expect(base?.worldFlag).toBe('base')
    expect(base?.bytes).toBeLessThanOrEqual(250 * 1024)
    expect(readFileSync(resolve(worldDir, 'creek_base_morning.webp')).byteLength).toBe(base?.bytes)
  })
})
