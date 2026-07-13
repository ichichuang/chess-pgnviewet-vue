export interface ProductionApiRuntimeConfig {
  readonly chessApiBase: string
  readonly mainApiBase: string
  readonly loginAppId: string
  readonly requestTimeoutMs: number
}

const DEFAULT_CHESS_API_BASE = '/api/ksl'
const DEFAULT_MAIN_API_BASE = 'https://manage.yoursclass.com'
const PUBLIC_LOGIN_APP_ID = 'wx670cc0af39c366e0'
const DEFAULT_REQUEST_TIMEOUT_MS = 8000

type ProductionEnvKey =
  'VITE_KSL_CHESS_API_BASE' | 'VITE_KSL_MAIN_API_BASE' | 'VITE_KSL_REQUEST_TIMEOUT_MS'

function envText(key: ProductionEnvKey): string {
  const env = import.meta.env as Partial<Record<ProductionEnvKey, string>>
  const value = env[key]
  return typeof value === 'string' ? value.trim() : ''
}

function hasUnsafeBaseCharacter(text: string): boolean {
  for (const character of text) {
    const code = character.charCodeAt(0)

    if (code <= 31 || character === '<' || character === '>' || character === '`') {
      return true
    }
  }

  return false
}

function sameOriginApiBase(value: string): string {
  if (!value.startsWith('/api/') || value.startsWith('//') || hasUnsafeBaseCharacter(value)) {
    return ''
  }

  return value.replace(/\/+$/u, '')
}

function productionApiBase(value: string, fallback: string): string {
  const candidate = value || fallback

  if (candidate.startsWith('/')) {
    return sameOriginApiBase(candidate) || fallback
  }

  try {
    const url = new URL(candidate)

    if (url.protocol !== 'https:') {
      return fallback
    }

    url.hash = ''
    url.search = ''
    url.pathname = url.pathname.replace(/\/+$/u, '')
    return url.toString().replace(/\/$/u, '')
  } catch {
    return fallback
  }
}

function requestTimeoutMs(value: string): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 3000 && parsed <= 30000
    ? parsed
    : DEFAULT_REQUEST_TIMEOUT_MS
}

export const productionApiConfig: ProductionApiRuntimeConfig = Object.freeze({
  chessApiBase: productionApiBase(envText('VITE_KSL_CHESS_API_BASE'), DEFAULT_CHESS_API_BASE),
  mainApiBase: productionApiBase(envText('VITE_KSL_MAIN_API_BASE'), DEFAULT_MAIN_API_BASE),
  loginAppId: PUBLIC_LOGIN_APP_ID,
  requestTimeoutMs: requestTimeoutMs(envText('VITE_KSL_REQUEST_TIMEOUT_MS')),
})
