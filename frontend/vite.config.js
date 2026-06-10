import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy /api and /ws to the Global Market backend on port 8001.
      // Port 8000 is occupied by another application on this machine.
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        // Log proxy activity to help debug 404s
        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            console.error('[PROXY ERROR]', req.url, err.message)
          })
          proxy.on('proxyReq', (_, req) => {
            console.log('[PROXY]', req.method, req.url, '-> http://localhost:8001' + req.url)
          })
          proxy.on('proxyRes', (res, req) => {
            if (res.statusCode >= 400) {
              console.warn('[PROXY]', res.statusCode, req.url)
            }
          })
        }
      },
      '/ws': {
        target: 'ws://localhost:8001',
        ws: true
      }
    }
  }
})
