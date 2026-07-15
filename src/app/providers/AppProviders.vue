<script setup lang="ts">
import { computed } from 'vue'
import { NConfigProvider, NGlobalStyle } from 'naive-ui'

import { useThemeStore } from '@/stores'

import { resolveNaiveTheme } from './naiveTheme'
import { buildNaiveThemeOverrides } from './naiveThemeOverrides'

const themeStore = useThemeStore()

const naiveTheme = computed(() => resolveNaiveTheme(themeStore.resolvedTheme))
const naiveThemeOverrides = computed(() => {
  // Touch resolved theme so the override rebuilds after the document token state updates.
  void themeStore.resolvedTheme
  return buildNaiveThemeOverrides()
})
</script>

<template>
  <NConfigProvider abstract :theme="naiveTheme" :theme-overrides="naiveThemeOverrides">
    <NGlobalStyle />
    <slot />
  </NConfigProvider>
</template>
