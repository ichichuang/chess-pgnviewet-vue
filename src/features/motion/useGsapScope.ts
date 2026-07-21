import { onBeforeUnmount, type Ref } from 'vue'
import { gsap } from 'gsap'

import { onReducedMotionChange } from './gsapTokens'

/**
 * Component-scoped GSAP ownership for page and adapter motion.
 *
 * The composable owns one gsap.context bound to a local DOM root. All tweens
 * must be created through `run` so they are tracked by the context. Cleanup
 * kills every tween inside the root, clears inline motion styles, and reverts
 * the context on unmount and whenever the reduced-motion preference changes.
 * Motion created here never owns product state; it only observes DOM that Vue
 * has already rendered.
 */
export function useGsapScope(root: Ref<HTMLElement | null>) {
  let context: gsap.Context | null = null

  function scope(): gsap.Context | null {
    if (!root.value) return null
    context ??= gsap.context(() => undefined, root.value)
    return context
  }

  function run(add: () => void): void {
    scope()?.add(add)
  }

  function clearScopeTweens(): void {
    const element = root.value
    const targets = element ? [element, ...element.querySelectorAll('*')] : []
    gsap.killTweensOf(targets)
    gsap.set(targets, { clearProps: 'opacity,transform,visibility' })
  }

  const stopReducedMotionWatch = onReducedMotionChange(clearScopeTweens)

  onBeforeUnmount(() => {
    stopReducedMotionWatch()
    clearScopeTweens()
    context?.revert()
    context = null
  })

  return { clearScopeTweens, run }
}
