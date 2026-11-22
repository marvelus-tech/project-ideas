#!/usr/bin/env node
/**
 * GitHub Pages serves static files only. Copy the SPA shell into deep routes
 * so direct GETs to /revedu/pebble-crossing/ boot React Router.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const index = join(dist, 'index.html')
const html = readFileSync(index, 'utf8')

const gameDir = join(dist, 'pebble-crossing')
mkdirSync(gameDir, { recursive: true })
writeFileSync(join(gameDir, 'index.html'), html)

const playDir = join(dist, 'play')
mkdirSync(playDir, { recursive: true })
writeFileSync(
  join(playDir, 'index.html'),
  `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Pebble Crossing</title>
    <script>location.replace('../pebble-crossing/' + location.search + location.hash)</script>
  </head>
  <body></body>
</html>
`,
)