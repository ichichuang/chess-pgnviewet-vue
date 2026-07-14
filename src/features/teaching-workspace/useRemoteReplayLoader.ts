import { computed, onBeforeUnmount, ref, watch, type ComputedRef } from 'vue'

import { apiErrorMessage } from '@/api/client'
import { replayRepository } from '@/api/productApi'
import { privateQueryMeta, productQueryKeys, queryClient } from '@/api/queryClient'
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

  watch(
    () => [context.value, auth.isAuthenticated] as const,
    async ([value]) => {
      abortCurrent()
      detail.value = ''

      if (
        value.mode === 'analysis' &&
        (value.source === 'backend_handoff_pgn' || value.source === 'cloud_pgn')
      ) {
        status.value = 'unavailable'
        message.value = '兼容入口已进入工作区，当前未返回可加载棋谱。'
        loadedKey = ''
        return
      }

      if (value.mode === 'live_spectator') {
        status.value = 'unavailable'
        message.value = '实时内容暂不可用，当前工作区保持只读。'
        loadedKey = ''
        return
      }

      if (value.mode !== 'replay' || value.source !== 'replay_only') {
        status.value = 'idle'
        message.value = ''
        loadedKey = ''
        return
      }

      if (!value.gameId) {
        status.value = 'unavailable'
        message.value = '回放入口缺少对局标识。'
        loadedKey = ''
        return
      }

      if (!auth.isAuthenticated) {
        pgn.clearPrivateReplay()
        status.value = 'unavailable'
        message.value = '请先登录后打开回放。'
        loadedKey = ''
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
      message.value = '正在加载生产回放。'

      try {
        const replay = await queryClient.fetchQuery({
          queryKey,
          queryFn: ({ signal }) => replayRepository.finishedGame(key, signal),
          meta: privateQueryMeta,
        })
        if (activeQueryKey !== queryKey) return
        const ok = pgn.openText(replay.pgnText, {
          type: 'production_api',
          filename: `${replay.gameId}.pgn`,
        })

        if (!ok) {
          status.value = 'error'
          message.value = pgn.lastError ?? '生产回放无法解析为 PGN。'
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
