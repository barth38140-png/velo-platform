/* eslint-env node */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    // Keep allowed hosts minimal and configurable via environment.
    // When running inside Compose set DEV_ALLOW_DOCKER=true to accept the service name `frontend`.
    allowedHosts: process.env.DEV_ALLOW_DOCKER === 'true'
      ? ['frontend', 'localhost', '127.0.0.1']
      : ['localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        // Proxy API requests to the backend service inside Docker by default.
        // Use an absolute target only for proxying; the client should use a relative base (`/api`).
        target: process.env.VITE_PROXY_TARGET || 'http://backend:3010',
        changeOrigin: true,
        secure: false
      }
      ,
      '/socket.io': {
        target: process.env.VITE_PROXY_TARGET || 'http://backend:3010',
        ws: true,
        changeOrigin: true,
        secure: false
      }
    }
  }
})
