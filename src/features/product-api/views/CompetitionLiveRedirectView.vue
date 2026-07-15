<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  evaluateLiveSpectatorAvailability,
  isCapabilityAuthRequired,
  isCapabilityAvailable,
  isCapabilityContractBlocked,
} from '@/features/product-api/domain/capabilityAvailability'
import { ProductRouteShell, ProductUnavailableState } from '@/ui'
import { isSafeWorkspaceIdentifier } from '@/persistence/workspace/workspaceHandoff'
import { loginRouteFor } from '@/router'

type LiveEntryState =
  | 'evaluating'
  | 'invalid'
  | 'contract-blocked'
  | 'auth-required'
  | 'auth-denied'
  | 'retryable'

const route = useRoute()
const router = useRouter()

const state = ref<LiveEntryState>('evaluating')
const competitionId = ref('')

const title = '实时棋局'

const safeReturn = computed(() => {
  if (competitionId.value) {
    return { name: 'competition-detail', params: { hdid: competitionId.value } }
  }
  return { name: 'competitions' }
})

const explanation = computed(() => {
  if (state.value === 'invalid') {
    return '这个入口缺少有效信息，或已经失效。你可以返回可用页面重新选择。'
  }

  if (state.value === 'auth-required') {
    return '登录后才能继续此操作。当前公开内容和本地教学内容不会被清除。'
  }

  if (state.value === 'auth-denied') {
    return '你的账号无权查看此内容。现有公开内容和本地教学内容保持不变。'
  }

  if (state.value === 'retryable') {
    return '当前内容暂时无法加载。你可以重试，当前选择不会改变。'
  }

  return '这项能力尚未具备已确认的读取合同，当前不会发起请求。'
})

onMounted(() => {
  const rawHdid = route.params.hdid ?? ''
  const safeId = Array.isArray(rawHdid) ? rawHdid[0] : rawHdid

  if (!isSafeWorkspaceIdentifier(safeId)) {
    state.value = 'invalid'
    return
  }

  competitionId.value = typeof safeId === 'string' ? safeId.trim() : String(safeId).trim()

  // 合同优先：实时棋局的局面、订阅、时间和棋钟合同均未确认，直接进入阻断状态。
  // qrcode/sn 在真实合同确认其为非秘密选择字段前不读取、不保存。
  const availability = evaluateLiveSpectatorAvailability()

  if (isCapabilityContractBlocked(availability)) {
    state.value = 'contract-blocked'
    return
  }

  if (isCapabilityAuthRequired(availability)) {
    state.value = 'auth-required'
    return
  }

  if (isCapabilityAvailable(availability)) {
    state.value = 'contract-blocked'
    return
  }

  state.value = 'contract-blocked'
})

function handleLogin(): void {
  router.push(loginRouteFor(route.fullPath, 'required'))
}

function handleReturn(): void {
  router.push(safeReturn.value)
}

function handleRetry(): void {
  state.value = 'evaluating'
  globalThis.setTimeout(() => {
    state.value = 'contract-blocked'
  }, 0)
}

function stateKind(): Exclude<LiveEntryState, 'evaluating'> {
  if (state.value === 'evaluating') return 'contract-blocked'
  return state.value
}

function stateTitle(): string {
  if (state.value === 'invalid') return '无法打开此内容'
  if (state.value === 'auth-required') return '需要登录'
  if (state.value === 'auth-denied') return '没有访问权限'
  if (state.value === 'retryable') return '内容暂时无法打开'
  return title
}
</script>

<template>
  <ProductRouteShell :title="stateTitle()">
    <div class="live-entry-state-surface">
      <ProductUnavailableState
        v-if="state !== 'evaluating'"
        :kind="stateKind()"
        :title="stateTitle()"
        :explanation="explanation"
        :safe-return="safeReturn"
        :retryable="state === 'retryable'"
        @login="handleLogin"
        @return="handleReturn"
        @retry="handleRetry"
      />
    </div>
  </ProductRouteShell>
</template>

<style scoped>
.live-entry-state-surface {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
}
</style>
