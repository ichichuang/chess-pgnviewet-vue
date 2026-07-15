import { defineStore } from 'pinia'

import { apiErrorMessage, ApiClientError, type ApiClientErrorKind } from '@/api/client'
import { authRepository } from '@/api/authRepository'
import {
  registerPrivateAuthLossHandler,
  registerPrivateAuthTokenProvider,
} from '@/api/privateAuthLifecycle'
import { clearPrivateProductQueries } from '@/api/queryClient'
import {
  clearPersistedAuthSession,
  persistAuthSession,
  readPersistedAuthSession,
  type PersistedAuthSession,
} from '@/persistence/auth/authPersistence'
import { clearPrivateWorkspaceHandoffContexts } from '@/persistence/workspace/workspaceHandoff'

import { useAnalysisStore } from './analysis'
import { usePgnStore } from './pgn'

type AuthStatus = 'checking' | 'anonymous' | 'submitting' | 'authenticated'

interface AuthState {
  status: AuthStatus
  session: PersistedAuthSession | null
  lastError: string | null
  lastErrorKind: ApiClientErrorKind | null
  initialized: boolean
}

let expiryTimer: ReturnType<typeof setTimeout> | null = null

function clearExpiryTimer(): void {
  if (expiryTimer !== null) globalThis.clearTimeout(expiryTimer)
  expiryTimer = null
}

function clearPrivateProductState(): void {
  clearPrivateProductQueries()
  clearPrivateWorkspaceHandoffContexts()
  const analysis = useAnalysisStore()
  analysis.dispose()
  analysis.$reset()
  usePgnStore().clearPrivateReplay()
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    status: 'checking',
    session: null,
    lastError: null,
    lastErrorKind: null,
    initialized: false,
  }),

  getters: {
    isAuthenticated(state): boolean {
      return (
        state.status === 'authenticated' &&
        state.session !== null &&
        state.session.expiresAt > Date.now()
      )
    },
    isSubmitting(state): boolean {
      return state.status === 'submitting'
    },
    accountLabel(state): string {
      return state.session?.accountLabel ?? '未登录'
    },
  },

  actions: {
    scheduleExpiry(expiresAt: number): void {
      clearExpiryTimer()
      const remaining = Math.max(0, expiresAt - Date.now())
      expiryTimer = globalThis.setTimeout(() => {
        this.handleAuthLoss('登录状态已过期，请重新登录。')
      }, remaining)
    },
    initialize(): void {
      registerPrivateAuthLossHandler((message) => this.handleAuthLoss(message))
      registerPrivateAuthTokenProvider(() =>
        this.isAuthenticated ? (this.session?.token ?? null) : null
      )

      if (this.initialized) {
        if (this.session && this.session.expiresAt <= Date.now()) {
          this.handleAuthLoss('登录状态已过期，请重新登录。')
        }
        return
      }

      const restored = readPersistedAuthSession()
      this.session = restored
      this.status = restored ? 'authenticated' : 'anonymous'
      this.lastError = null
      this.lastErrorKind = null
      this.initialized = true
      if (restored) this.scheduleExpiry(restored.expiresAt)
    },
    async login(account: string, password: string): Promise<boolean> {
      if (this.isSubmitting) return false

      this.status = 'submitting'
      this.lastError = null

      try {
        const authenticated = await authRepository.login(account, password)
        const session = persistAuthSession({
          token: authenticated.token,
          uid: authenticated.uid,
          accountLabel: authenticated.nickname || authenticated.mobile || authenticated.uid,
        })
        this.session = session
        this.status = 'authenticated'
        this.initialized = true
        this.lastError = null
        this.lastErrorKind = null
        this.scheduleExpiry(session.expiresAt)
        return true
      } catch (error) {
        clearPersistedAuthSession()
        clearExpiryTimer()
        this.session = null
        this.status = 'anonymous'
        this.lastError = apiErrorMessage(error)
        this.lastErrorKind = error instanceof ApiClientError ? error.kind : null
        this.initialized = true
        clearPrivateProductState()
        return false
      }
    },
    handleAuthLoss(message = '登录状态已失效，请重新登录。'): void {
      clearPersistedAuthSession()
      clearExpiryTimer()
      clearPrivateProductState()
      this.session = null
      this.status = 'anonymous'
      this.lastError = message
      this.lastErrorKind = null
      this.initialized = true
    },
    logout(): void {
      clearPersistedAuthSession()
      clearExpiryTimer()
      clearPrivateProductState()
      this.session = null
      this.status = 'anonymous'
      this.lastError = null
      this.lastErrorKind = null
      this.initialized = true
    },
  },
})
