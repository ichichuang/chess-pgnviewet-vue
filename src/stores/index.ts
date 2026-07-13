import { createPinia } from 'pinia'

export const pinia = createPinia()

export { usePgnStore } from './pgn'
export { useThemeStore } from './theme'
export { useWorkspaceStore } from './workspace'
export { useAnalysisStore } from './analysis'
export { useAuthStore } from './auth'
