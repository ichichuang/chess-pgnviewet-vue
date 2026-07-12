import { THEME_STORAGE_KEY } from '@/theme/constants'
import { normalizeThemePreference } from '@/theme/runtime'
import type { ThemePreference } from '@/theme/types'

export function readStoredThemePreference(): ThemePreference | null {
  const storage = getThemePreferenceStorage()

  if (!storage) {
    return null
  }

  try {
    return normalizeThemePreference(storage.getItem(THEME_STORAGE_KEY))
  } catch {
    return null
  }
}

export function writeStoredThemePreference(preference: ThemePreference): boolean {
  const storage = getThemePreferenceStorage()

  if (!storage) {
    return false
  }

  try {
    storage.setItem(THEME_STORAGE_KEY, preference)
    return true
  } catch {
    return false
  }
}

export function removeStoredThemePreference(): boolean {
  const storage = getThemePreferenceStorage()

  if (!storage) {
    return false
  }

  try {
    storage.removeItem(THEME_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

function getThemePreferenceStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}
