/**
 * Screenshot `.open-head-hero` from the built landing page.
 * Usage: node scripts/capture-landing-hero.mjs [outputPath]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const root = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.join(root, '..')
const distIndex = path.join(appRoot, 'dist', 'index.html')
const out =
  process.argv[2] ??
  process.env.PEBBLE_HERO_LAYERED_QA_OUT ??
  '/cursor/stores/bc-01a1f637-9e15-7c7b-8486-c4aaa7a85d00/media/open-head-hero-layered.png'

if (!fs.existsSync(distIndex)) {
  console.error('capture-landing-hero: run vite build first')
  process.exit(1)
}

const port = 4173
const base = process.env.VITE_PAGES_BASE ?? '/project-ideas/revedu/'
const preview = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  cwd: appRoot,
  stdio: 'ignore',
  env: { ...process.env, VITE_PAGES_BASE: base },
})

await new Promise((resolve) => setTimeout(resolve, 1200))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 900, height: 1200 } })
const url = `http://127.0.0.1:${port}${base}`
await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
await page.waitForSelector('.open-head-hero', { timeout: 15_000 })
await page.waitForTimeout(2000)
const hero = page.locator('.open-head-hero')
await hero.screenshot({ path: out, type: 'png' })
await browser.close()
preview.kill('SIGTERM')
console.log(`capture-landing-hero: wrote ${out}`)