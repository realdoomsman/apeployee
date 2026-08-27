import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// /api and /nft are proxied to the backend so the app is same-origin in dev:
// no CORS, and the session cookie just works.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/nft': 'http://localhost:3001',
    },
  },
})
