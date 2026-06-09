import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: './',
  server: {
    proxy: {
      '/winners': 'http://localhost:3000',
      '/stream': 'http://localhost:3000',
      '/matchdata': 'http://localhost:3000',
      '/matchdata/stream': 'http://localhost:3000',
    },
  },
  build: mode === 'extension' ? {
    rolldownOptions: {
      input: 'src/content/main.tsx',
      output: { entryFileNames: 'content.js' },
      inlineDynamicImports: true,
    }
  } : {},
}))
