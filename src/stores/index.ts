import { createPinia } from 'pinia'

export const pinia = createPinia()

export { usePgnStore } from './pgn'
export { useThemeStore } from './theme'
export { useWorkspaceStore } from './workspace'
