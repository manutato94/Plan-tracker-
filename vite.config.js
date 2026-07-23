import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// NOTA: si tu repo se llama distinto a "tracking-manuel",
// cambiá `base` por '/NOMBRE-DE-TU-REPO/'.
// Si usás un dominio propio o un repo tipo usuario.github.io, poné base: '/'.
export default defineConfig({
  plugins: [react()],
  base: '/tracking-manuel/',
})
