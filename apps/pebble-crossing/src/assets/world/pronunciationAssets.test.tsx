import { existsSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { MouthTrayArt } from '../../components/PronunciationTrayArt'
import manifest from './manifest.json'
import { pronunciationArt, pronunciationArtUrl, trayAssetIds, trayBundleBytes } from './pronunciationAssets'

const publicRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../public')
const sourceDir = resolve(dirname(fileURLToPath(import.meta.url)), 'source/pronunciation')

describe('pronunciation tray assets', () => {
  it('lists illustrated tray entries in the manifest under budget', () => {
    const tray = manifest.assets.filter((asset) => asset.role === 'tray')
    expect(tray.length).toBeGreaterThanOrEqual(5)
    expect(trayBundleBytes()).toBeLessThanOrEqual(200 * 1024)
    for (const asset of tray) {
      expect(asset.source).toBe('illustrated-png')
      const file = resolve(publicRoot, asset.path)
      expect(existsSync(file)).toBe(true)
      const bytes = statSync(file).size
      expect(bytes).toBe(asset.bytes)
      expect(bytes).toBeLessThanOrEqual(80 * 1024)
    }
  })

  it('keeps PNG masters on disk for every tray id', () => {
    for (const id of trayAssetIds()) {
      expect(existsSync(resolve(sourceDir, `${id}.png`))).toBe(true)
    }
  })

  it('renders mouth preview markup with sh_model art', () => {
    const html = renderToStaticMarkup(<MouthTrayArt mouthStep={0} />)
    expect(html).toContain('data-cue="sh_model"')
    expect(html).toContain('sh_model')
    expect(html).toMatch(/<img[^>]+alt="[^"]+"/)
    const art = pronunciationArt('sh_model')
    expect(pronunciationArtUrl('sh_model')).toContain('sh_model.webp')
    expect(art.alt.length).toBeGreaterThan(10)
  })
})