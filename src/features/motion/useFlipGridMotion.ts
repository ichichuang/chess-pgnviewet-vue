import { onBeforeUnmount, nextTick, watch, type Ref, type WatchSource } from 'vue'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'

import { motionDuration, motionEase } from './gsapTokens'
import { useGsapScope } from './useGsapScope'

gsap.registerPlugin(Flip)

/**
 * GSAP Flip motion for a genuine grid reflow: when the watched order identity
 * changes (venue-display pairing set added, removed, or re-flowed into a new
 * column/row geometry), existing tiles transition from their previous
 * geometry to the new committed geometry with transforms only. Entering tiles
 * fade in; leaving tiles fade out. Source order, final equal geometry, and
 * board content are owned entirely by Vue and the layout composable — Flip
 * only observes committed layouts. Under prefers-reduced-motion the duration
 * resolves to 0 and tiles jump straight to the true final geometry.
 */
export function useFlipGridMotion(
  grid: Ref<HTMLElement | null>,
  itemSelector: string,
  order: WatchSource
) {
  const scope = useGsapScope(grid)
  let captured: Flip.FlipState | null = null
  let active: gsap.core.Timeline | null = null

  // Capture pre-update geometry before Vue renders the new layout.
  watch(
    order,
    () => {
      const element = grid.value
      const items = element?.querySelectorAll(itemSelector)
      captured = element && items && items.length > 0 ? Flip.getState(items) : null
    },
    { flush: 'pre' }
  )

  // Play the reflow after Vue has committed the new layout.
  watch(
    order,
    () => {
      void nextTick(() => {
        const element = grid.value
        const state = captured
        captured = null
        if (!element || !state) return

        const targets = element.querySelectorAll(itemSelector)
        if (targets.length === 0) return

        active?.kill()
        scope.run(() => {
          active = Flip.from(state, {
            targets,
            duration: motionDuration(element, '--workspace-motion-duration-panel'),
            ease: motionEase(element, '--workspace-motion-ease-state'),
            scale: false,
            onEnter: (entering) =>
              gsap.fromTo(
                entering,
                { autoAlpha: 0 },
                {
                  autoAlpha: 1,
                  duration: motionDuration(element, '--workspace-motion-duration-fast'),
                  ease: motionEase(element, '--workspace-motion-ease-enter'),
                  overwrite: true,
                  clearProps: 'opacity,visibility',
                }
              ),
            onLeave: (leaving) =>
              gsap.to(leaving, {
                autoAlpha: 0,
                duration: motionDuration(element, '--workspace-motion-duration-fast'),
                ease: motionEase(element, '--workspace-motion-ease-state'),
                overwrite: true,
              }),
          })
        })
      })
    },
    { flush: 'post' }
  )

  onBeforeUnmount(() => {
    active?.kill()
    active = null
    captured = null
  })

  return scope
}
