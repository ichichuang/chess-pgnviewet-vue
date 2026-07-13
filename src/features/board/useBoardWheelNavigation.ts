import { computed } from 'vue'

import type { BoardWheelNavigationDirection } from './domain/boardCapabilities'
import { BOARD_WHEEL_THROTTLE_MS } from './domain/boardCapabilities'

interface BoardWheelNavigationOptions {
  enabled: () => boolean
  blocked: () => boolean
  emitNavigate: (direction: BoardWheelNavigationDirection) => void
}

export function useBoardWheelNavigation(options: BoardWheelNavigationOptions) {
  let lastWheelAt = 0

  function nowMs(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now()
  }

  function onWheel(event: WheelEvent): void {
    if (!options.enabled()) {
      return
    }

    event.preventDefault()

    if (options.blocked() || Math.abs(event.deltaY) < 1) {
      return
    }

    const now = nowMs()

    if (now - lastWheelAt < BOARD_WHEEL_THROTTLE_MS) {
      return
    }

    lastWheelAt = now
    options.emitNavigate(event.deltaY > 0 ? 'next' : 'previous')
  }

  const wheelBindings = computed(() => (options.enabled() ? { wheel: onWheel } : {}))

  return {
    onWheel,
    wheelBindings,
  }
}
