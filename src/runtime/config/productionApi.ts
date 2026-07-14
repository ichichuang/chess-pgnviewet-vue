type BrowserApiAccess = 'same-origin' | 'cross-origin-unconfirmed' | 'non-browser'

export interface ProductionApiRuntimeConfig {
  readonly chessApiBase: string
  readonly requestTimeoutMs: number
  readonly browserAccess: BrowserApiAccess
}

const CONFIRMED_CHESS_API_BASE = 'https://wxapi.kaisaile.org'
const DEFAULT_REQUEST_TIMEOUT_MS = 8_000

function browserAccess(base: string): BrowserApiAccess {
  if (typeof window === 'undefined') return 'non-browser'

  return new URL(base).origin === window.location.origin
    ? 'same-origin'
    : 'cross-origin-unconfirmed'
}

export const productionApiConfig: ProductionApiRuntimeConfig = Object.freeze({
  chessApiBase: CONFIRMED_CHESS_API_BASE,
  requestTimeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
  browserAccess: browserAccess(CONFIRMED_CHESS_API_BASE),
})
