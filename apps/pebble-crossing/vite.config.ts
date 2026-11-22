import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Standalone repo: https://marvelus-tech.github.io/revedu/
// Monorepo (project-ideas): https://marvelus-tech.github.io/project-ideas/revedu/
const pagesBase = process.env.VITE_PAGES_BASE ?? '/revedu/'

export default defineConfig({
  plugins: [react()],
  base: pagesBase,
})