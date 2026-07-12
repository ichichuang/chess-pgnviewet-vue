<script setup lang="ts">
import { computed } from 'vue'
import { NConfigProvider, NGlobalStyle } from 'naive-ui'

import { useThemeStore } from '@/stores'

import { resolveNaiveTheme } from './naiveTheme'
import { naiveThemeOverrides } from './naiveThemeOverrides'

const themeStore = useThemeStore()

const naiveTheme = computed(() => resolveNaiveTheme(themeStore.resolvedTheme))
</script>

<template>
  <NConfigProvider abstract :theme="naiveTheme" :theme-overrides="naiveThemeOverrides">
    <NGlobalStyle />
    <slot />
  </NConfigProvider>
</template>
