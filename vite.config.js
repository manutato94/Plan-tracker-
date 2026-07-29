import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base relativo ('./') para que funcione tanto en Safari como en modo
// standalone (web app agregada a inicio en iOS). Con rutas absolutas,
// iOS a veces no resuelve los assets al abrir desde el ícono → pantalla negra.
export default defineConfig({
  plugins: [react()],
  base: './',
})
