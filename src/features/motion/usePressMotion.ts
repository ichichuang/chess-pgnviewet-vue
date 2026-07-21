import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import { gsap } from 'gsap'

import { motionDuration, motionEase, motionScalar, prefersReducedMotion } from './gsapTokens'

/**
 * Restrained press feedback for interactive controls: a quick transform-only
 * scale dip on pointer press and keyboard activation, always returning to the
 * exact resting state. Purely presentational — it never consumes or changes
 * click, keyboard, disabled, or busy semantics. Under prefers-reduced-motion
 * the feedback is skipped entirely.
 */
export function usePressMotion(target: Ref<HTMLElement | null>, isInteractive: () => boolean) {
  let pressed = false

  function element(): HTMLElement | null {
    return target.value
  }

  function pressDuration(el: HTMLElement): number {
    return motionDuration(el, '--workspace-motion-duration-fast')
  }

  function animatePress(): void {
    const el = element()
    if (!el || prefersReducedMotion()) return
    gsap.to(el, {
      scale: motionScalar(el, '--workspace-motion-press-scale'),
      duration: pressDuration(el),
      ease: motionEase(el, '--workspace-motion-ease-state'),
      overwrite: true,
    })
  }

  function animateRelease(): void {
    const el = element()
    if (!el) return
    gsap.to(el, {
      scale: 1,
      duration: pressDuration(el),
      ease: motionEase(el, '--workspace-motion-ease-state'),
      overwrite: true,
      clearProps: 'transform',
    })
  }

  function onPointerDown(): void {
    if (!isInteractive()) return
    pressed = true
    animatePress()
  }

  function onPointerRelease(): void {
    if (!pressed) return
    pressed = false
    animateRelease()
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return
    if (!isInteractive()) return
    pressed = true
    animatePress()
  }

  function onKeyUp(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return
    onPointerRelease()
  }

  function cleanup(): void {
    const el = element()
    if (el) {
      gsap.killTweensOf(el)
      gsap.set(el, { clearProps: 'transform' })
    }
  }

  onMounted(() => {
    const el = element()
    if (!el) return
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointerup', onPointerRelease)
    el.addEventListener('pointercancel', onPointerRelease)
    el.addEventListener('pointerleave', onPointerRelease)
    el.addEventListener('keydown', onKeyDown)
    el.addEventListener('keyup', onKeyUp)
  })

  onBeforeUnmount(() => {
    const el = element()
    if (el) {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointerup', onPointerRelease)
      el.removeEventListener('pointercancel', onPointerRelease)
      el.removeEventListener('pointerleave', onPointerRelease)
      el.removeEventListener('keydown', onKeyDown)
      el.removeEventListener('keyup', onKeyUp)
    }
    pressed = false
    cleanup()
  })
}
