import type { RESOLVED_THEMES, THEME_PREFERENCES } from './constants'

export type ThemePreference = (typeof THEME_PREFERENCES)[number]
export type ResolvedTheme = (typeof RESOLVED_THEMES)[number]

interface ThemeDocumentSnapshot {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  systemTheme: ResolvedTheme
}

export interface ThemeBootstrapSnapshot extends ThemeDocumentSnapshot {
  storageAvailable: boolean
  storageValueAccepted: boolean
}

declare global {
  interface Window {
    __KAISAILE_THEME_BOOTSTRAP__?: Partial<ThemeBootstrapSnapshot>
  }
}
