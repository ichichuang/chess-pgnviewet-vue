import { ApiClientError } from '@/api/client'

export type ResourceErrorKind = 'authentication' | 'error' | 'permission' | 'unavailable'

export interface ResourceError {
  readonly kind: ResourceErrorKind
  readonly text: string
  readonly retryable: boolean
}

export function resourceError(error: unknown): ResourceError | null {
  if (!error) return null

  if (error instanceof ApiClientError) {
    if (error.kind === 'cancelled') return null
    if (error.kind === 'auth-required') {
      return { kind: 'authentication', text: error.message, retryable: false }
    }
    if (error.kind === 'permission-denied') {
      return { kind: 'permission', text: error.message, retryable: false }
    }
    if (error.kind === 'configuration' || error.kind === 'service-unavailable') {
      return { kind: 'unavailable', text: error.message, retryable: error.retryable }
    }

    return { kind: 'error', text: error.message, retryable: error.retryable }
  }

  return {
    kind: 'error',
    text: error instanceof Error ? error.message : '请求失败',
    retryable: false,
  }
}
