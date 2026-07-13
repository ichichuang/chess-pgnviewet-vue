import { nextTick, onBeforeUnmount, onMounted, watch, type ComputedRef, type Ref } from 'vue'
import { gsap } from 'gsap'

import { motionDuration, motionEase } from '@/features/motion/gsapTokens'

interface BoardOverlayAnimationOptions {
  svg: Ref<SVGSVGElement | null>
  signature: ComputedRef<string>
}

const OVERLAY_SELECTOR = [
  '.annotation-highlight',
  '.annotation-square',
  '.annotation-arrow-shaft',
  '.annotation-arrow-head',
  '.selected-ring',
  '.focused-ring',
  '.move-dot',
  '.move-ring',
  '.move-ring-outline',
  '.state-overlay:not(.hover)',
].join(',')

export function useBoardOverlayAnimation(options: BoardOverlayAnimationOptions): void {
  let context: ReturnType<typeof gsap.context> | null = null

  async function animate(): Promise<void> {
    await nextTick()
    const svg = options.svg.value

    if (!svg || !context) return

    const targets = Array.from(svg.querySelectorAll<SVGElement>(OVERLAY_SELECTOR))
    const duration = motionDuration(svg, '--board-motion-duration-overlay')
    gsap.killTweensOf(targets)

    if (duration === 0) {
      gsap.set(targets, { clearProps: 'opacity,transform' })
      return
    }

    context.add(() => {
      gsap.fromTo(
        targets,
        { autoAlpha: 0.35, scale: 0.94 },
        {
          autoAlpha: 1,
          scale: 1,
          duration,
          ease: motionEase(svg, '--board-motion-ease-overlay'),
          stagger: motionDuration(svg, '--board-motion-stagger-overlay'),
          overwrite: true,
          clearProps: 'opacity,transform',
        }
      )
    })
  }

  watch(options.signature, animate)

  onMounted(() => {
    const svg = options.svg.value

    if (svg) context = gsap.context(() => undefined, svg)
  })

  onBeforeUnmount(() => {
    const svg = options.svg.value
    const targets = svg ? Array.from(svg.querySelectorAll<SVGElement>(OVERLAY_SELECTOR)) : []
    gsap.killTweensOf(targets)
    gsap.set(targets, { clearProps: 'opacity,transform' })
    context?.revert()
    context = null
  })
}
