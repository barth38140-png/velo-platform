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
        // In dev we expect backend on port 3010 inside compose; when running locally adjust env.
        target: process.env.VITE_API_URL || 'http://localhost:3010',
        changeOrigin: true
      }
    }
  }
})
