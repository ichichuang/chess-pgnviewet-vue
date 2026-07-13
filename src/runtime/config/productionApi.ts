type BrowserApiAccess = 'same-origin' | 'cross-origin-unconfirmed' | 'non-browser'

export interface ProductionApiRuntimeConfig {
  readonly chessApiBase: string
  readonly loginAppId: string
  readonly requestTimeoutMs: number
  readonly browserAccess: BrowserApiAccess
  readonly configurationIssue: string
}

const CONFIRMED_CHESS_API_BASE = 'https://wxapi.kaisaile.org'
const PUBLIC_LOGIN_APP_ID = 'wx670cc0af39c366e0'
const DEFAULT_REQUEST_TIMEOUT_MS = 8_000

type ProductionEnvKey = 'VITE_KSL_CHESS_API_BASE' | 'VITE_KSL_REQUEST_TIMEOUT_MS'

function envText(key: ProductionEnvKey): string {
  const env = import.meta.env as Partial<Record<ProductionEnvKey, string>>
  const value = env[key]
  return typeof value === 'string' ? value.trim() : ''
}

function sourceConfirmedBase(value: string): {
  readonly base: string
  readonly issue: string
} {
  if (!value) {
    return { base: CONFIRMED_CHESS_API_BASE, issue: '' }
  }

  try {
    const candidate = new URL(value)
    const confirmed = new URL(CONFIRMED_CHESS_API_BASE)
    const hasUnexpectedParts =
      candidate.username !== '' ||
      candidate.password !== '' ||
      candidate.search !== '' ||
      candidate.hash !== '' ||
      !['', '/'].includes(candidate.pathname)

    if (
      candidate.protocol !== 'https:' ||
      candidate.origin !== confirmed.origin ||
      hasUnexpectedParts
    ) {
      return {
        base: CONFIRMED_CHESS_API_BASE,
        issue: 'The configured Web API base is not a source-confirmed production origin.',
      }
    }

    return { base: CONFIRMED_CHESS_API_BASE, issue: '' }
  } catch {
    return {
      base: CONFIRMED_CHESS_API_BASE,
      issue: 'The configured Web API base is not a valid HTTPS origin.',
    }
  }
}

function requestTimeoutMs(value: string): number {
  if (!value) return DEFAULT_REQUEST_TIMEOUT_MS

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 3_000 && parsed <= 30_000
    ? parsed
    : DEFAULT_REQUEST_TIMEOUT_MS
}

function browserAccess(base: string): BrowserApiAccess {
  if (typeof window === 'undefined') return 'non-browser'

  return new URL(base).origin === window.location.origin
    ? 'same-origin'
    : 'cross-origin-unconfirmed'
}

const configuredBase = sourceConfirmedBase(envText('VITE_KSL_CHESS_API_BASE'))

export const productionApiConfig: ProductionApiRuntimeConfig = Object.freeze({
  chessApiBase: configuredBase.base,
  loginAppId: PUBLIC_LOGIN_APP_ID,
  requestTimeoutMs: requestTimeoutMs(envText('VITE_KSL_REQUEST_TIMEOUT_MS')),
  browserAccess: browserAccess(configuredBase.base),
  configurationIssue: configuredBase.issue,
})
