import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Standalone repo: https://marvelus-tech.github.io/pebble-crossing/
// Monorepo (project-ideas): https://marvelus-tech.github.io/project-ideas/pebble-crossing/
const pagesBase = process.env.VITE_PAGES_BASE ?? '/pebble-crossing/'

export default defineConfig({
  plugins: [react()],
  base: pagesBase,
})