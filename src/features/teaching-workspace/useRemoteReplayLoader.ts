import { computed, onBeforeUnmount, ref, watch, type ComputedRef } from 'vue'

import { apiErrorMessage } from '@/api/client'
import { replayRepository } from '@/api/productApi'
import { privateQueryMeta, productQueryKeys, queryClient } from '@/api/queryClient'
import {
  evaluateProtectedReplayAvailability,
  isCapabilityAuthRequired,
  isCapabilityAvailable,
} from '@/features/product-api/domain/capabilityAvailability'
import type { WorkspaceModeContext } from '@/features/workspace-mode/workspaceModeTypes'
import { useAuthStore, usePgnStore } from '@/stores'

type RemoteReplayStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error'

export function useRemoteReplayLoader(context: ComputedRef<WorkspaceModeContext>) {
  const pgn = usePgnStore()
  const auth = useAuthStore()
  const status = ref<RemoteReplayStatus>('idle')
  const message = ref('')
  const detail = ref('')
  const visible = computed(() => status.value !== 'idle')
  let activeQueryKey: ReturnType<typeof productQueryKeys.finishedReplay> | null = null
  let loadedKey = ''

  function abortCurrent(): void {
    if (activeQueryKey) {
      void queryClient.cancelQueries({ queryKey: activeQueryKey, exact: true })
      activeQueryKey = null
    }
  }

  function setUnavailable(text: string): void {
    status.value = 'unavailable'
    message.value = text
    loadedKey = ''
  }

  watch(
    () => [context.value, auth.isAuthenticated] as const,
    async ([value]) => {
      abortCurrent()
      detail.value = ''

      if (
        value.mode === 'analysis' &&
        (value.source === 'backend_handoff_pgn' || value.source === 'cloud_pgn')
      ) {
        setUnavailable('兼容入口已进入工作区，当前未返回可加载棋谱。')
        return
      }

      if (value.mode === 'live_spectator') {
        setUnavailable('实时内容暂不可用，当前工作区保持只读。')
        return
      }

      if (value.mode !== 'replay' || value.source !== 'replay_only') {
        status.value = 'idle'
        message.value = ''
        loadedKey = ''
        return
      }

      if (!value.gameId) {
        setUnavailable('回放入口缺少对局标识。')
        return
      }

      // 合同优先：只有已确认的回放合同才允许进入后续流程。
      const availability = evaluateProtectedReplayAvailability()

      if (!isCapabilityAvailable(availability) && !isCapabilityAuthRequired(availability)) {
        setUnavailable('回放暂不可用，当前不会发起请求。')
        return
      }

      // 即使合同确认后要求登录，也在合同判断之后处理；不会先提示登录再检查合同。
      if (isCapabilityAuthRequired(availability) && !auth.isAuthenticated) {
        pgn.clearPrivateReplay()
        setUnavailable('回放暂不可用，登录后若合同已确认可再次尝试。')
        return
      }

      const key = value.gameId
      if (loadedKey === key && pgn.hasGame) {
        status.value = 'ready'
        message.value = '回放已加载。'
        return
      }

      const queryKey = productQueryKeys.finishedReplay(key)
      activeQueryKey = queryKey
      status.value = 'loading'
      message.value = '正在加载回放。'

      try {
        const replay = await queryClient.fetchQuery({
          queryKey,
          queryFn: ({ signal }) => replayRepository.finishedGame(key, signal),
          meta: privateQueryMeta,
        })
        if (activeQueryKey !== queryKey) return
        const ok = pgn.openText(replay.pgnText, {
          type: 'remote_replay',
          filename: `${replay.gameId}.pgn`,
        })

        if (!ok) {
          status.value = 'error'
          message.value = pgn.lastError ?? '回放无法解析为 PGN。'
          loadedKey = ''
          return
        }

        status.value = 'ready'
        message.value = '回放已加载。'
        detail.value = replay.warnings.join('，')
        loadedKey = key
      } catch (error) {
        if (activeQueryKey !== queryKey) return
        status.value = 'error'
        message.value = apiErrorMessage(error)
        loadedKey = ''
      } finally {
        if (activeQueryKey === queryKey) activeQueryKey = null
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(abortCurrent)

  return {
    detail,
    message,
    status,
    visible,
  }
}
