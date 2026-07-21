import { onBeforeUnmount, type Ref } from 'vue'
import { gsap } from 'gsap'

import { motionDuration, motionEase } from './gsapTokens'

/**
 * Shared enter hook for <Transition :css="false"> state surfaces (loading,
 * empty, error, banner, unavailable). Enter is a short opacity-only fade;
 * leave is intentionally instant so state removal never delays the commit of
 * the next state. `done` is always called, including when the tween is
 * interrupted or killed on unmount, so Vue transition bookkeeping never
 * stalls. Motion observes state Vue already committed; it never owns it.
 */
export function createStateEnterHook(owner: Ref<HTMLElement | null>) {
  const activeTweens = new Set<gsap.core.Tween>()

  onBeforeUnmount(() => {
    for (const tween of activeTweens) tween.kill()
    activeTweens.clear()
  })

  return function onStateEnter(element: Element, done: () => void): void {
    if (!(element instanceof HTMLElement)) {
      done()
      return
    }

    const host = owner.value ?? element
    const tween = gsap.fromTo(
      element,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: motionDuration(host, '--workspace-motion-duration-fast'),
        ease: motionEase(host, '--workspace-motion-ease-enter'),
        overwrite: true,
        clearProps: 'opacity,visibility',
        onComplete: release,
        onInterrupt: release,
      }
    )

    function release(): void {
      activeTweens.delete(tween)
      done()
    }

    activeTweens.add(tween)
  }
}

export function completeLeaveImmediately(_element: Element, done: () => void): void {
  done()
}
