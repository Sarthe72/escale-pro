import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  build: { rolldownOptions: { input: { main: 'index.html', visiteur: 'visiteur.html' } } },
  base: process.env.ORDERS_LOCAL === 'true' ? '/' : '/escale-pro/',
  server: {
    host: process.env.ORDERS_LOCAL === 'true' ? '127.0.0.1' : true,
    port: 5174,
    https: process.env.ORDERS_LOCAL !== 'true',
  },
  plugins: [react(), tailwindcss(), ...(process.env.ORDERS_LOCAL === 'true' ? [] : [basicSsl()])],
})
