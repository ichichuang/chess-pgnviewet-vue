import { createRouter, createWebHistory } from 'vue-router'

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

router.beforeEach(() => {
  const auth = useAuthStore()
  auth.initialize()

  return true
})

export default router
