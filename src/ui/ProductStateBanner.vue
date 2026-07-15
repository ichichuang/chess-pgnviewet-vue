<script setup lang="ts">
import { computed } from 'vue'
import { NAlert } from 'naive-ui'

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
</script>

<template>
  <NAlert :type="alertType" :show-icon="showIcon" :bordered="true">
    <template v-if="title" #header>
      {{ title }}
    </template>
    <slot />
  </NAlert>
</template>
