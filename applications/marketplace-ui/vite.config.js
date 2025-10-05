import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Any request from our app starting with /geckoapi will be forwarded
      '/geckoapi': {
        target: 'https://api.coingecko.com/api', // Target now includes /api
        changeOrigin: true, // This is essential
        // This now correctly removes our proxy-specific path
        rewrite: (path) => path.replace(/^\/geckoapi/, ''), 
      },
    }
  }
})
