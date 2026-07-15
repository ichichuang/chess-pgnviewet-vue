<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import ProductButton from './ProductButton.vue'
import ProductStateBanner from './ProductStateBanner.vue'

type UnavailableKind = 'invalid' | 'auth-required' | 'auth-denied' | 'contract-blocked' | 'retryable'

const props = defineProps<{
  kind: UnavailableKind
  title: string
  explanation: string
  safeReturn?: RouteLocationRaw
  retryable?: boolean
}>()

const emit = defineEmits<{
  login: []
  retry: []
  return: []
}>()

const bannerStatus = computed(() => computedStatus(props.kind))

function computedStatus(kind: UnavailableKind): 'warning' | 'error' | 'info' {
  if (kind === 'auth-required') return 'info'
  if (kind === 'retryable' || kind === 'auth-denied') return 'error'
  return 'warning'
}

function handlePrimary(): void {
  if (props.kind === 'auth-required') {
    emit('login')
    return
  }

  if (props.kind === 'retryable') {
    emit('retry')
    return
  }

  emit('return')
}

function handleSecondary(): void {
  if (props.kind === 'auth-required') {
    emit('return')
    return
  }

  if (props.kind === 'retryable' && props.safeReturn) {
    emit('return')
  }
}

function primaryLabel(): string {
  if (props.kind === 'auth-required') return '去登录'
  if (props.kind === 'retryable') return '重试'
  return '返回可用内容'
}

function secondaryLabel(): string {
  if (props.kind === 'auth-required') return '暂不登录'
  if (props.kind === 'retryable') return '返回可用内容'
  return ''
}
</script>

<template>
  <section class="unavailable-state" aria-live="polite">
    <ProductStateBanner :status="bannerStatus" :title="title">
      <p class="unavailable-explanation">{{ explanation }}</p>
      <nav class="unavailable-actions" aria-label="可用操作">
        <ProductButton variant="primary" :title="primaryLabel()" @click="handlePrimary">
          {{ primaryLabel() }}
        </ProductButton>
        <ProductButton
          v-if="secondaryLabel()"
          variant="secondary"
          :title="secondaryLabel()"
          @click="handleSecondary"
        >
          {{ secondaryLabel() }}
        </ProductButton>
        <RouterLink v-else-if="safeReturn" :to="safeReturn" class="unavailable-return-link">
          <ProductButton variant="secondary" :title="primaryLabel()">
            {{ primaryLabel() }}
          </ProductButton>
        </RouterLink>
      </nav>
    </ProductStateBanner>
  </section>
</template>

<style scoped>
.unavailable-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: var(--s-5);
}

.unavailable-explanation {
  margin: 0 0 var(--s-4);
  color: var(--text-2);
  font-size: var(--fs-base);
  line-height: 1.6;
}

.unavailable-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-3);
  align-items: center;
}

.unavailable-return-link {
  display: inline-flex;
  text-decoration: none;
}

/* Synchronized with --workspace-bp-mobile in tokens.css. */
@media (width <= 560px) {
  .unavailable-actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }

  .unavailable-actions > *,
  .unavailable-return-link {
    width: 100%;
  }
}
</style>
