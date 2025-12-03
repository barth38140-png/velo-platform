/* eslint-env node */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    // Keep allowed hosts minimal and configurable via environment.
    // DEV_ALLOW_DOCKER defaults to enabled so Compose service names are accepted unless explicitly disabled.
    allowedHosts: process.env.DEV_ALLOW_DOCKER === 'false'
      ? ['localhost', '127.0.0.1']
      : ['frontend', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        // Proxy API requests to the backend service inside Docker by default.
        // Use an absolute target only for proxying; the client should use a relative base (`/api`).
        // Default to local backend on port 5000 when not running inside Docker.
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false
      }
      ,
      '/socket.io': {
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:5000',
        ws: true,
        changeOrigin: true,
        secure: false
      }
    }
  }
})
