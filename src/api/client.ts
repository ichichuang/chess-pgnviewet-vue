import axios, { type AxiosRequestConfig } from 'axios'
import { z } from 'zod'

import { productionApiConfig } from '@/runtime/config/productionApi'

export type ApiClientErrorKind =
  | 'auth-required'
  | 'cancelled'
  | 'configuration'
  | 'contract-mismatch'
  | 'http'
  | 'invalid-input'
  | 'invalid-json'
  | 'network'
  | 'permission-denied'
  | 'rate-limited'
  | 'service-unavailable'
  | 'timeout'
  | 'upstream'

const RETRYABLE_ERROR_KINDS = new Set<ApiClientErrorKind>([
  'network',
  'rate-limited',
  'service-unavailable',
  'timeout',
  'upstream',
])

export class ApiClientError extends Error {
  readonly kind: ApiClientErrorKind
  readonly status: number | null
  readonly retryable: boolean

  constructor(input: {
    kind: ApiClientErrorKind
    message: string
    status?: number | null
    retryable?: boolean
  }) {
    super(input.message)
    this.name = 'ApiClientError'
    this.kind = input.kind
    this.status = input.status ?? null
    this.retryable = input.retryable ?? RETRYABLE_ERROR_KINDS.has(input.kind)
  }
}

type JsonRequestMethod = 'GET' | 'POST'

export interface JsonRequestInput {
  readonly path: string
  readonly method?: JsonRequestMethod
  readonly body?: unknown
  readonly signal?: AbortSignal | undefined
  readonly timeoutMs?: number
}

const JsonResponseSchema = z.unknown()
const DEFAULT_JSON_METHOD = 'POST'
const SENSITIVE_MESSAGE_PATTERN =
  /authorization|bearer|cookie|password|secret|stack|(?:^|[^a-z])token(?:[^a-z]|$)/iu

function configurationError(message: string): ApiClientError {
  return new ApiClientError({ kind: 'configuration', message })
}

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0)
    if (code <= 31 || code === 127) return true
  }

  return false
}

function withoutControlCharacters(value: string): string {
  let output = ''

  for (const character of value) {
    const code = character.charCodeAt(0)
    output += code <= 31 || code === 127 ? ' ' : character
  }

  return output
}

