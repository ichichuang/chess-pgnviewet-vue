import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'
import { pinia, useThemeStore } from './stores'

import './styles/index.css'

const app = createApp(App)

app.use(pinia)
const themeStore = useThemeStore(pinia)
themeStore.initialize()
app.config.globalProperties.$theme = themeStore

app.use(router)

app.mount('#app')
