<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'

import SettingsSurface from '@/features/settings'
import {
  createRouteSettingsContext,
  type SettingsPage,
} from '@/features/settings/settingsContext'
import { useAuthStore } from '@/stores'
import { ProductButton } from '@/ui'

type RouteTitleRef = ComponentPublicInstance | Element | null

const props = defineProps<{
  title: string
  titleId: string
  subtitle?: string
  settingsPage: Exclude<SettingsPage, 'workspace'>
  registerTitle: (element: RouteTitleRef) => void
}>()

const auth = useAuthStore()
const sessionLabel = computed(() => auth.accountLabel)
const settingsOpen = ref(false)
const settingsButtonRef = ref<InstanceType<typeof ProductButton> | null>(null)
const settingsContext = computed(() => createRouteSettingsContext(props.settingsPage))

function logout(): void {
  auth.logout()
}

function registerRouteTitle(element: RouteTitleRef): void {
  props.registerTitle(element)
}
</script>

<template>
  <div class="route-header">
    <div class="route-title">
      <RouterLink class="workspace-link" :to="{ name: 'workspace' }">工作区</RouterLink>
      <div>
        <h1 :id="titleId" :ref="registerRouteTitle" class="route-heading" tabindex="-1">
          {{ title }}
        </h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
    </div>

    <nav class="route-actions" aria-label="产品入口">
      <RouterLink :to="{ name: 'competitions' }">赛事</RouterLink>
      <RouterLink v-if="!auth.isAuthenticated" :to="{ name: 'login' }">登录</RouterLink>
      <button v-else type="button" @click="logout">退出</button>
      <ProductButton
        ref="settingsButtonRef"
        variant="text"
        size="small"
        @click="settingsOpen = true"
      >
        设置
      </ProductButton>
      <span>{{ sessionLabel }}</span>
    </nav>

    <SettingsSurface
      v-model:show="settingsOpen"
      :context="settingsContext"
      :on-return-focus="() => settingsButtonRef?.focus()"
    />
  </div>
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
  outline: none;
}

.route-heading:focus {
  border-radius: var(--r-xs);
  box-shadow: var(--state-focus-ring);
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

/* Synchronized with --route-bp-narrow in tokens.css. */
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
