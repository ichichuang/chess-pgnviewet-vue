export interface ProductionApiRuntimeConfig {
  readonly productionChessApiBase: string
  readonly chessApiBase: string
  readonly requestTimeoutMs: number
}

const CONFIRMED_CHESS_API_BASE = 'https://wxapi.kaisaile.org'
const DEVELOPMENT_PROXY_BASE = '/__kaisaile_web'
const DEFAULT_REQUEST_TIMEOUT_MS = 8_000

export const productionApiConfig: ProductionApiRuntimeConfig = Object.freeze({
  productionChessApiBase: CONFIRMED_CHESS_API_BASE,
  chessApiBase: import.meta.env.DEV ? DEVELOPMENT_PROXY_BASE : CONFIRMED_CHESS_API_BASE,
  requestTimeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
})
