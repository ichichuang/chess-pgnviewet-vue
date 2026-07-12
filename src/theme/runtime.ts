import {
  RESOLVED_THEME_MARKER_ATTRIBUTE,
  RESOLVED_THEMES,
  THEME_COLOR_META_SELECTOR,
  THEME_COLOR_TOKEN,
  THEME_MEDIA_QUERY,
  THEME_MODE_MARKER_ATTRIBUTE,
  THEME_PREFERENCES,
} from './constants'
import type { ResolvedTheme, ThemeBootstrapSnapshot, ThemePreference } from './types'

export function normalizeThemePreference(value: unknown): ThemePreference | null {
  return isThemePreference(value) ? value : null
}

export function resolveThemePreference(
  preference: ThemePreference,
  systemTheme: ResolvedTheme
): ResolvedTheme {
  return preference === 'system' ? systemTheme : preference
}

export function getThemeMediaQueryList(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null
  }

  try {
    return window.matchMedia(THEME_MEDIA_QUERY)
  } catch {
    return null
  }
}

export function getSystemResolvedTheme(): ResolvedTheme {
  return getThemeMediaQueryList()?.matches ? 'dark' : 'light'
}

export function readBootstrapThemeSnapshot(): ThemeBootstrapSnapshot | null {
  if (typeof window === 'undefined') {
    return null
  }

  const snapshot = window.__KAISAILE_THEME_BOOTSTRAP__

  if (!snapshot) {
    return null
  }

  const preference = normalizeThemePreference(snapshot.preference)
  const systemTheme = isResolvedTheme(snapshot.systemTheme)
    ? snapshot.systemTheme
    : getSystemResolvedTheme()
  const resolvedTheme = isResolvedTheme(snapshot.resolvedTheme)
    ? snapshot.resolvedTheme
    : preference
      ? resolveThemePreference(preference, systemTheme)
      : null

  if (!preference || !resolvedTheme) {
    return null
  }

  return {
    preference,
    resolvedTheme,
    systemTheme,
    storageAvailable: snapshot.storageAvailable !== false,
    storageValueAccepted: snapshot.storageValueAccepted !== false,
  }
}

export function applyThemeDocumentState(
  preference: ThemePreference,
  resolvedTheme: ResolvedTheme
): void {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  root.setAttribute(THEME_MODE_MARKER_ATTRIBUTE, preference)
  root.setAttribute(RESOLVED_THEME_MARKER_ATTRIBUTE, resolvedTheme)
  root.style.colorScheme = resolvedTheme
  syncMetaThemeColor(root)
}

function syncMetaThemeColor(root: HTMLElement = document.documentElement): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return
  }

  const themeColor = window.getComputedStyle(root).getPropertyValue(THEME_COLOR_TOKEN).trim()

  if (!themeColor) {
    return
  }

  const meta = ensureThemeColorMeta()
  meta.setAttribute('content', themeColor)
}

export function clearBootstrapThemeSnapshot(): void {
  if (typeof window !== 'undefined') {
    delete window.__KAISAILE_THEME_BOOTSTRAP__
  }
}

function ensureThemeColorMeta(): HTMLMetaElement {
  const current = document.querySelector<HTMLMetaElement>(THEME_COLOR_META_SELECTOR)

  if (current) {
    return current
  }

  const meta = document.createElement('meta')
  meta.name = 'theme-color'
  document.head.append(meta)

  return meta
}

function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference)
}

function isResolvedTheme(value: unknown): value is ResolvedTheme {
  return RESOLVED_THEMES.includes(value as ResolvedTheme)
}
