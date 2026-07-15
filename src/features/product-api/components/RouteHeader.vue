<script setup lang="ts">
import { computed, ref } from 'vue'

import { useAuthStore, useThemeStore } from '@/stores'
import { ProductButton, ProductDrawer } from '@/ui'

defineProps<{
  title: string
  subtitle?: string
}>()

const auth = useAuthStore()
const theme = useThemeStore()
const sessionLabel = computed(() => auth.accountLabel)
const settingsOpen = ref(false)

function logout(): void {
  auth.logout()
}

function setTheme(preference: 'light' | 'dark' | 'system'): void {
  theme.setPreference(preference)
}
</script>

<template>
  <header class="route-header">
    <div class="route-title">
      <RouterLink class="workspace-link" :to="{ name: 'workspace' }">工作区</RouterLink>
      <div>
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
    </div>

    <nav class="route-actions" aria-label="产品入口">
      <RouterLink :to="{ name: 'competitions' }">赛事</RouterLink>
      <RouterLink v-if="!auth.isAuthenticated" :to="{ name: 'login' }">登录</RouterLink>
      <button v-else type="button" @click="logout">退出</button>
      <ProductButton variant="text" size="small" @click="settingsOpen = true">设置</ProductButton>
      <span>{{ sessionLabel }}</span>
    </nav>

    <ProductDrawer v-model:show="settingsOpen" title="设置" placement="right" width="320px">
      <section class="settings-section" aria-label="主题">
        <h2>主题</h2>
        <div class="theme-options">
          <ProductButton
            :variant="theme.preference === 'light' ? 'primary' : 'secondary'"
            size="small"
            @click="setTheme('light')"
          >
            浅色
          </ProductButton>
          <ProductButton
            :variant="theme.preference === 'dark' ? 'primary' : 'secondary'"
            size="small"
            @click="setTheme('dark')"
          >
            深色
          </ProductButton>
          <ProductButton
            :variant="theme.preference === 'system' ? 'primary' : 'secondary'"
            size="small"
            @click="setTheme('system')"
          >
            跟随系统
          </ProductButton>
        </div>
      </section>
    </ProductDrawer>
  </header>
</template>

<style scoped>
.route-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  min-width: 0;
  padding: var(--s-4) var(--s-5);
  border-bottom: var(--workspace-border-w) solid var(--border);
  background: var(--surface);
}

.route-title {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  min-width: 0;
}

.route-title h1,
.route-title p {
  margin: 0;
}

.route-title h1 {
  color: var(--text);
  font-size: var(--fs-xl);
}

.route-title p {
  margin-top: var(--s-1);
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.workspace-link,
.route-actions a,
.route-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--control-h-sm);
  padding: 0 var(--s-3);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}

.route-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--s-2);
}

.route-actions span {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.settings-section h2 {
  margin: 0 0 var(--s-3);
  font-size: var(--fs-md);
}

.theme-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

@media (width <= 760px) {
  .route-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .route-actions {
    flex-wrap: wrap;
  }

  .workspace-link,
  .route-actions a,
  .route-actions button {
    min-height: var(--board-touch-target-min);
  }
}
</style>
