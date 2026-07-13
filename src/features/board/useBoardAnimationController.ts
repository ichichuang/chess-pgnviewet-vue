import { nextTick, onBeforeUnmount, type ComputedRef, type Ref } from 'vue'
import { gsap } from 'gsap'

import { squareCenter, squareToDisplay } from './domain/boardGeometry'
import type { BoardOrientation } from './domain/boardTypes'
import { detectMoves } from './domain/moveDiff'

interface BoardAnimationControllerOptions {
  svg: Ref<SVGSVGElement | null>
  ghostEl: Ref<HTMLImageElement | null>
  squarePx: Ref<number>
  orientation: ComputedRef<BoardOrientation>
  moveEnabled: ComputedRef<boolean>
  snapbackEnabled: ComputedRef<boolean>
  clearMoveDrag: () => void
}

const TOKEN_MOVE_DURATION = '--board-motion-duration-move'
const TOKEN_SNAPBACK_DURATION = '--board-motion-duration-snapback'
const TOKEN_DRAG_SETTLE_DURATION = '--board-motion-duration-drag-settle'
const TOKEN_PIECE_SETTLE_DURATION = '--board-motion-duration-piece-settle'
const TOKEN_MOVE_EASE = '--board-motion-ease-move'
const TOKEN_SNAPBACK_EASE = '--board-motion-ease-snapback'
const TOKEN_DRAG_SETTLE_EASE = '--board-motion-ease-drag-settle'
const TOKEN_PIECE_SETTLE_EASE = '--board-motion-ease-piece-settle'

export function useBoardAnimationController(options: BoardAnimationControllerOptions) {
  function motionDisabled(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  }

  function tokenValue(name: string): string {
    if (typeof window === 'undefined') {
      return ''
    }

    return window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  }

  function duration(name: string): number {
    if (motionDisabled()) {
      return 0
    }

    const value = tokenValue(name)

    if (value.endsWith('ms')) {
      return Number.parseFloat(value) / 1000
    }

    return Number.parseFloat(value) || 0
  }

  function ease(name: string): string {
    return tokenValue(name) || 'none'
  }

  function squareCenterPx(square: string): { x: number; y: number } | null {
    const center = squareCenter(square, options.orientation.value)

    if (!center) {
      return null
    }

    const rect = options.svg.value?.getBoundingClientRect()

    if (!rect) {
      return null
    }

    return {
      x: rect.left + center[0] * options.squarePx.value,
      y: rect.top + center[1] * options.squarePx.value,
    }
  }

  function killBoardTweens(): void {
    const svg = options.svg.value

    if (svg) {
      gsap.killTweensOf(Array.from(svg.querySelectorAll('image[data-square]')))
    }

    if (options.ghostEl.value) {
      gsap.killTweensOf(options.ghostEl.value)
    }
  }

  async function animateFenChange(
    prevFen: string,
    nextFen: string,
    suppress: boolean
  ): Promise<void> {
    if (!options.moveEnabled.value || suppress) {
      killBoardTweens()
      return
    }

    const moves = detectMoves(prevFen, nextFen)

    if (!moves) {
      killBoardTweens()
      return
    }

    await nextTick()
    const svg = options.svg.value

    if (!svg) {
      return
    }

    for (const move of moves) {
      const el = svg.querySelector<SVGImageElement>(`image[data-square="${move.to}"]`)
      const from = squareToDisplay(move.from, options.orientation.value)
      const to = squareToDisplay(move.to, options.orientation.value)

      if (!el || !from || !to) {
        continue
      }

      gsap.killTweensOf(el)
      gsap.fromTo(
        el,
        { attr: { x: from[1], y: from[0] } },
        {
          attr: { x: to[1], y: to[0] },
          duration: duration(TOKEN_MOVE_DURATION),
          ease: ease(TOKEN_MOVE_EASE),
          overwrite: true,
        }
      )
    }
  }

  async function settlePiece(square: string): Promise<void> {
    if (!options.moveEnabled.value) {
      return
    }

    await nextTick()
    const el =
      options.svg.value?.querySelector<SVGImageElement>(`image[data-square="${square}"]`) ?? null

    if (!el) {
      return
    }

    gsap.killTweensOf(el)
    gsap.fromTo(
      el,
      { opacity: 0 },
      {
        opacity: 1,
        duration: duration(TOKEN_PIECE_SETTLE_DURATION),
        ease: ease(TOKEN_PIECE_SETTLE_EASE),
        clearProps: 'opacity',
        overwrite: true,
      }
    )
  }

  function snapBackGhost(from: string): void {
    const el = options.ghostEl.value
    const center = squareCenterPx(from)

    if (!options.snapbackEnabled.value || !el || !center) {
      options.clearMoveDrag()
      return
    }

    gsap.killTweensOf(el)
    gsap.to(el, {
      left: center.x,
      top: center.y,
      duration: duration(TOKEN_SNAPBACK_DURATION),
      ease: ease(TOKEN_SNAPBACK_EASE),
      overwrite: true,
      onComplete: options.clearMoveDrag,
    })
  }

  function settleGhostTo(to: string, onComplete: () => void): void {
    const el = options.ghostEl.value
    const center = squareCenterPx(to)

    if (!options.moveEnabled.value || !el || !center) {
      onComplete()
      return
    }

    gsap.killTweensOf(el)
    gsap.to(el, {
      left: center.x,
      top: center.y,
      opacity: 0,
      duration: duration(TOKEN_DRAG_SETTLE_DURATION),
      ease: ease(TOKEN_DRAG_SETTLE_EASE),
      overwrite: true,
      onComplete,
    })
  }

  onBeforeUnmount(killBoardTweens)

  return {
    animateFenChange,
    killBoardTweens,
    settleGhostTo,
    settlePiece,
    snapBackGhost,
  }
}
