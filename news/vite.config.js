import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // On Vercel, app is served from root ('/'). On GitHub Pages CI, it is '/News_Application/'. Default: relative './'.
  base: process.env.VERCEL ? '/' : (process.env.VITE_BASE_PATH || './'),
  test: {
    globals: true,
    environment: 'node',
  },
})
