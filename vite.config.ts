import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const DEVELOPMENT_PROXY_PREFIX = '/__kaisaile_web'
const PRODUCTION_CHESS_API_BASE = 'https://wxapi.kaisaile.org'
const DEVELOPMENT_PROXY_PATHS = new Set([
  '/liveproxy/PostLoginByPhone',
  '/ucenter/GetUserDetail',
  '/ucenter/GetUserCenterInfo',
  '/liveproxy/GetActList',
  '/award/c-GetActDetail',
  '/liveproxy/GetActGroups',
  '/award/c-GetMatchRoundlist',
  '/award/c-GetMatchPairlist',
])

function isAllowedDevelopmentProxyRequest(method: string | undefined, requestUrl: string): boolean {
  if (method !== 'POST') return false

  const parsed = new URL(requestUrl, 'http://localhost')
  const pathname = parsed.pathname.slice(DEVELOPMENT_PROXY_PREFIX.length) || '/'

  if (!DEVELOPMENT_PROXY_PATHS.has(pathname)) return false

  if (pathname === '/award/c-GetActDetail') {
    return (
      parsed.searchParams.size === 2 &&
      parsed.searchParams.get('token') === '' &&
      parsed.searchParams.get('type') === '10'
    )
  }

  return parsed.search === ''
}

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
    strictPort: false,
    proxy: {
      [DEVELOPMENT_PROXY_PREFIX]: {
        target: PRODUCTION_CHESS_API_BASE,
        changeOrigin: true,
        secure: true,
        bypass(request, response) {
          if (isAllowedDevelopmentProxyRequest(request.method, request.url ?? '/')) return

          response.statusCode = 404
          response.end()
          return false
        },
        rewrite: (path) => path.slice(DEVELOPMENT_PROXY_PREFIX.length) || '/',
      },
    },
  },
})
