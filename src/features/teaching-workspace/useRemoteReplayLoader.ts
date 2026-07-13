import { computed, onBeforeUnmount, ref, watch, type ComputedRef } from 'vue'

import { apiErrorMessage } from '@/api/client'
import { fetchFinishedGameReplay } from '@/api/productApi'
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
  let controller: AbortController | null = null
  let loadedKey = ''

  function abortCurrent(): void {
    controller?.abort()
    controller = null
  }

  watch(
    () => context.value,
    async (value) => {
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
        message.value = '实时传输合同未开放，当前工作区保持只读。'
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
        status.value = 'unavailable'
        message.value = '该回放需要登录后加载。'
        loadedKey = ''
        return
      }

      const key = value.gameId
      if (loadedKey === key && pgn.hasGame) {
        status.value = 'ready'
        message.value = '回放已加载。'
        return
      }

      controller = new AbortController()
      status.value = 'loading'
      message.value = '正在加载生产回放。'

      try {
        const replay = await fetchFinishedGameReplay(key, controller.signal)
        if (controller.signal.aborted) return
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
        if (controller.signal.aborted) return
        status.value = 'error'
        message.value = apiErrorMessage(error)
        loadedKey = ''
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
