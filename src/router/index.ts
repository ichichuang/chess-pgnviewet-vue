import { createRouter, createWebHistory, type RouteLocationRaw } from 'vue-router'

import { useAuthStore } from '@/stores'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'workspace',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/match/:key',
      name: 'match',
      meta: { requiresAuth: true },
      component: () => import('@/features/product-api/views/CompatibilityEntryView.vue')
    },
    {
      path: '/share/:uuid',
      name: 'share',
      component: () => import('@/features/product-api/views/CompatibilityEntryView.vue')
    },
    {
      path: '/cloud/:fileid',
      name: 'cloud',
      meta: { requiresAuth: true },
      component: () => import('@/features/product-api/views/CompatibilityEntryView.vue')
    },
    {
      path: '/competitions',
      name: 'competitions',
      component: () => import('@/features/product-api/views/CompetitionListView.vue')
    },
    {
      path: '/competitions/:hdid/display',
      name: 'competition-display',
      component: () => import('@/features/product-api/views/CompetitionDisplayView.vue')
    },
    {
      path: '/competitions/:hdid/live',
      name: 'competition-live',
      meta: { requiresAuth: true },
      component: () => import('@/features/product-api/views/CompetitionLiveRedirectView.vue')
    },
    {
      path: '/competitions/:hdid',
      name: 'competition-detail',
      component: () => import('@/features/product-api/views/CompetitionDetailView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/features/product-api/views/LoginView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

const SENSITIVE_RETURN_KEYS = ['authorization', 'cookie', 'password', 'token']

function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
}

export function safeAuthReturnPath(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const candidate = value.trim()

  if (
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    candidate.length > 512 ||
    hasControlCharacter(candidate)
  ) {
    return null
  }

  try {
    const parsed = new URL(candidate, 'https://local.invalid')
    if (parsed.origin !== 'https://local.invalid' || parsed.pathname === '/login') return null
    for (const key of parsed.searchParams.keys()) {
      const lowered = key.toLowerCase()
      if (SENSITIVE_RETURN_KEYS.some((marker) => lowered.includes(marker))) return null
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}

export function loginRouteFor(returnPath: string): RouteLocationRaw {
  const safeReturnPath = safeAuthReturnPath(returnPath)
  return safeReturnPath ? { name: 'login', query: { return: safeReturnPath } } : { name: 'login' }
}

router.beforeEach((to) => {
  const auth = useAuthStore()
  auth.initialize()

  if (to.name === 'login' && auth.isAuthenticated) {
    return safeAuthReturnPath(to.query.return) ?? { name: 'competitions' }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) return loginRouteFor(to.fullPath)

  return true
})

export default router
