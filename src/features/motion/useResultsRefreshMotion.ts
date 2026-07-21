import { watch, type Ref, type WatchSource } from 'vue'
import { gsap } from 'gsap'

import { motionDuration, motionEase, motionScalar } from './gsapTokens'
import { useGsapScope } from './useGsapScope'

/**
 * Retained-data refresh feedback for result regions (lists, tables, cards).
 *
 * When the watched data identity changes, the region recovers from a readable
 * dip opacity back to full opacity after Vue has rendered the new result.
 * Trusted retained content is never hidden: the dip stays far above zero,
 * only runs after new content is committed to the DOM, and collapses to an
 * instant state change under prefers-reduced-motion.
 */
export function useResultsRefreshMotion(container: Ref<HTMLElement | null>, source: WatchSource) {
  const scope = useGsapScope(container)

  watch(
    source,
    () => {
      const element = container.value
      if (!element) return

      scope.run(() => {
        gsap.killTweensOf(element)
        gsap.fromTo(
          element,
          { autoAlpha: motionScalar(element, '--workspace-motion-refresh-dip-opacity') },
          {
            autoAlpha: 1,
            duration: motionDuration(element, '--workspace-motion-duration-fast'),
            ease: motionEase(element, '--workspace-motion-ease-state'),
            overwrite: true,
            clearProps: 'opacity,visibility',
          }
        )
      })
    },
    { flush: 'post' }
  )

  return scope
}
