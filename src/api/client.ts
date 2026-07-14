import axios, { type AxiosRequestConfig } from 'axios'
import { z } from 'zod'

import { productionApiConfig } from '@/runtime/config/productionApi'

import type { WebApiEndpoint } from './endpoints'
import { signLegacyBrowserRequest } from './legacyWebCompatibility'
import { notifyPrivateAuthLoss, privateAuthToken } from './privateAuthLifecycle'

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

export interface JsonRequestInput {
  readonly path: WebApiEndpoint
  readonly body: unknown
  readonly auth?: 'protected'
  readonly signal?: AbortSignal | undefined
  readonly timeoutMs?: number
}

type CompatibilityAxiosRequestConfig = AxiosRequestConfig & {
  readonly kaisaileAuth?: 'protected'
}

const JsonResponseSchema = z.unknown()
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
    throw configurationError('请求地址无效。')
  }

  const pathname = candidate.split(/[?#]/u, 1)[0] ?? ''
  let decodedPathname: string

  try {
    decodedPathname = decodeURIComponent(pathname)
  } catch {
    throw configurationError('请求地址无效。')
  }

  if (
    decodedPathname.startsWith('//') ||
    decodedPathname.includes('\\') ||
    decodedPathname.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    throw configurationError('请求地址无效。')
  }

  return candidate
}

function validatedBase(base: string | undefined): string {
  if (base !== productionApiConfig.chessApiBase) {
    throw configurationError('请求设置无效。')
  }

  return productionApiConfig.chessApiBase
}

function validatedTimeout(timeoutMs: number | undefined): number {
  const candidate = timeoutMs ?? productionApiConfig.requestTimeoutMs

  if (!Number.isInteger(candidate) || candidate < 3_000 || candidate > 30_000) {
    throw configurationError('请求设置无效。')
  }

  return candidate
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
  if (kind === 'auth-required') return '请重新登录。'
  if (kind === 'permission-denied') return '没有访问权限。'
  if (kind === 'rate-limited') return '请求过于频繁，请稍后重试。'
  if (kind === 'service-unavailable' || kind === 'upstream') return '服务暂不可用。'
  return `请求失败（${status}）`
}

function toApiClientError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error

  if (!axios.isAxiosError(error)) {
    return new ApiClientError({ kind: 'network', message: '网络请求失败。' })
  }

  if (error.code === 'ERR_CANCELED') {
    return new ApiClientError({ kind: 'cancelled', message: '请求已取消。' })
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiClientError({ kind: 'timeout', message: '请求超时，请稍后重试。' })
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
      message: '服务返回了无法识别的数据。',
    })
  }

  if (
    error.code === 'ERR_BAD_OPTION' ||
    error.code === 'ERR_BAD_OPTION_VALUE' ||
    error.code === 'ERR_INVALID_URL'
  ) {
    return configurationError('请求设置无效。')
  }

  return new ApiClientError({ kind: 'network', message: '网络连接失败，请稍后重试。' })
}

function protectedRequest(config: CompatibilityAxiosRequestConfig): boolean {
  return config.kaisaileAuth === 'protected'
}

function serializedRequestBody(config: CompatibilityAxiosRequestConfig): string | undefined {
  if (config.data === undefined) return undefined

  if (typeof config.data !== 'object' || config.data === null || Array.isArray(config.data)) {
    throw configurationError('请求内容无效。')
  }

  let body = config.data as Record<string, unknown>

  if (protectedRequest(config)) {
    const token = privateAuthToken()
    if (!token) {
      queueMicrotask(() => notifyPrivateAuthLoss('登录状态已失效，请重新登录。'))
      throw new ApiClientError({
        kind: 'auth-required',
        message: '请重新登录。',
        retryable: false,
      })
    }
    body = { ...body, token }
  }

  return JSON.stringify(body)
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

const requestInterceptorId = httpClient.interceptors.request.use(async (config) => {
  const compatibilityConfig = config as typeof config & CompatibilityAxiosRequestConfig
  compatibilityConfig.baseURL = validatedBase(compatibilityConfig.baseURL)
  compatibilityConfig.url = normalizedRelativePath(compatibilityConfig.url ?? '')
  const serializedBody = serializedRequestBody(compatibilityConfig)
  const signedHeaders = await signLegacyBrowserRequest(serializedBody)

  compatibilityConfig.data = serializedBody
  compatibilityConfig.headers.set('Authorization', signedHeaders.Authorization)
  compatibilityConfig.headers.set('x-date', signedHeaders['x-date'])
  if (signedHeaders.Digest) compatibilityConfig.headers.set('Digest', signedHeaders.Digest)

  return compatibilityConfig
})

const responseInterceptorId = httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const normalized = toApiClientError(error)
    const requestConfig = axios.isAxiosError(error)
      ? (error.config as CompatibilityAxiosRequestConfig | undefined)
      : undefined

    if (normalized.kind === 'auth-required' && requestConfig && protectedRequest(requestConfig)) {
      queueMicrotask(() => notifyPrivateAuthLoss('登录状态已失效，请重新登录。'))
    }

    return Promise.reject(normalized)
  }
)

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    httpClient.interceptors.request.eject(requestInterceptorId)
    httpClient.interceptors.response.eject(responseInterceptorId)
  })
}

export async function requestJson(input: JsonRequestInput): Promise<unknown> {
  const request: CompatibilityAxiosRequestConfig = {
    baseURL: productionApiConfig.chessApiBase,
    ...(input.auth ? { kaisaileAuth: input.auth } : {}),
    method: 'POST',
    timeout: validatedTimeout(input.timeoutMs),
    url: normalizedRelativePath(input.path),
  }

  request.data = input.body
  if (input.signal) request.signal = input.signal

  const response = await httpClient.request<unknown>(request)
  return JsonResponseSchema.parse(response.data)
}

export function apiErrorMessage(_error: unknown): string {
  if (_error instanceof ApiClientError) return _error.message
  return '请求失败，请稍后重试。'
}
