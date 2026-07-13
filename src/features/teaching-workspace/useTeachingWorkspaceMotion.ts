import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'

import { motionDuration, motionEase, motionScalar } from '@/features/motion/gsapTokens'

interface TeachingWorkspaceMotionOptions {
  boardState: () => string
  leftPanelVisible: () => boolean
}

export function useTeachingWorkspaceMotion(options: TeachingWorkspaceMotionOptions) {
  const rootEl = ref<HTMLElement | null>(null)
  const listInnerEl = ref<HTMLElement | null>(null)
  let context: ReturnType<typeof gsap.context> | null = null
  let reducedMotionQuery: MediaQueryList | null = null

  function onPanelEnter(element: Element, done: () => void): void {
    animateEnter(element, done, '--workspace-motion-duration-panel')
  }

  function onPanelLeave(element: Element, done: () => void): void {
    animateLeave(element, done, '--workspace-motion-duration-fast')
  }

  function onOverlayEnter(element: Element, done: () => void): void {
    if (!(element instanceof HTMLElement) || !context) {
      done()
      return
    }

    const card = element.querySelector<HTMLElement>('.drop-card')
    context.add(() => {
      gsap.fromTo(
        element,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: motionDuration(rootEl.value, '--workspace-motion-duration-panel'),
          ease: motionEase(rootEl.value, '--workspace-motion-ease-enter'),
          overwrite: true,
        }
      )

      if (!card) {
        done()
        return
      }

      gsap.fromTo(
        card,
        { autoAlpha: 0, scale: motionScalar(rootEl.value, '--workspace-motion-overlay-scale') },
        {
          autoAlpha: 1,
          scale: 1,
          duration: motionDuration(rootEl.value, '--workspace-motion-duration-panel'),
          ease: motionEase(rootEl.value, '--workspace-motion-ease-enter'),
          overwrite: true,
          clearProps: 'opacity,transform,visibility',
          onComplete: done,
        }
      )
    })
  }

  function onOverlayLeave(element: Element, done: () => void): void {
    animateLeave(element, done, '--workspace-motion-duration-fast')
  }

  function animateEnter(element: Element, done: () => void, durationToken: string): void {
    if (!(element instanceof HTMLElement) || !context) {
      done()
      return
    }

    context.add(() => {
      gsap.fromTo(
        element,
        {
          autoAlpha: 0,
          y: motionScalar(rootEl.value, '--workspace-motion-distance-panel'),
        },
        {
          autoAlpha: 1,
          y: 0,
          duration: motionDuration(rootEl.value, durationToken),
          ease: motionEase(rootEl.value, '--workspace-motion-ease-enter'),
          overwrite: true,
          clearProps: 'opacity,transform,visibility',
          onComplete: done,
        }
      )
    })
  }

  function animateLeave(element: Element, done: () => void, durationToken: string): void {
    if (!(element instanceof HTMLElement) || !context) {
      done()
      return
    }

    context.add(() => {
      gsap.to(element, {
        autoAlpha: 0,
        y: motionScalar(rootEl.value, '--workspace-motion-distance-panel'),
        duration: motionDuration(rootEl.value, durationToken),
        ease: motionEase(rootEl.value, '--workspace-motion-ease-state'),
        overwrite: true,
        onComplete: done,
      })
    })
  }

  async function animateBoardState(): Promise<void> {
    await nextTick()
    const board = rootEl.value?.querySelector<HTMLElement>('.board-align-frame')

    if (!board || !context) return

    gsap.killTweensOf(board)
    context.add(() => {
      gsap.fromTo(
        board,
        { autoAlpha: 0.82, scale: motionScalar(rootEl.value, '--workspace-motion-board-scale') },
        {
          autoAlpha: 1,
          scale: 1,
          duration: motionDuration(rootEl.value, '--workspace-motion-duration-panel'),
          ease: motionEase(rootEl.value, '--workspace-motion-ease-state'),
          overwrite: true,
          clearProps: 'opacity,transform,visibility',
        }
      )
    })
  }

  async function animateListVisibility(visible: boolean): Promise<void> {
    await nextTick()
    const list = listInnerEl.value

    if (!list || !visible || !context) return

    gsap.killTweensOf(list)
    context.add(() => {
      gsap.fromTo(
        list,
        { autoAlpha: 0, x: -motionScalar(rootEl.value, '--workspace-motion-distance-panel') },
        {
          autoAlpha: 1,
          x: 0,
          duration: motionDuration(rootEl.value, '--workspace-motion-duration-panel'),
          ease: motionEase(rootEl.value, '--workspace-motion-ease-enter'),
          overwrite: true,
          clearProps: 'opacity,transform,visibility',
        }
      )
    })
  }

  function clearWorkspaceTweens(): void {
    const targets = rootEl.value ? [rootEl.value, ...rootEl.value.querySelectorAll('*')] : []
    gsap.killTweensOf(targets)
    gsap.set(targets, { clearProps: 'opacity,transform,visibility' })
  }

  watch(options.boardState, () => void animateBoardState(), { flush: 'post' })
  watch(options.leftPanelVisible, (visible) => void animateListVisibility(visible), {
    flush: 'post',
  })

  onMounted(() => {
    const root = rootEl.value

    if (!root) return

    context = gsap.context(() => undefined, root)
    const regions = Array.from(
      root.querySelectorAll<HTMLElement>('.area-eval, .area-list, .area-board, .area-panel')
    )

    context.add(() => {
      gsap.fromTo(
        regions,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: motionDuration(root, '--workspace-motion-duration-shell'),
          ease: motionEase(root, '--workspace-motion-ease-enter'),
          stagger: motionDuration(root, '--workspace-motion-stagger-panel'),
          overwrite: true,
          clearProps: 'opacity,visibility',
        }
      )
    })

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      reducedMotionQuery.addEventListener('change', clearWorkspaceTweens)
    }
  })

  onBeforeUnmount(() => {
    reducedMotionQuery?.removeEventListener('change', clearWorkspaceTweens)
    reducedMotionQuery = null
    clearWorkspaceTweens()
    context?.revert()
    context = null
  })

  return {
    listInnerEl,
    onOverlayEnter,
    onOverlayLeave,
    onPanelEnter,
    onPanelLeave,
    rootEl,
  }
}
