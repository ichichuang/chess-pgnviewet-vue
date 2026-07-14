import { z } from 'zod'

const AUTH_STORAGE_KEY = 'kaisaile.auth.v1'
const AUTH_SESSION_LIFETIME_MS = 43_200_000

const PersistedAuthSessionSchema = z.strictObject({
  version: z.literal(1),
  token: z.string().min(1).max(4096),
  uid: z.string().min(1).max(128),
  accountLabel: z.string().min(1).max(160),
  expiresAt: z.number().int().positive(),
})

export type PersistedAuthSession = z.infer<typeof PersistedAuthSessionSchema>

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function clearPersistedAuthSession(): void {
  try {
    storage()?.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // Memory-only logout remains effective when browser storage is unavailable.
  }
}

export function readPersistedAuthSession(now = Date.now()): PersistedAuthSession | null {
  let raw: string | null

  try {
    raw = storage()?.getItem(AUTH_STORAGE_KEY) ?? null
  } catch {
    return null
  }

  if (!raw) return null

  try {
    const parsed = PersistedAuthSessionSchema.safeParse(JSON.parse(raw) as unknown)
    if (!parsed.success || parsed.data.expiresAt <= now) {
      clearPersistedAuthSession()
      return null
    }
    return parsed.data
  } catch {
    clearPersistedAuthSession()
    return null
  }
}

export function persistAuthSession(
  input: Omit<PersistedAuthSession, 'version' | 'expiresAt'>,
  now = Date.now()
): PersistedAuthSession {
  const session = PersistedAuthSessionSchema.parse({
    version: 1,
    token: input.token,
    uid: input.uid,
    accountLabel: input.accountLabel,
    expiresAt: now + AUTH_SESSION_LIFETIME_MS,
  })

  try {
    storage()?.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // The authenticated session remains memory-only when persistence is unavailable.
  }

  return session
}
