import { defineStore } from 'pinia'
import type { LocationQuery } from 'vue-router'

import { absorbSessionQuery, loginWithAccount } from '@/api/auth'
import { clearPrivateProductQueries } from '@/api/queryClient'
import {
  clearAuthSession,
  readAuthSession,
  saveAuthSession,
  type AuthSession,
} from '@/persistence/auth/sessionPersistence'
import { clearPrivateWorkspaceHandoffContexts } from '@/persistence/workspace/workspaceHandoff'

import { useAnalysisStore } from './analysis'
import { usePgnStore } from './pgn'

type AuthStatus = 'checking' | 'authenticated' | 'anonymous' | 'submitting' | 'failed'

interface AuthState {
  session: AuthSession | null
  status: AuthStatus
  lastError: string | null
  initialized: boolean
}

function clearPrivateProductState(): void {
  clearPrivateProductQueries()
  clearPrivateWorkspaceHandoffContexts()
  useAnalysisStore().dispose()
  usePgnStore().clearPrivateReplay()
}

function queryToParams(query: LocationQuery): URLSearchParams {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item != null) params.append(key, item)
      }
    } else if (value != null) {
      params.append(key, value)
    }
  }

  return params
}

function paramsToQuery(params: URLSearchParams): LocationQuery {
  const output: Record<string, string | string[]> = {}

  for (const [key, value] of params.entries()) {
    const current = output[key]

    if (Array.isArray(current)) {
      current.push(value)
    } else if (typeof current === 'string') {
      output[key] = [current, value]
    } else {
      output[key] = value
    }
  }

  return output
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    session: null,
    status: 'checking',
    lastError: null,
    initialized: false,
  }),

  getters: {
    isAuthenticated(state): boolean {
      return state.status === 'authenticated' && state.session !== null
    },
    accountLabel(state): string {
      return state.session?.accountLabel || '未登录'
    },
  },

  actions: {
    restoreStoredSession(): void {
      const session = readAuthSession()
      this.session = session
      this.status = session ? 'authenticated' : 'anonymous'
      this.initialized = true
      this.lastError = null
    },
    absorbRouteQuery(query: LocationQuery): { changed: boolean; query: LocationQuery } {
      const absorbed = absorbSessionQuery(queryToParams(query))

      if (absorbed.session) {
        saveAuthSession(absorbed.session)
        this.session = absorbed.session
        this.status = 'authenticated'
        this.lastError = null
        this.initialized = true
      } else if (!this.initialized) {
        this.restoreStoredSession()
      }

      return {
        changed: absorbed.changed,
        query: paramsToQuery(absorbed.cleanedQuery),
      }
    },
    async login(account: string, password: string): Promise<void> {
      this.status = 'submitting'
      this.lastError = null

      try {
        const session = await loginWithAccount({ account, password })
        saveAuthSession(session)
        this.session = session
        this.status = 'authenticated'
        this.initialized = true
      } catch (error) {
        clearPrivateProductState()
        clearAuthSession()
        this.session = null
        this.status = 'failed'
        this.lastError = error instanceof Error ? error.message : '登录失败'
        throw error
      }
    },
    logout(): void {
      clearPrivateProductState()
      clearAuthSession()
      this.session = null
      this.status = 'anonymous'
      this.lastError = null
      this.initialized = true
    },
  },
})
