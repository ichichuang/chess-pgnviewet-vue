import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'

import { motionDuration, motionEase, motionScalar } from '@/features/motion/gsapTokens'

gsap.registerPlugin(Flip)

interface TeachingWorkspaceMotionOptions {
  boardState: () => string
  leftPanelVisible: () => boolean
  contextOpen: () => boolean
  isNarrow: () => boolean
}

export function useTeachingWorkspaceMotion(options: TeachingWorkspaceMotionOptions) {
  const rootEl = ref<HTMLElement | null>(null)
  const listInnerEl = ref<HTMLElement | null>(null)
  let context: ReturnType<typeof gsap.context> | null = null
  let reducedMotionQuery: MediaQueryList | null = null
  let listFromWidth: number | null = null
  let listWidthTween: gsap.core.Tween | null = null
  let boardFlipState: Flip.FlipState | null = null
  let boardFlipActive: gsap.core.Timeline | null = null

  function layoutEl(): HTMLElement | null {
    return rootEl.value?.querySelector<HTMLElement>('.layout') ?? null
  }

  function boardAreaEl(): HTMLElement | null {
    return rootEl.value?.querySelector<HTMLElement>('.area-board') ?? null
  }

  function panelAreaEl(): HTMLElement | null {
    return rootEl.value?.querySelector<HTMLElement>('.area-panel') ?? null
  }

  function clearListLayoutWidth(): void {
    listWidthTween?.kill()
    listWidthTween = null
    listFromWidth = null
    layoutEl()?.style.removeProperty('--workspace-list-current-w')
  }

  function clearBoardReflow(): void {
    boardFlipActive?.kill()
    boardFlipActive = null
    boardFlipState = null
    const board = boardAreaEl()
    if (board) gsap.set(board, { clearProps: 'width,height,transform' })
  }

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

  function onStatusEnter(element: Element, done: () => void): void {
    if (!(element instanceof HTMLElement) || !context) {
      done()
      return
    }

    context.add(() => {
      gsap.fromTo(
        element,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: motionDuration(rootEl.value, '--workspace-motion-duration-fast'),
          ease: motionEase(rootEl.value, '--workspace-motion-ease-enter'),
          overwrite: true,
          clearProps: 'opacity,visibility',
          onComplete: done,
          onInterrupt: done,
        }
      )
    })
  }

  function onStatusLeave(_element: Element, done: () => void): void {
    done()
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

  async function animateListLayoutWidth(): Promise<void> {
    if (options.isNarrow()) {
      clearListLayoutWidth()
      return
    }

    await nextTick()
    const layout = layoutEl()
    const list = rootEl.value?.querySelector<HTMLElement>('.area-list')
    const fromWidth = listFromWidth
    listFromWidth = null

    if (!layout || !list || !context) return

    listWidthTween?.kill()
    listWidthTween = null
    const toWidth = list.getBoundingClientRect().width
    const duration = motionDuration(rootEl.value, '--workspace-motion-duration-shell')

    if (fromWidth === null || duration === 0 || Math.abs(toWidth - fromWidth) < 0.5) {
      layout.style.removeProperty('--workspace-list-current-w')
      return
    }

    context.add(() => {
      listWidthTween = gsap.fromTo(
        layout,
        { '--workspace-list-current-w': `${fromWidth}px` },
        {
          '--workspace-list-current-w': `${toWidth}px`,
          duration,
          ease: motionEase(rootEl.value, '--workspace-motion-ease-state'),
          overwrite: true,
          onComplete: () => {
            layout.style.removeProperty('--workspace-list-current-w')
            listWidthTween = null
          },
        }
      )
    })
  }

  function onStageEnter(element: Element, done: () => void): void {
    if (!(element instanceof HTMLElement) || !context) {
      done()
      return
    }

    context.add(() => {
      gsap.fromTo(
        element,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: motionDuration(rootEl.value, '--workspace-motion-duration-base'),
          ease: motionEase(rootEl.value, '--workspace-motion-ease-enter'),
          overwrite: true,
          clearProps: 'opacity,visibility',
          onComplete: done,
          onInterrupt: done,
        }
      )
    })
  }

  function onStageLeave(_element: Element, done: () => void): void {
    done()
  }

  function clearWorkspaceTweens(): void {
    const targets = rootEl.value ? [rootEl.value, ...rootEl.value.querySelectorAll('*')] : []
    gsap.killTweensOf(targets)
    gsap.set(targets, { clearProps: 'opacity,transform,visibility' })
    clearListLayoutWidth()
    clearBoardReflow()
  }

  async function animateContextReflow(open: boolean): Promise<void> {
    if (!options.isNarrow()) return

    await nextTick()
    const board = boardAreaEl()
    const panel = panelAreaEl()
    const state = boardFlipState
    boardFlipState = null

    if (!board || !context) return

    boardFlipActive?.kill()
    boardFlipActive = null
    gsap.set(board, { clearProps: 'width,height,transform' })

    if (state) {
      context.add(() => {
        boardFlipActive = Flip.from(state, {
          targets: board,
          scale: false,
          props: 'width,height',
          duration: motionDuration(rootEl.value, '--workspace-motion-duration-shell'),
          ease: motionEase(rootEl.value, '--workspace-motion-ease-state'),
          overwrite: true,
        })
      })
    }

    if (!panel) return

    gsap.killTweensOf(panel)

    if (!open) {
      gsap.set(panel, { clearProps: 'opacity,transform,visibility' })
      return
    }

    context.add(() => {
      gsap.fromTo(
        panel,
        { autoAlpha: 0, y: motionScalar(rootEl.value, '--workspace-motion-distance-panel') },
        {
          autoAlpha: 1,
          y: 0,
          duration: motionDuration(rootEl.value, '--workspace-motion-duration-panel'),
          ease: motionEase(rootEl.value, '--workspace-motion-ease-enter'),
          overwrite: true,
          clearProps: 'opacity,transform,visibility',
        }
      )
    })
  }

  watch(options.boardState, () => void animateBoardState(), { flush: 'post' })
  watch(
    options.leftPanelVisible,
    () => {
      if (options.isNarrow()) {
        listFromWidth = null
        return
      }
      const list = rootEl.value?.querySelector<HTMLElement>('.area-list')
      listFromWidth = list ? list.getBoundingClientRect().width : null
    },
    { flush: 'pre' }
  )
  watch(
    options.leftPanelVisible,
    (visible) => {
      void animateListLayoutWidth()
      void animateListVisibility(visible)
    },
    { flush: 'post' }
  )
  watch(
    options.contextOpen,
    () => {
      if (!options.isNarrow()) {
        boardFlipState = null
        return
      }
      const board = boardAreaEl()
      boardFlipState = board ? Flip.getState(board) : null
    },
    { flush: 'pre' }
  )
  watch(options.contextOpen, (open) => void animateContextReflow(open), { flush: 'post' })
  watch(options.isNarrow, () => {
    clearListLayoutWidth()
    clearBoardReflow()
    const panel = panelAreaEl()
    if (panel) {
      gsap.killTweensOf(panel)
      gsap.set(panel, { clearProps: 'opacity,transform,visibility' })
    }
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
    onStageEnter,
    onStageLeave,
    onStatusEnter,
    onStatusLeave,
    rootEl,
  }
}
