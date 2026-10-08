import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: { host: true },
  // o chunk 3D (three + drei) é grande, mas só carrega sob demanda
  build: { chunkSizeWarningLimit: 1100 },
})
