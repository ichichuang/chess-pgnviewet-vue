import { z } from 'zod'

export interface AuthSession {
  readonly loginValue: string
  readonly kslValue: string
  readonly uid: string
  readonly jgid: string
  readonly accountLabel: string
  readonly issuedAt: number
}

const STORAGE_KEYS = {
  loginValue: 'logintoken',
  kslValue: 'ksllogintoken',
  uid: 'uid',
  jgid: 'jgid',
  accountLabel: 'loginphone',
  passValue: 'passtoken',
  jwtValue: 'jwttoken',
  userInfo: 'userinfo',
  kslUserInfo: 'ksl_uinfo',
  chessMainKslUserInfo: 'UserInfo:Kaisaile',
  chessMainKslUserInfoExpire: 'UserInfo:Kaisaile:expire',
  chessMainChessServiceUserInfo: 'UserInfo:ChessService',
  chessMainChessServiceUserInfoExpire: 'UserInfo:ChessService:expire',
} as const

const AuthSessionSchema = z.object({
  loginValue: z.string().min(1),
  kslValue: z.string().min(1),
  uid: z.string(),
  jgid: z.string(),
  accountLabel: z.string(),
  issuedAt: z.number().finite().positive(),
})

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function text(key: keyof typeof STORAGE_KEYS): string {
  return storage()?.getItem(STORAGE_KEYS[key])?.trim() ?? ''
}

function setText(key: keyof typeof STORAGE_KEYS, value: string): void {
  const target = storage()
  if (!target) return

  if (value) {
    target.setItem(STORAGE_KEYS[key], value)
    return
  }

  target.removeItem(STORAGE_KEYS[key])
}

export function readAuthSession(): AuthSession | null {
  const loginValue = text('loginValue') || text('jwtValue')
  const kslValue = text('kslValue') || loginValue

  if (!loginValue || !kslValue) {
    return null
  }

  const parsed = AuthSessionSchema.safeParse({
    loginValue,
    kslValue,
    uid: text('uid'),
    jgid: text('jgid'),
    accountLabel: text('accountLabel') || text('uid') || '已登录',
    issuedAt: Date.now(),
  })

  return parsed.success ? parsed.data : null
}

export function saveAuthSession(session: AuthSession): void {
  const parsed = AuthSessionSchema.parse(session)
  setText('loginValue', parsed.loginValue)
  setText('kslValue', parsed.kslValue)
  setText('uid', parsed.uid)
  setText('jgid', parsed.jgid)
  setText('accountLabel', parsed.accountLabel)
  setText('jwtValue', parsed.loginValue)
}

export function clearAuthSession(): void {
  const target = storage()
  if (!target) return

  for (const key of Object.values(STORAGE_KEYS)) {
    target.removeItem(key)
  }
}
