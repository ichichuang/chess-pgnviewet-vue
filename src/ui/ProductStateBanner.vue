<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NAlert } from 'naive-ui'

import {
  completeLeaveImmediately,
  createStateEnterHook,
} from '@/features/motion/stateEnterHooks'

type BannerStatus = 'info' | 'success' | 'warning' | 'error'

const props = withDefaults(
  defineProps<{
    status?: BannerStatus
    title?: string
    showIcon?: boolean
  }>(),
  {
    status: 'info',
    title: '',
    showIcon: true,
  }
)

const alertType = computed(() => props.status)

const alertRef = ref<InstanceType<typeof NAlert> | null>(null)
const rootEl = ref<HTMLElement | null>(null)

onMounted(() => {
  const el = alertRef.value?.$el
  rootEl.value = el instanceof HTMLElement ? el : null
})

const onStateEnter = createStateEnterHook(rootEl)
</script>

<template>
  <Transition appear :css="false" @enter="onStateEnter" @leave="completeLeaveImmediately">
    <NAlert ref="alertRef" :type="alertType" :show-icon="showIcon" :bordered="true">
      <template v-if="title" #header>
        {{ title }}
      </template>
      <slot />
    </NAlert>
  </Transition>
</template>
