import { defineStore } from 'pinia'

import { registerPrivateAuthLossHandler } from '@/api/privateAuthLifecycle'
import { clearPrivateProductQueries } from '@/api/queryClient'
import { clearLegacyAuthState } from '@/persistence/auth/sessionPersistence'
import { clearPrivateWorkspaceHandoffContexts } from '@/persistence/workspace/workspaceHandoff'

import { useAnalysisStore } from './analysis'
import { usePgnStore } from './pgn'

type AuthStatus = 'checking' | 'unavailable'

interface AuthState {
  status: AuthStatus
  lastError: string | null
  initialized: boolean
}

const AUTH_UNAVAILABLE_MESSAGE = 'Web 登录合同尚未确认，当前不会收集账号或密码。'

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
    lastError: null,
    initialized: false,
  }),

  getters: {
    isAuthenticated(): boolean {
      return false
    },
    accountLabel(): string {
      return '认证未开放'
    },
    unavailableMessage(): string {
      return AUTH_UNAVAILABLE_MESSAGE
    },
  },

  actions: {
    initialize(): void {
      registerPrivateAuthLossHandler((message) => this.handleAuthLoss(message))
      if (this.initialized) return

      clearLegacyAuthState()
      clearPrivateProductState()
      this.status = 'unavailable'
      this.lastError = null
      this.initialized = true
    },
    handleAuthLoss(message = '认证状态不可用，私有数据已清除。'): void {
      clearLegacyAuthState()
      clearPrivateProductState()
      this.status = 'unavailable'
      this.lastError = message
      this.initialized = true
    },
    logout(): void {
      clearLegacyAuthState()
      clearPrivateProductState()
      this.status = 'unavailable'
      this.lastError = null
      this.initialized = true
    },
  },
})
