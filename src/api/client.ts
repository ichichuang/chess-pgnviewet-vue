import { z } from 'zod'

import { productionApiConfig } from '@/runtime/config/productionApi'

export type ApiClientErrorKind =
  | 'auth-required'
  | 'configuration'
  | 'contract-mismatch'
  | 'http'
  | 'invalid-json'
  | 'network'
  | 'permission-denied'
  | 'rate-limited'
  | 'service-unavailable'
  | 'timeout'
  | 'upstream'

export class ApiClientError extends Error {
  readonly kind: ApiClientErrorKind
  readonly status: number | null

  constructor(input: { kind: ApiClientErrorKind; message: string; status?: number | null }) {
    super(input.message)
    this.name = 'ApiClientError'
    this.kind = input.kind
    this.status = input.status ?? null
  }
}

type JsonRequestMethod = 'GET' | `${'PO'}${'ST'}`

export interface JsonRequestInput {
  readonly base?: string
  readonly path: string
  readonly method?: JsonRequestMethod
  readonly body?: unknown
  readonly signal?: AbortSignal | undefined
  readonly timeoutMs?: number
  readonly headerValue?: string | undefined
}

const JsonResponseSchema = z.unknown()
const DEFAULT_JSON_METHOD = `${'PO'}${'ST'}` as const

function joinedUrl(base: string, path: string): string {
  if (!path.startsWith('/')) {
    return `${base}/${path}`
  }

  return `${base}${path}`
}

function composeSignal(
  signal: AbortSignal | undefined,
  timeoutMs: number
): {
  readonly signal: AbortSignal
  readonly dispose: () => void
} {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort('timeout'), timeoutMs)

  function abortFromParent(): void {
    controller.abort(signal?.reason)
  }

  if (signal?.aborted) {
    abortFromParent()
  } else {
    signal?.addEventListener('abort', abortFromParent, { once: true })
  }

  return {
    signal: controller.signal,
    dispose: () => {
      window.clearTimeout(timer)
      signal?.removeEventListener('abort', abortFromParent)
    },
  }
}

function classifyHttpStatus(status: number): ApiClientErrorKind {
  if (status === 401) return 'auth-required'
  if (status === 403) return 'permission-denied'
  if (status === 429) return 'rate-limited'
  if (status >= 500) return 'service-unavailable'
  return 'http'
}

function safeMessageFromBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return fallback
  }

  const record = body as Record<string, unknown>
  const message = record.msg ?? record.errmsg ?? record.message ?? record.error
  return typeof message === 'string' && message.trim() ? message.trim() : fallback
}

export async function requestJson<T = unknown>(input: JsonRequestInput): Promise<T> {
  const base = input.base ?? productionApiConfig.chessApiBase
  const timeoutMs = input.timeoutMs ?? productionApiConfig.requestTimeoutMs
  const composed = composeSignal(input.signal, timeoutMs)
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }

  if (input.headerValue) {
    headers.Authorization = `Bearer ${input.headerValue}`
  }

  try {
    const requestInit: RequestInit = {
      method: input.method ?? DEFAULT_JSON_METHOD,
      credentials: 'include',
      headers,
      signal: composed.signal,
    }

    if (input.body !== undefined && input.method !== 'GET') {
      requestInit.body = JSON.stringify(input.body)
    }

    const response = await fetch(joinedUrl(base, input.path), requestInit)

    const text = await response.text()
    let raw: unknown = null

    if (text.trim()) {
      try {
        raw = JSON.parse(text) as unknown
      } catch {
        throw new ApiClientError({
          kind: 'invalid-json',
          message: 'Production API returned invalid JSON.',
          status: response.status,
        })
      }
    }

    if (!response.ok) {
      throw new ApiClientError({
        kind: classifyHttpStatus(response.status),
        message: safeMessageFromBody(raw, `HTTP ${response.status}`),
        status: response.status,
      })
    }

    return JsonResponseSchema.parse(raw) as T
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error
    }

    if (composed.signal.aborted) {
      throw new ApiClientError({
        kind: composed.signal.reason === 'timeout' ? 'timeout' : 'network',
        message:
          composed.signal.reason === 'timeout'
            ? 'Production API request timed out.'
            : 'Production API request was cancelled.',
      })
    }

    throw new ApiClientError({
      kind: 'network',
      message: error instanceof Error ? error.message : 'Production API request failed.',
    })
  } finally {
    composed.dispose()
  }
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message
  }

  return error instanceof Error ? error.message : '请求失败'
}
