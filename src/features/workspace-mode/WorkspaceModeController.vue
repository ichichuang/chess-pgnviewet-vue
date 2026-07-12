<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import TeachingWorkspace from '@/features/teaching-workspace/TeachingWorkspace.vue'

import { provideWorkspaceModeContext } from './workspaceModeContext'
import { resolveWorkspaceModeRouteContext } from './workspaceModeQuery'

const route = useRoute()
const workspaceModeContext = computed(() =>
  resolveWorkspaceModeRouteContext({
    name: route.name,
    query: route.query,
  })
)

provideWorkspaceModeContext(workspaceModeContext)

defineExpose({ workspaceModeContext })
</script>

<template>
  <TeachingWorkspace />
</template>
