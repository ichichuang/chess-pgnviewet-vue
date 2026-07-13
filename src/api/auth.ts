import { z } from 'zod'

import type { AuthSession } from '@/persistence/auth/sessionPersistence'
import { productionApiConfig } from '@/runtime/config/productionApi'

import { ApiClientError, requestJson } from './client'
import { md5Hex } from './md5'

export interface LoginInput {
  readonly account: string
  readonly password: string
  readonly signal?: AbortSignal
}

export interface AbsorbedSessionResult {
  readonly session: AuthSession | null
  readonly cleanedQuery: URLSearchParams
  readonly changed: boolean
}

const LoginEnvelopeSchema = z.record(z.string(), z.unknown())

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
}

function nestedRecord(
  source: Record<string, unknown>,
  key: string
): Record<string, unknown> | null {
  return record(source[key])
}

function responseContent(raw: unknown): Record<string, unknown> {
  const envelope = LoginEnvelopeSchema.safeParse(raw)

  if (!envelope.success) {
    throw new ApiClientError({
      kind: 'contract-mismatch',
      message: 'Login response was not an object.',
    })
  }

  const outer = envelope.data
  const body = nestedRecord(outer, 'data') ?? outer
  const resp = nestedRecord(body, 'resp')
  const err = resp?.err

  if (err !== undefined && Number(err) !== 0) {
    throw new ApiClientError({
      kind: 'auth-required',
      message: text(resp?.msg) || text(resp?.errmsg) || '登录失败',
    })
  }

  const code = body.code
  if (code !== undefined && ![0, 203].includes(Number(code))) {
    throw new ApiClientError({
      kind: Number(code) === 401 ? 'auth-required' : 'upstream',
      message: text(body.msg) || text(body.errmsg) || '登录失败',
    })
  }

  return nestedRecord(body, 'content') ?? nestedRecord(body, 'data') ?? body
}

function buildLoginPayload(account: string, passwordDigest: string): Record<string, unknown> {
  return {
    type: 0,
    tel: account,
    code: passwordDigest,
    mobile: account,
    pwd: passwordDigest,
    Type: 0,
    login_func: {
      appid: productionApiConfig.loginAppId,
      func: 'verifyPassword',
      openid: '',
    },
  }
}

export async function loginWithAccount(input: LoginInput): Promise<AuthSession> {
  const account = input.account.trim()

  if (!account || !input.password) {
    throw new ApiClientError({
      kind: 'auth-required',
      message: '请输入账号和密码',
    })
  }

  const raw = await requestJson({
    path: '/liveproxy/PostLoginByPhone',
    body: buildLoginPayload(account, md5Hex(input.password)),
    signal: input.signal,
  })
  const content = responseContent(raw)
  const kslValue = text(content.token)
  const jwtValue = text(content.jwttoken) || text(content.jwtToken) || text(content.loginToken)
  const loginValue = jwtValue || kslValue

  if (!loginValue || !kslValue) {
    throw new ApiClientError({
      kind: 'contract-mismatch',
      message: 'Login response did not include a usable session value.',
    })
  }

  return {
    loginValue,
    kslValue,
    uid: text(content.uid),
    jgid: text(content.jgid),
    accountLabel: account,
    issuedAt: Date.now(),
  }
}

function lastParam(params: URLSearchParams, key: string): string {
  return (
    params
      .getAll(key)
      .map((value) => value.trim())
      .filter(Boolean)
      .at(-1) ?? ''
  )
}

export function absorbSessionQuery(query: URLSearchParams): AbsorbedSessionResult {
  const cleanedQuery = new URLSearchParams(query)
  const loginValue =
    lastParam(query, 'jwttoken') || lastParam(query, 'loginToken') || lastParam(query, 'token')
  const kslValue = lastParam(query, 'token') || loginValue
  const uid = lastParam(query, 'uid')
  const jgid = lastParam(query, 'jgid')
  let changed = false

  for (const key of ['jwttoken', 'loginToken', 'token', 'uid', 'jgid']) {
    if (cleanedQuery.has(key)) {
      cleanedQuery.delete(key)
      changed = true
    }
  }

  if (!loginValue || !kslValue) {
    return { session: null, cleanedQuery, changed }
  }

  return {
    session: {
      loginValue,
      kslValue,
      uid,
      jgid,
      accountLabel: uid || '已登录',
      issuedAt: Date.now(),
    },
    cleanedQuery,
    changed,
  }
}
