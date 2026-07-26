import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` debe coincidir con el nombre del repo en GitHub.
// Repo actual: Plan-tracker-
export default defineConfig({
  plugins: [react()],
  base: '/Plan-tracker-/',
})
