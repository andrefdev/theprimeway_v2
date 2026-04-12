import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: __dirname,
  base: '/overlay/',
  build: {
    outDir: path.resolve(__dirname, '../dist/overlay'),
    emptyOutDir: true,
  },
  server: {
    port: 5174,
  },
  resolve: {
    tsconfigPaths: true,
  },
})
