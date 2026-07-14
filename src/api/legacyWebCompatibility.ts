import md5Module from 'js-md5'

const LOGIN_APP_ID = 'wx670cc0af39c366e0'
const LOGIN_OPEN_ID = 'oxIMb5AGtCiTL2gyrFeHVHjWzIIY'
const REQUEST_SIGNING_SEED = '!k@s#l$$_%p^c&_*5*1(5*5*2*0*9$9$'
const REQUEST_SIGNING_USERNAME = 'ksl_pc'

export interface LegacyLoginRequestBody {
  readonly Type: 0
  readonly code: string
  readonly login_func: {
    readonly appid: string
    readonly func: 'verifyPassword'
    readonly openid: string
  }
  readonly mobile: string
  readonly pwd: string
  readonly tel: string
  readonly type: 0
}

export interface LegacySignedHeaders {
  readonly Authorization: string
  readonly Digest?: string
  readonly 'x-date': string
}

function requestSigningKey(): string {
  return REQUEST_SIGNING_SEED.replaceAll('!', '')
    .replaceAll('#', '')
    .replaceAll('$', '')
    .replaceAll('^', '')
    .replaceAll('&', '')
    .replaceAll('*', '')
    .replaceAll('(', '')
    .replaceAll('@', '')
    .replaceAll('%', '')
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''

  for (const byte of bytes) binary += String.fromCharCode(byte)

  return globalThis.btoa(binary)
}

async function hmacSha256Base64(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(requestSigningKey()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return bytesToBase64(new Uint8Array(signature))
}

export function buildLegacyLoginRequest(account: string, password: string): LegacyLoginRequestBody {
  const md5 = md5Module as unknown as (message: string) => string
  const digest = md5(password)

  return {
    Type: 0,
    code: digest,
    login_func: {
      appid: LOGIN_APP_ID,
      func: 'verifyPassword',
      openid: LOGIN_OPEN_ID,
    },
    mobile: account,
    pwd: digest,
    tel: account,
    type: 0,
  }
}

export async function signLegacyBrowserRequest(
  serializedBody: string | undefined,
  now = new Date()
): Promise<LegacySignedHeaders> {
  const date = now.toUTCString()
  let signingInput = `x-date: ${date}`
  let bodyDigest: string | undefined

  if (serializedBody !== undefined) {
    bodyDigest = `SHA-256=${await hmacSha256Base64(serializedBody)}`
    signingInput += `\ndigest: ${bodyDigest}`
  }

  const signature = await hmacSha256Base64(signingInput)
  const signedHeaders = bodyDigest ? 'x-date digest' : 'x-date'
  const authorization = `hmac username="${REQUEST_SIGNING_USERNAME}", algorithm="hmac-sha256", headers="${signedHeaders}", signature="${signature}"`

  return {
    Authorization: authorization,
    ...(bodyDigest ? { Digest: bodyDigest } : {}),
    'x-date': date,
  }
}
