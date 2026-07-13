import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/pgnViewer/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    proxy: {
      '/api/ksl': {
        target: 'https://wxapi.kaisaile.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/ksl(?=\/|$)/u, ''),
      },
    },
    strictPort: false,
  },
})
