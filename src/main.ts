import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'

import App from './App.vue'
import { queryClient } from './api/queryClient'
import { readWorkspaceLayout } from './persistence/workspace/workspaceLayoutPersistence'
import { router } from './router'
import { pinia, useThemeStore, useWorkspaceStore } from './stores'

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

app.use(VueQueryPlugin, { queryClient })
app.use(router)

app.mount('#app')
