import { computed, onBeforeUnmount, ref } from 'vue'

import type { BoardRadialCommand } from './domain/boardCapabilities'
import { BOARD_RADIAL_GEOMETRY } from './domain/boardCapabilities'

interface BoardRadialMenuOptions {
  enabled: () => boolean
  isBlocked: () => boolean
  emitCommand: (command: BoardRadialCommand) => void
}

export function useBoardRadialMenu(options: BoardRadialMenuOptions) {
  const mounted = ref(false)
  const open = ref(false)
  const x = ref(0)
  const y = ref(0)
  const pointerX = ref(0)
  const pointerY = ref(0)
  const selectedCommand = ref<BoardRadialCommand | null>(null)
  let suppressContextMenuUntil = 0

  const active = computed(() => mounted.value || open.value)

  function nowMs(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now()
  }

  function updatePointer(clientX: number, clientY: number): void {
    pointerX.value = clientX
    pointerY.value = clientY
  }

  function addWindowListeners(): void {
    if (typeof window === 'undefined') {
      return
    }

    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerup', onWindowUp)
    window.addEventListener('blur', onWindowBlur)
  }

  function removeWindowListeners(): void {
    if (typeof window === 'undefined') {
      return
    }

    window.removeEventListener('pointermove', onWindowMove)
    window.removeEventListener('pointerup', onWindowUp)
    window.removeEventListener('blur', onWindowBlur)
  }

  function openAt(event: PointerEvent | MouseEvent): void {
    if (!options.enabled() || options.isBlocked() || nowMs() < suppressContextMenuUntil) {
      return
    }

    x.value = event.clientX
    y.value = event.clientY
    updatePointer(event.clientX, event.clientY)
    selectedCommand.value = null
    mounted.value = true
    open.value = true
    addWindowListeners()
  }

  function close(commit: boolean): void {
    if (!mounted.value && !open.value) {
      return
    }

    const command = selectedCommand.value

    if (commit && command) {
      options.emitCommand(command)
    }

    open.value = false
    selectedCommand.value = null
    suppressContextMenuUntil = nowMs() + 260
    removeWindowListeners()

    if (typeof window === 'undefined') {
      mounted.value = false
      return
    }

    window.setTimeout(() => {
      if (!open.value) {
        mounted.value = false
      }
    }, 140)
  }

  function onPointerDown(event: PointerEvent): boolean {
    if (!options.enabled() || options.isBlocked() || event.button !== 2) {
      return false
    }

    event.preventDefault()
    event.stopPropagation()
    openAt(event)

    try {
      ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    } catch {
      // Pointer capture is optional in embedded browser contexts.
    }

    return true
  }

  function onPointerMove(event: PointerEvent): boolean {
    if (!open.value) {
      return false
    }

    updatePointer(event.clientX, event.clientY)
    return true
  }

  function onPointerUp(event: PointerEvent): boolean {
    if (!open.value) {
      return false
    }

    updatePointer(event.clientX, event.clientY)
    close(true)

    try {
      ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
    } catch {
      // Pointer capture is optional in embedded browser contexts.
    }

    return true
  }

  function onContextMenu(event: MouseEvent): boolean {
    if (!options.enabled() || options.isBlocked()) {
      return false
    }

    event.preventDefault()

    if (nowMs() < suppressContextMenuUntil) {
      return true
    }

    if (!open.value) {
      openAt(event)
    }

    return true
  }

  function onSelect(command: BoardRadialCommand | null): void {
    selectedCommand.value = command
  }

  function onWindowMove(event: PointerEvent): void {
    if (open.value) {
      updatePointer(event.clientX, event.clientY)
    }
  }

  function onWindowUp(event: PointerEvent): void {
    if (!open.value) {
      return
    }

    updatePointer(event.clientX, event.clientY)
    close(true)
  }

  function onWindowBlur(): void {
    close(false)
  }

  function cleanup(): void {
    removeWindowListeners()
    open.value = false
    mounted.value = false
    selectedCommand.value = null
  }

  onBeforeUnmount(cleanup)

  return {
    active,
    close,
    geometry: BOARD_RADIAL_GEOMETRY,
    mounted,
    onContextMenu,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onSelect,
    open,
    pointerX,
    pointerY,
    x,
    y,
  }
}
