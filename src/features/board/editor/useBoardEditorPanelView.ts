import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'

import type { BoardEditorCastlingRights, BoardEditorPiece } from '../domain/boardCapabilities'
import type { BoardEditorDraft } from './boardEditorDraft'

interface BoardEditorPanelProps {
  draft: unknown
}

const DEFAULT_PIECE: BoardEditorPiece = { color: 'w', type: 'P' }
const whitePieces = ['K', 'Q', 'R', 'B', 'N', 'P'] as const
const blackPieces = ['K', 'Q', 'R', 'B', 'N', 'P'] as const

function tokenValue(name: string): string {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function duration(name: string): number {
  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
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

export function useBoardEditorPanelView(props: BoardEditorPanelProps) {
  const panelRoot = ref<HTMLElement | null>(null)
  const editorDraft = computed(() => props.draft as BoardEditorDraft)
  let gsapContext: ReturnType<typeof gsap.context> | null = null

  function pieceLetter(piece: BoardEditorPiece = DEFAULT_PIECE): string {
    return piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase()
  }

  function isSelected(piece: BoardEditorPiece = DEFAULT_PIECE): boolean {
    return (
      editorDraft.value.selectedPiece.value?.color === piece.color &&
      editorDraft.value.selectedPiece.value.type === piece.type
    )
  }

  function selectPiece(piece: BoardEditorPiece = DEFAULT_PIECE): void {
    editorDraft.value.selectedPiece.value = isSelected(piece) ? null : { ...piece }
  }

  function setSideToMove(side: 'w' | 'b'): void {
    editorDraft.value.sideToMove.value = side
  }

  function setCastlingRight(key: keyof BoardEditorCastlingRights, event: Event): void {
    const target = event.target

    if (!(target instanceof HTMLInputElement)) {
      return
    }

    editorDraft.value.castlingRights.value[key] = target.checked
  }

  onMounted(() => {
    if (!panelRoot.value) {
      return
    }

    gsapContext = gsap.context(() => {
      gsap.fromTo(
        panelRoot.value,
        { autoAlpha: 0, scale: 0.9 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: duration('--board-editor-intro-duration'),
          ease: ease('--board-editor-intro-ease'),
        }
      )
    }, panelRoot.value)
  })

  onBeforeUnmount(() => {
    gsapContext?.revert()
  })

  return {
    blackPieces,
    editorDraft,
    isSelected,
    panelRoot,
    pieceLetter,
    selectPiece,
    setCastlingRight,
    setSideToMove,
    whitePieces,
  }
}
