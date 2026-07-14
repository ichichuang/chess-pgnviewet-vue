import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'

import App from './App.vue'
import { queryClient } from './api/queryClient'
import { readWorkspaceLayout } from './persistence/workspace/workspaceLayoutPersistence'
import { loginRouteFor, router } from './router'
import { pinia, useAuthStore, useThemeStore, useWorkspaceStore } from './stores'

import './styles/index.css'

const app = createApp(App)

app.use(pinia)
const workspaceStore = useWorkspaceStore(pinia)
const persistedWorkspaceLayout = await readWorkspaceLayout()
if (persistedWorkspaceLayout) {
  workspaceStore.restorePersistedLayout(persistedWorkspaceLayout)
}
const themeStore = useThemeStore(pinia)
themeStore.initialize()
app.config.globalProperties.$theme = themeStore
const authStore = useAuthStore(pinia)
authStore.initialize()
authStore.$subscribe(() => {
  const currentRoute = router.currentRoute.value
  if (
    !authStore.isAuthenticated &&
    currentRoute.meta.requiresAuth &&
    currentRoute.name !== 'login'
  ) {
    void router.replace(loginRouteFor(currentRoute.fullPath))
  }
})

app.use(VueQueryPlugin, { queryClient })
app.use(router)

app.mount('#app')
