import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward client calls to /api/gemini to the local proxy running on 5174
      '/api/gemini': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        secure: false,
      },
      // (optional) forward other API endpoints to the same proxy
      '/api': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
