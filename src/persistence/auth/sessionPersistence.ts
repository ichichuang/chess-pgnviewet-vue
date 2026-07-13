const LEGACY_AUTH_STORAGE_KEYS = [
  'logintoken',
  'ksllogintoken',
  'uid',
  'jgid',
  'loginphone',
  'passtoken',
  'jwttoken',
  'userinfo',
  'ksl_uinfo',
  'UserInfo:Kaisaile',
  'UserInfo:Kaisaile:expire',
  'UserInfo:ChessService',
  'UserInfo:ChessService:expire',
] as const

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function clearLegacyAuthState(): void {
  const target = storage()
  if (!target) return

  for (const key of LEGACY_AUTH_STORAGE_KEYS) target.removeItem(key)
}
