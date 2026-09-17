import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Build straight into the folder the C# server hands out.
    outDir: '../GeorgiPeev.Web/wwwroot',
    emptyOutDir: true,
  },

  server: {
    port: 5173,
    // During development you open 5173; server routes are forwarded to C#.
    // Plain HTTP on 5038, not HTTPS on 7194 — avoids the self-signed cert.
    proxy: {
      '/api': 'http://localhost:5038',
      '/healthz': 'http://localhost:5038',
      // Uploaded pictures, served by the C# server from disk during development.
      '/media': 'http://localhost:5038',
    },
  },
})