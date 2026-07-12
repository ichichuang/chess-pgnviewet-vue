import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { useWorkspaceStore } from '@/stores'

export function useWorkspaceSplitter() {
  const workspace = useWorkspaceStore()
  const rightStackEl = ref<HTMLElement | null>(null)
  let splitterTarget: HTMLElement | null = null
  let splitterPointerId: number | null = null
  let previousBodyCursor = ''
  let previousBodyUserSelect = ''

  const rightStackStyle = computed<Record<string, string>>(() => {
    if (workspace.rightPgnHeightPx == null) {
      return {}
    }

    return { '--workspace-right-pgn-h': `${workspace.rightPgnHeightPx}px` }
  })

  function splitHandleHeight(): number {
    return (
      rightStackEl.value?.querySelector<HTMLElement>('.workspace-splitter')?.getBoundingClientRect()
        .height ?? 0
    )
  }

  function rightPaneMinHeight(): number {
    const stack = rightStackEl.value

    if (!stack) {
      return 0
    }

    const raw = getComputedStyle(stack).getPropertyValue('--workspace-right-pane-min-h')
    const value = Number.parseFloat(raw)

    return Number.isFinite(value) ? value : 0
  }

  function clampRightPgnHeight(value: number): number {
    const stack = rightStackEl.value

    if (!stack) {
      return value
    }

    const available = Math.max(0, stack.clientHeight - splitHandleHeight())
    const min = Math.min(rightPaneMinHeight(), Math.floor(available / 2))
    const max = Math.max(min, available - min)

    return Math.max(min, Math.min(max, value))
  }

  function applyRightStackSplit(clientY: number): void {
    const stack = rightStackEl.value

    if (!stack) {
      return
    }

    const rect = stack.getBoundingClientRect()
    workspace.setRightPgnHeightPx(clampRightPgnHeight(clientY - rect.top))
  }

  function stopSplitterDrag(): void {
    if (!workspace.splitterDragging) {
      return
    }

    workspace.setSplitterDragging(false)
    document.body.classList.remove('workspace-split-dragging')
    document.body.style.cursor = previousBodyCursor
    document.body.style.userSelect = previousBodyUserSelect
    window.removeEventListener('pointermove', onSplitterPointerMove)
    window.removeEventListener('pointerup', onSplitterPointerUp)
    window.removeEventListener('pointercancel', onSplitterPointerUp)

    if (splitterTarget && splitterPointerId != null) {
      splitterTarget.releasePointerCapture?.(splitterPointerId)
    }

    splitterTarget = null
    splitterPointerId = null
  }

  function onSplitterPointerMove(event: PointerEvent): void {
    event.preventDefault()
    event.stopPropagation()
    applyRightStackSplit(event.clientY)
  }

  function onSplitterPointerUp(event: PointerEvent): void {
    event.preventDefault()
    event.stopPropagation()
    stopSplitterDrag()
  }

  function onSplitterPointerDown(event: PointerEvent): void {
    if (!workspace.showAnalysisRegion) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    splitterTarget = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
    splitterPointerId = event.pointerId
    splitterTarget?.setPointerCapture?.(event.pointerId)
    workspace.setSplitterDragging(true)
    document.body.classList.add('workspace-split-dragging')
    previousBodyCursor = document.body.style.cursor
    previousBodyUserSelect = document.body.style.userSelect
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
    applyRightStackSplit(event.clientY)
    window.addEventListener('pointermove', onSplitterPointerMove)
    window.addEventListener('pointerup', onSplitterPointerUp)
    window.addEventListener('pointercancel', onSplitterPointerUp)
  }

  watch(
    () => workspace.showAnalysisRegion,
    (visible) => {
      if (!visible) {
        stopSplitterDrag()
        workspace.setRightPgnHeightPx(null)
        return
      }

      void nextTick(() => {
        if (workspace.rightPgnHeightPx != null) {
          workspace.setRightPgnHeightPx(clampRightPgnHeight(workspace.rightPgnHeightPx))
        }
      })
    },
    { flush: 'post' }
  )

  onBeforeUnmount(() => {
    stopSplitterDrag()
  })

  return {
    onSplitterPointerDown,
    rightStackEl,
    rightStackStyle,
  }
}
