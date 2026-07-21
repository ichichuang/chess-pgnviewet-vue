import { onMounted, type Ref } from 'vue'
import { gsap } from 'gsap'

import { motionDuration, motionEase } from './gsapTokens'
import { useGsapScope } from './useGsapScope'

/**
 * Subtle route-content entry: a short opacity-only fade applied once when the
 * route view mounts. There is intentionally no leave animation, so navigation
 * and route completion are never delayed or blocked. The final state is
 * identical under prefers-reduced-motion because motionDuration resolves to 0.
 */
export function useRouteEntryMotion(root: Ref<HTMLElement | null>) {
  const scope = useGsapScope(root)

  onMounted(() => {
    scope.run(() => {
      const element = root.value
      if (!element) return

      gsap.fromTo(
        element,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: motionDuration(element, '--workspace-motion-duration-base'),
          ease: motionEase(element, '--workspace-motion-ease-enter'),
          overwrite: true,
          clearProps: 'opacity,visibility',
        }
      )
    })
  })

  return scope
}
