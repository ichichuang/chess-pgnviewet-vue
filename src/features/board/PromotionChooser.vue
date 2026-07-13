<script setup lang="ts">
import { onBeforeUnmount, useId } from 'vue'
import { gsap } from 'gsap'

import type {
  BoardPieceResolver,
  BoardReducedMotionMode,
} from './domain/boardCapabilities'
import type { PendingPromotion, PromotionPiece } from './domain/boardTypes'
import { describePiece } from './domain/pieceAssets'

interface PromotionChooserProps {
  pending: PendingPromotion | null
  choices: readonly PromotionPiece[]
  pieceResolver: BoardPieceResolver
  reducedMotion: BoardReducedMotionMode
  dialogLabel: string
  groupLabel: string
}

const props = defineProps<PromotionChooserProps>()
const emit = defineEmits<{
  resolve: [piece: PromotionPiece]
  cancel: []
}>()
let context: ReturnType<typeof gsap.context> | null = null
const titleId = `board-promotion-${useId()}`
let previousFocus: HTMLElement | null = null

function pieceLetter(piece: PromotionPiece): string {
  return props.pending?.color === 'b' ? piece : piece.toUpperCase()
}

function pieceImage(piece: PromotionPiece): string {
  const descriptor = describePiece(pieceLetter(piece))

  return descriptor ? props.pieceResolver(descriptor) : ''
}

function duration(token: string): number {
  if (props.reducedMotion === 'reduce') return 0

  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return 0
  }

  const value = window.getComputedStyle(document.documentElement).getPropertyValue(token).trim()

  return value.endsWith('ms') ? Number.parseFloat(value) / 1000 : Number.parseFloat(value) || 0
}

function ease(token: string): string {
  return window.getComputedStyle(document.documentElement).getPropertyValue(token).trim() || 'none'
}

function onEnter(element: Element, done: () => void): void {
  if (!(element instanceof HTMLElement)) {
    done()
    return
  }

  const card = element.querySelector<HTMLElement>('.promotion-card')
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  context?.revert()
  context = gsap.context(() => {
    gsap.fromTo(
      element,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: duration('--board-promotion-open-duration'),
        ease: ease('--board-promotion-open-ease'),
        overwrite: true,
      }
    )

    if (card) {
      gsap.fromTo(
        card,
        { autoAlpha: 0, scale: 0.92 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: duration('--board-promotion-open-duration'),
          ease: ease('--board-promotion-open-ease'),
          overwrite: true,
          onComplete: () => {
            card.querySelector<HTMLButtonElement>('button')?.focus()
            done()
          },
        }
      )
    } else {
      done()
    }
  }, element)
}

function onLeave(element: Element, done: () => void): void {
  if (!(element instanceof HTMLElement)) {
    done()
    return
  }

  gsap.killTweensOf([element, ...element.querySelectorAll('.promotion-card')])
  const finish = () => {
    done()
    restoreFocus()
  }
  const animate = () => {
    gsap.to(element, {
      autoAlpha: 0,
      duration: duration('--board-promotion-close-duration'),
      ease: ease('--board-promotion-close-ease'),
      overwrite: true,
      onComplete: finish,
    })
  }

  if (context) context.add(animate)
  else animate()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('cancel')
    return
  }

  if (event.key !== 'Tab' || !(event.currentTarget instanceof HTMLElement)) return

  const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'))
  const first = buttons[0]
  const last = buttons.at(-1)

  if (!first || !last) return

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function restoreFocus(): void {
  if (previousFocus?.isConnected) previousFocus.focus()
  previousFocus = null
}

onBeforeUnmount(() => {
  restoreFocus()
  context?.revert()
  context = null
})
</script>

<template>
  <Transition :css="false" @enter="onEnter" @leave="onLeave">
    <div
      v-if="pending"
      class="promotion-mask"
      role="presentation"
      @keydown="onKeydown"
      @click.self="emit('cancel')"
    >
      <section class="promotion-card" role="dialog" aria-modal="true" :aria-labelledby="titleId">
        <h2 :id="titleId">{{ dialogLabel }}</h2>
        <div class="promotion-row" role="group" :aria-label="groupLabel">
          <button
            v-for="piece in choices"
            :key="piece"
            class="promotion-piece"
            type="button"
            :aria-label="`${dialogLabel} ${piece}`"
            @click="emit('resolve', piece)"
          >
            <img :src="pieceImage(piece)" alt="" draggable="false" />
          </button>
        </div>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.promotion-mask {
  position: absolute;
  inset: 0;
  z-index: var(--board-promotion-z);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--board-promotion-backdrop);
}

.promotion-card {
  display: grid;
  gap: var(--s-3);
  padding: var(--s-5);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface);
  box-shadow: var(--shadow-lg);
}

.promotion-card h2 {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
  text-align: center;
}

.promotion-row {
  display: flex;
  gap: var(--s-2);
}

.promotion-piece {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--board-promotion-piece-size);
  height: var(--board-promotion-piece-size);
  min-width: var(--board-touch-target-min);
  min-height: var(--board-touch-target-min);
  padding: var(--s-1);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface-2);
  cursor: pointer;
}

.promotion-piece:hover,
.promotion-piece:focus-visible {
  border-color: var(--accent);
  background: var(--accent-bg);
}

.promotion-piece img {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
