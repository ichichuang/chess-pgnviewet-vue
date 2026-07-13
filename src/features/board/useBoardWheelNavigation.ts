import { computed } from 'vue'

import type {
  BoardWheelEventConsumption,
  BoardWheelNavigationDirection,
} from './domain/boardCapabilities'

interface BoardWheelNavigationOptions {
  enabled: () => boolean
  blocked: () => boolean
  directions: () => readonly BoardWheelNavigationDirection[]
  threshold: () => number
  throttleMs: () => number
  consume: () => BoardWheelEventConsumption
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

    const consumption = options.consume()

    if (consumption === 'always') event.preventDefault()

    if (options.blocked() || Math.abs(event.deltaY) < options.threshold()) {
      return
    }

    const direction: BoardWheelNavigationDirection = event.deltaY > 0 ? 'next' : 'previous'

    if (!options.directions().includes(direction)) return

    const now = nowMs()

    if (now - lastWheelAt < options.throttleMs()) {
      return
    }

    lastWheelAt = now

    if (consumption === 'handled') event.preventDefault()

    options.emitNavigate(direction)
  }

  const wheelBindings = computed(() => (options.enabled() ? { wheel: onWheel } : {}))

  return {
    onWheel,
    wheelBindings,
  }
}
