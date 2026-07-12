import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  readStoredThemePreference,
  removeStoredThemePreference,
  writeStoredThemePreference,
} from '@/bootstrap/preferences/themePreference'
import { DEFAULT_THEME_PREFERENCE, THEME_STORAGE_KEY } from '@/theme/constants'
import {
  applyThemeDocumentState,
  clearBootstrapThemeSnapshot,
  getSystemResolvedTheme,
  getThemeMediaQueryList,
  normalizeThemePreference,
  readBootstrapThemeSnapshot,
  resolveThemePreference,
} from '@/theme/runtime'
import type { ResolvedTheme, ThemePreference } from '@/theme/types'

type ListenerCleanup = () => void

export const useThemeStore = defineStore('theme', () => {
  const preference = ref<ThemePreference>(DEFAULT_THEME_PREFERENCE)
  const systemTheme = ref<ResolvedTheme>(getSystemResolvedTheme())
  const isInitialized = ref(false)
  const storageAvailable = ref(true)
  const storageValueAccepted = ref(true)
  const lastWriteSucceeded = ref<boolean | null>(null)

  let mediaListenerCleanup: ListenerCleanup | null = null
  let storageListenerCleanup: ListenerCleanup | null = null

  const resolvedTheme = computed(() => resolveThemePreference(preference.value, systemTheme.value))

  const listenerInventory = computed(() => ({
    system: mediaListenerCleanup !== null,
    storage: storageListenerCleanup !== null,
  }))

  function initialize(): void {
    if (isInitialized.value) {
      applyCurrentTheme()
      return
    }

    adoptStartupPreference()
    applyCurrentTheme()
    attachSystemPreferenceListener()
    attachStoragePreferenceListener()
    clearBootstrapThemeSnapshot()
    isInitialized.value = true
  }

  function setPreference(nextPreference: ThemePreference): boolean {
    const normalizedPreference = normalizeThemePreference(nextPreference)

    if (!normalizedPreference) {
      return false
    }

    preference.value = normalizedPreference
    const writeSucceeded = writeStoredThemePreference(normalizedPreference)
    lastWriteSucceeded.value = writeSucceeded
    storageAvailable.value = writeSucceeded
    applyCurrentTheme()

    return writeSucceeded
  }

  function resetPreference(): boolean {
    preference.value = DEFAULT_THEME_PREFERENCE
    const removeSucceeded = removeStoredThemePreference()
    lastWriteSucceeded.value = removeSucceeded
    storageAvailable.value = removeSucceeded
    applyCurrentTheme()

    return removeSucceeded
  }

  function dispose(): void {
    mediaListenerCleanup?.()
    storageListenerCleanup?.()
    mediaListenerCleanup = null
    storageListenerCleanup = null
    isInitialized.value = false
  }

  function adoptStartupPreference(): void {
    const bootstrapSnapshot = readBootstrapThemeSnapshot()

    if (bootstrapSnapshot) {
      preference.value = bootstrapSnapshot.preference
      systemTheme.value = bootstrapSnapshot.systemTheme
      storageAvailable.value = bootstrapSnapshot.storageAvailable
      storageValueAccepted.value = bootstrapSnapshot.storageValueAccepted
      return
    }

    const storedPreference = readStoredThemePreference()
    preference.value = storedPreference ?? DEFAULT_THEME_PREFERENCE
    storageValueAccepted.value = storedPreference !== null
    systemTheme.value = getSystemResolvedTheme()
  }

  function applyCurrentTheme(): void {
    applyThemeDocumentState(preference.value, resolvedTheme.value)
  }

  function attachSystemPreferenceListener(): void {
    if (mediaListenerCleanup) {
      return
    }

    const mediaQueryList = getThemeMediaQueryList()

    if (!mediaQueryList) {
      return
    }

    const handleSystemPreferenceChange = (event: MediaQueryListEvent): void => {
      systemTheme.value = event.matches ? 'dark' : 'light'

      if (preference.value === 'system') {
        applyCurrentTheme()
      }
    }

    mediaQueryList.addEventListener('change', handleSystemPreferenceChange)
    mediaListenerCleanup = () => {
      mediaQueryList.removeEventListener('change', handleSystemPreferenceChange)
    }
  }

  function attachStoragePreferenceListener(): void {
    if (storageListenerCleanup || typeof window === 'undefined') {
      return
    }

    const handleStoragePreferenceChange = (event: StorageEvent): void => {
      if (event.key !== THEME_STORAGE_KEY) {
        return
      }

      if (event.newValue === null) {
        preference.value = DEFAULT_THEME_PREFERENCE
        storageValueAccepted.value = true
        applyCurrentTheme()
        return
      }

      const externalPreference = normalizeThemePreference(event.newValue)

      if (!externalPreference) {
        return
      }

      preference.value = externalPreference
      storageValueAccepted.value = true
      applyCurrentTheme()
    }

    window.addEventListener('storage', handleStoragePreferenceChange)
    storageListenerCleanup = () => {
      window.removeEventListener('storage', handleStoragePreferenceChange)
    }
  }

  return {
    preference,
    resolvedTheme,
    systemTheme,
    isInitialized,
    storageAvailable,
    storageValueAccepted,
    lastWriteSucceeded,
    listenerInventory,
    initialize,
    setPreference,
    resetPreference,
    dispose,
  }
})
