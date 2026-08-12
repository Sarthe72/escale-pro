import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  base: '/escale-pro/',
  server: {
    host: true,
    port: 5174,
    https: true,
  },
  plugins: [react(), tailwindcss(), basicSsl()],
})
