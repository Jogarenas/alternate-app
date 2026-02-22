import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
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
