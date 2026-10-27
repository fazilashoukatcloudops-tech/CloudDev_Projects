import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiProxy = {
  '/api': {
    target: 'http://localhost:4000',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: apiProxy },
  // `npm run preview` (production build local test) par bhi relative /api kaam kare
  preview: { port: 4173, proxy: apiProxy },
  build: {
    // Three.js chunk bada hota hai lekin HeroScene lazy-loaded hai, is liye
    // landing/dashboard ke initial load par asar nahi. Optimization Day 26 par.
    chunkSizeWarningLimit: 1100,
  },
})
