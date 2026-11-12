import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'https://project-be-fe-clsv.onrender.com',
      '/uploads': 'https://project-be-fe-clsv.onrender.com',
    },
  },
})
