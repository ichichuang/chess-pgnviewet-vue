import { nextTick, ref } from 'vue'

import { useProductFeedback } from '@/app/providers/productFeedback'
import type { WorkspaceEditIdentity } from '@/stores/pgn'
import { usePgnStore } from '@/stores'
import type { ProductOverlayReturnFocus } from '@/ui/productOverlayFocus'

type WorkspaceDestructiveIntent =
  | 'annotation-clear'
  | 'local-copy-replacement'
  | 'manual-draft-clear'
  | 'manual-draft-close'
  | 'manual-draft-reset'
  | 'route-handoff'
  | 'route-leave'
  | 'source-replacement'

interface WorkspaceDestructiveAction<T> {
  intent: WorkspaceDestructiveIntent
  expectedIdentity: WorkspaceEditIdentity
  confirm: boolean
  execute: () => T | Promise<T>
  returnFocus?: ProductOverlayReturnFocus
}

interface ConfirmationCopy {
  title: string
  description: string
  confirmText: string
  cancelText: string
}

const confirmationCopy: Record<WorkspaceDestructiveIntent, ConfirmationCopy> = {
  'annotation-clear': {
    title: '清除当前节点的标注？',
    description: '当前节点上的箭头、方格和高亮将被清除。原棋谱和其他节点不会改变。',
    confirmText: '清除标注',
    cancelText: '保留标注',
  },
  'local-copy-replacement': {
    title: '放弃尚未保存的更改？',
    description: '当前本地更改尚未保存。继续后，这些更改将不会保留。',
    confirmText: '放弃更改并继续',
    cancelText: '继续编辑',
  },
  'manual-draft-clear': {
    title: '清空当前局面？',
    description: '当前摆放和局面属性将被清空。',
    confirmText: '放弃更改并清空',
    cancelText: '继续摆谱',
  },
  'manual-draft-close': {
    title: '放弃未应用的局面？',
    description: '当前摆放和局面属性尚未应用。离开后这些更改不会保留。',
    confirmText: '放弃更改',
    cancelText: '继续摆谱',
  },
  'manual-draft-reset': {
    title: '重置当前局面？',
    description: '当前摆放和局面属性将恢复为标准初始局面。',
    confirmText: '放弃更改并重置',
    cancelText: '继续摆谱',
  },
  'route-handoff': {
    title: '放弃尚未保存的更改？',
    description: '当前本地更改尚未保存。继续后，这些更改将不会保留。',
    confirmText: '放弃更改并继续',
    cancelText: '继续编辑',
  },
  'route-leave': {
    title: '放弃尚未保存的更改？',
    description: '当前本地更改尚未保存。离开后，这些更改将不会保留。',
    confirmText: '放弃更改并继续',
    cancelText: '继续编辑',
  },
  'source-replacement': {
    title: '放弃尚未保存的更改？',
    description: '打开新的棋谱后，当前本地更改将不会保留。',
    confirmText: '放弃更改并继续',
    cancelText: '继续编辑',
  },
}

export function useWorkspaceDestructiveActionCoordinator() {
  const pgn = usePgnStore()
  const feedback = useProductFeedback()
  const inFlight = ref(false)

  async function restoreCancelledActionFocus(
    returnFocus: ProductOverlayReturnFocus | undefined
  ): Promise<void> {
    if (!returnFocus) return

    // Let the nested ProductDialog return to its parent overlay first, then
    // restore the exact connected action control captured by the workspace.
    await nextTick()
    await nextTick()
    const target = returnFocus()
    if (target instanceof HTMLElement && target.isConnected) {
      target.focus({ preventScroll: true })
    }
  }

  async function run<T>(action: WorkspaceDestructiveAction<T>): Promise<boolean> {
    if (inFlight.value || !pgn.matchesWorkspaceEditIdentity(action.expectedIdentity)) {
      return false
    }

    inFlight.value = true

    try {
      if (action.confirm) {
        const copy = confirmationCopy[action.intent]
        const accepted = await feedback.requestConfirmation({
          ...copy,
          dangerous: true,
          ...(action.returnFocus ? { returnFocus: action.returnFocus } : {}),
        })

        if (!accepted || !pgn.matchesWorkspaceEditIdentity(action.expectedIdentity)) {
          await restoreCancelledActionFocus(action.returnFocus)
          return false
        }
      }

      if (!pgn.matchesWorkspaceEditIdentity(action.expectedIdentity)) {
        await restoreCancelledActionFocus(action.returnFocus)
        return false
      }

      const result = await action.execute()
      if (result === false) {
        await restoreCancelledActionFocus(action.returnFocus)
        return false
      }
      return true
    } finally {
      inFlight.value = false
    }
  }

  return {
    inFlight,
    run,
  }
}
