import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allow access from network
    port: 5173,
    strictPort: true, // Use exact port
  },
  preview: {
    host: true, // Allow all hosts
    port: 8080,
    strictPort: false
  }
})
