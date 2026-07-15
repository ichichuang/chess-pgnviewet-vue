import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { useWorkspaceStore } from '@/stores'

const KEYBOARD_STEP_PX = 20

export function useWorkspaceSplitter() {
  const workspace = useWorkspaceStore()
  const rightStackEl = ref<HTMLElement | null>(null)
  let splitterTarget: HTMLElement | null = null
  let splitterPointerId: number | null = null
  let previousBodyCursor = ''
  let previousBodyUserSelect = ''
  let splitterStartValue: number | null = null

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

  function beginSplitterInteraction(): void {
    splitterStartValue = workspace.rightPgnHeightPx
  }

  function restoreSplitterValue(): void {
    if (splitterStartValue != null) {
      workspace.setRightPgnHeightPx(clampRightPgnHeight(splitterStartValue))
    }
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
    splitterStartValue = null
  }

  function cancelSplitterInteraction(): void {
    restoreSplitterValue()
    stopSplitterDrag()
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
    beginSplitterInteraction()
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

  function onSplitterKeyDown(event: KeyboardEvent): void {
    if (!workspace.showAnalysisRegion) {
      return
    }

    const current = workspace.rightPgnHeightPx ?? currentDefaultPgnHeight()
    let next = current
    let handled = false

    switch (event.key) {
      case 'ArrowUp':
      case 'Up':
        next = current + KEYBOARD_STEP_PX
        handled = true
        break
      case 'ArrowDown':
      case 'Down':
        next = current - KEYBOARD_STEP_PX
        handled = true
        break
      case 'Home':
        next = minPgnHeight()
        handled = true
        break
      case 'End':
        next = maxPgnHeight()
        handled = true
        break
      case 'Escape':
        cancelSplitterInteraction()
        handled = true
        break
    }

    if (!handled) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    if (event.key !== 'Escape') {
      if (splitterStartValue == null) {
        beginSplitterInteraction()
      }
      workspace.setRightPgnHeightPx(clampRightPgnHeight(next))
    }
  }

  function currentDefaultPgnHeight(): number {
    const stack = rightStackEl.value
    if (!stack) return 0
    return Math.round(stack.clientHeight * 0.58)
  }

  function minPgnHeight(): number {
    const stack = rightStackEl.value
    if (!stack) return 0
    const available = Math.max(0, stack.clientHeight - splitHandleHeight())
    return Math.min(rightPaneMinHeight(), Math.floor(available / 2))
  }

  function maxPgnHeight(): number {
    const stack = rightStackEl.value
    if (!stack) return 0
    const available = Math.max(0, stack.clientHeight - splitHandleHeight())
    const min = Math.min(rightPaneMinHeight(), Math.floor(available / 2))
    return Math.max(min, available - min)
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
    cancelSplitterInteraction,
    onSplitterKeyDown,
    onSplitterPointerDown,
    rightStackEl,
    rightStackStyle,
  }
}
