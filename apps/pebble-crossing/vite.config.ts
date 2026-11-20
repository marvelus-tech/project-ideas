import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages: https://marvelus-tech.github.io/pebble-crossing/
const pagesBase = process.env.GITHUB_ACTIONS ? '/pebble-crossing/' : '/pebble-crossing/'

export default defineConfig({
  plugins: [react()],
  base: pagesBase,
})