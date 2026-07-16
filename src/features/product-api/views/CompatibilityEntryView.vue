<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  evaluateCapabilityAvailability,
  isCapabilityAuthRequired,
  isCapabilityAvailable,
  isCapabilityContractBlocked,
  type BlockedCapabilityFamily,
} from '@/features/product-api/domain/capabilityAvailability'
import { useProductFeedback } from '@/app/providers/productFeedback'
import { ProductRouteShell, ProductUnavailableState } from '@/ui'
import { isSafeWorkspaceIdentifier } from '@/persistence/workspace/workspaceHandoff'

type EntryState =
  | 'evaluating'
  | 'invalid'
  | 'contract-blocked'
  | 'auth-required'
  | 'auth-denied'
  | 'retryable'

interface EntryDefinition {
  title: string
  resourceName: string
  mode: 'replay' | 'analysis'
  source: 'replay_only' | 'cloud_pgn' | 'backend_handoff_pgn'
  family: BlockedCapabilityFamily
}

const route = useRoute()
const router = useRouter()
const productFeedback = useProductFeedback()

const state = ref<EntryState>('evaluating')
const identifier = ref('')

const definition = computed<EntryDefinition>(() => {
  const name = String(route.name ?? '')

  if (name === 'match') {
    return {
      title: '棋局回放',
      resourceName: '回放',
      mode: 'replay',
      source: 'replay_only',
      family: 'protected_replay',
    }
  }

  if (name === 'share') {
    return {
      title: '分享内容',
      resourceName: '分享内容',
      mode: 'analysis',
      source: 'backend_handoff_pgn',
      family: 'share_content',
    }
  }

  return {
    title: '云端棋谱',
    resourceName: '云端棋谱',
    mode: 'analysis',
    source: 'cloud_pgn',
    family: 'cloud_content',
  }
})

const safeReturn = computed(() => ({ name: 'competitions' }))

const explanation = computed(() => {
  if (state.value === 'invalid') {
    if (route.name === 'share') {
      return '这个分享链接缺少有效信息或已经失效。'
    }
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
  const rawIdentifier =
    route.params.key ?? route.params.uuid ?? route.params.fileid ?? ''
  const safeId = Array.isArray(rawIdentifier) ? rawIdentifier[0] : rawIdentifier

  if (!isSafeWorkspaceIdentifier(safeId)) {
    state.value = 'invalid'
    return
  }

  identifier.value = typeof safeId === 'string' ? safeId.trim() : String(safeId).trim()

  // 合同优先：当前回放、分享、云端读取合同均未闭合，直接进入阻断状态。
  // 未来合同确认后，在此处按 family 校验会话与权限，再决定是否生成交接。
  const availability = evaluateCapabilityAvailability(definition.value.family)

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
  productFeedback.showLoginRequired({ returnPath: route.fullPath })
}

function handleReturn(): void {
  router.push(safeReturn.value)
}

function handleRetry(): void {
  // 当前无可重试的真实合同；保留入口以支持未来真实可重试场景。
  state.value = 'evaluating'
  globalThis.setTimeout(() => {
    state.value = 'contract-blocked'
  }, 0)
}

function stateKind(): Exclude<EntryState, 'evaluating'> {
  if (state.value === 'evaluating') return 'contract-blocked'
  return state.value
}

function stateTitle(): string {
  if (state.value === 'invalid') {
    return route.name === 'share' ? '分享链接无效' : '无法打开此内容'
  }

  if (state.value === 'auth-required') return '需要登录'
  if (state.value === 'auth-denied') return '没有访问权限'
  if (state.value === 'retryable') return '内容暂时无法打开'
  return definition.value.title
}
</script>

<template>
  <ProductRouteShell :title="stateTitle()">
    <div class="entry-state-surface">
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
.entry-state-surface {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
}
</style>
