<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { NConfigProvider, NGlobalStyle, NMessageProvider } from 'naive-ui'

import { useThemeStore } from '@/stores'

import { resolveNaiveTheme } from './naiveTheme'
import { buildNaiveThemeOverrides } from './naiveThemeOverrides'
import ProductFeedbackProvider from './ProductFeedbackProvider.vue'

const themeStore = useThemeStore()

const naiveTheme = computed(() => resolveNaiveTheme(themeStore.resolvedTheme))
const naiveThemeOverrides = ref(buildNaiveThemeOverrides())

// Rebuild Naive UI overrides only after the document token state has settled.
// Reading getComputedStyle before the browser recalculates the themed custom
// properties can capture stale values, so the watcher waits for Vue's DOM flush
// (which follows applyThemeDocumentState) before sampling tokens.
watch(
  () => themeStore.resolvedTheme,
  async () => {
    await nextTick()
    naiveThemeOverrides.value = buildNaiveThemeOverrides()
  },
  { immediate: true }
)
</script>

<template>
  <NConfigProvider :theme="naiveTheme" :theme-overrides="naiveThemeOverrides">
    <NMessageProvider>
      <ProductFeedbackProvider>
        <NGlobalStyle />
        <slot />
      </ProductFeedbackProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
