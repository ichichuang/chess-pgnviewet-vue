export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const
export const RESOLVED_THEMES = ['light', 'dark'] as const

export const DEFAULT_THEME_PREFERENCE = 'system'
export const THEME_STORAGE_KEY = 'themeMode'
export const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export const THEME_MODE_MARKER_ATTRIBUTE = 'data-theme-mode'
export const RESOLVED_THEME_MARKER_ATTRIBUTE = 'data-theme'
export const THEME_COLOR_META_SELECTOR = 'meta[name="theme-color"]'
export const THEME_COLOR_TOKEN = '--bg'