function normalizedRelativePath(path: string): string {
  const candidate = path.trim()

  if (
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    hasControlCharacter(candidate)
  ) {
    throw configurationError('Web API request path is not a safe relative path.')
  }

  const pathname = candidate.split(/[?#]/u, 1)[0] ?? ''
  let decodedPathname: string

  try {
    decodedPathname = decodeURIComponent(pathname)
  } catch {
    throw configurationError('Web API request path contains invalid encoding.')
  }

  if (
    decodedPathname.startsWith('//') ||
    decodedPathname.includes('\\') ||
    decodedPathname.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    throw configurationError('Web API request path contains an unsafe URL segment.')
  }

  return candidate
}

function validatedBase(base: string | undefined): string {
  if (base !== productionApiConfig.chessApiBase) {
    throw configurationError('Dynamic Web API request bases are not allowed.')
  }

  return productionApiConfig.chessApiBase
}

function validatedTimeout(timeoutMs: number | undefined): number {
  const candidate = timeoutMs ?? productionApiConfig.requestTimeoutMs

  if (!Number.isInteger(candidate) || candidate < 1 || candidate > 30_000) {
    throw configurationError('Web API request timeout is invalid.')
  }

  return candidate
}

function assertBrowserTransportAvailable(): void {
  if (productionApiConfig.configurationIssue) {
    throw configurationError(productionApiConfig.configurationIssue)
  }

  if (productionApiConfig.browserAccess === 'cross-origin-unconfirmed') {
    throw new ApiClientError({
      kind: 'service-unavailable',
      message: '当前部署未获得已验证 Web API 的跨域访问权限。',
      retryable: false,
    })
  }
}

function classifyHttpStatus(status: number): ApiClientErrorKind {
  if (status === 401) return 'auth-required'
  if (status === 403) return 'permission-denied'
  if (status === 429) return 'rate-limited'
  if (status === 502 || status === 504) return 'upstream'
  if (status >= 500) return 'service-unavailable'
  return 'http'
}

function messageFromBody(body: unknown): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return ''

  const record = body as Record<string, unknown>
  const message = record.msg ?? record.errmsg ?? record.message ?? record.error
  return typeof message === 'string' ? message : ''
}

function sanitizedMessage(body: unknown, fallback: string): string {
  const candidate = withoutControlCharacters(messageFromBody(body)).trim()

  if (!candidate || candidate.length > 240 || SENSITIVE_MESSAGE_PATTERN.test(candidate)) {
    return fallback
  }

  return candidate
}

function httpFallback(kind: ApiClientErrorKind, status: number): string {
  if (kind === 'auth-required') return 'Authentication is required.'
  if (kind === 'permission-denied') return 'Permission was denied.'
  if (kind === 'rate-limited') return 'Too many requests. Please try again later.'
  if (kind === 'service-unavailable') return 'Web API is unavailable.'
  if (kind === 'upstream') return 'Web API upstream failed.'
  return `HTTP ${status}`
}

function toApiClientError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error

  if (!axios.isAxiosError(error)) {
    return new ApiClientError({ kind: 'network', message: 'Web API request failed.' })
  }

  if (error.code === 'ERR_CANCELED') {
    return new ApiClientError({ kind: 'cancelled', message: 'Web API request was cancelled.' })
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiClientError({ kind: 'timeout', message: 'Web API request timed out.' })
  }

  const status = error.response?.status

  if (typeof status === 'number') {
    const kind = classifyHttpStatus(status)
    return new ApiClientError({
      kind,
      message: sanitizedMessage(error.response?.data, httpFallback(kind, status)),
      status,
    })
  }

  if (error.code === 'ERR_BAD_RESPONSE') {
    return new ApiClientError({
      kind: 'invalid-json',
      message: 'Web API returned malformed JSON.',
    })
  }

  if (
    error.code === 'ERR_BAD_OPTION' ||
    error.code === 'ERR_BAD_OPTION_VALUE' ||
    error.code === 'ERR_INVALID_URL'
  ) {
    return configurationError('Web API request configuration is invalid.')
  }

  return new ApiClientError({ kind: 'network', message: 'Web API network request failed.' })
}

const httpClient = axios.create({
  adapter: 'xhr',
  allowAbsoluteUrls: false,
  baseURL: productionApiConfig.chessApiBase,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  responseType: 'json',
  timeout: productionApiConfig.requestTimeoutMs,
  transitional: {
    clarifyTimeoutError: true,
    silentJSONParsing: false,
  },
  withCredentials: false,
})

const requestInterceptorId = httpClient.interceptors.request.use((config) => {
  config.baseURL = validatedBase(config.baseURL)
  config.url = normalizedRelativePath(config.url ?? '')
  return config
})

const responseInterceptorId = httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiClientError(error))
)

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    httpClient.interceptors.request.eject(requestInterceptorId)
    httpClient.interceptors.response.eject(responseInterceptorId)
  })
}

export async function requestJson<T = unknown>(input: JsonRequestInput): Promise<T> {
  assertBrowserTransportAvailable()

  const request: AxiosRequestConfig = {
    baseURL: productionApiConfig.chessApiBase,
    method: input.method ?? DEFAULT_JSON_METHOD,
    timeout: validatedTimeout(input.timeoutMs),
    url: normalizedRelativePath(input.path),
  }

  if (input.body !== undefined && request.method !== 'GET') request.data = input.body
  if (input.signal) request.signal = input.signal

  const response = await httpClient.request<unknown>(request)
  return JsonResponseSchema.parse(response.data) as T
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message
  return error instanceof Error ? error.message : '请求失败'
}
