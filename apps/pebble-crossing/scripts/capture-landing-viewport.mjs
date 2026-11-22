/**
 * Screenshot above-the-fold landing viewport (hero + seven floaters).
 * Usage: node scripts/capture-landing-viewport.mjs [outputPath] [width] [height]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const root = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.join(root, '..')
const distIndex = path.join(appRoot, 'dist', 'index.html')

const argv = process.argv.slice(2)
const out =
  argv[0] ??
  process.env.REVEDU_HERO_VIEWPORT_OUT ??
  '/cursor/stores/bc-01a1f637-9e15-7c7b-8486-c4aaa7a85d00/media/revedu-hero-seven-floaters.png'
const viewportWidth = Number(argv[1]) || 900
const viewportHeight = Number(argv[2]) || 1200

if (!fs.existsSync(distIndex)) {
  console.error('capture-landing-viewport: run vite build first')
  process.exit(1)
}

const port = 4175
const base = process.env.VITE_PAGES_BASE ?? '/project-ideas/revedu/'
const preview = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  cwd: appRoot,
  stdio: 'ignore',
  env: { ...process.env, VITE_PAGES_BASE: base },
})

await new Promise((resolve) => setTimeout(resolve, 1200))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: viewportWidth, height: viewportHeight } })
const url = `http://127.0.0.1:${port}${base}`
await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
await page.waitForSelector('.open-head-hero', { timeout: 15_000 })
await page.waitForTimeout(2200)
fs.mkdirSync(path.dirname(out), { recursive: true })
await page.screenshot({ path: out, type: 'png' })
await browser.close()
preview.kill('SIGTERM')
console.log(`capture-landing-viewport: wrote ${out} (${viewportWidth}x${viewportHeight})`)