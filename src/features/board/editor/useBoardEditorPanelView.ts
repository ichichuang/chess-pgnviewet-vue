import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'

import type {
  BoardEditorCastlingRights,
  BoardEditorPiece,
  BoardPieceResolver,
  BoardReducedMotionMode,
} from '../domain/boardCapabilities'
import { resolvePieceImage } from '../domain/pieceAssets'
import type { BoardEditorDraft } from './boardEditorDraft'

export interface BoardEditorPanelProps {
  draft: BoardEditorDraft
  palette: readonly BoardEditorPiece[]
  pieceResolver: BoardPieceResolver
  reducedMotion: BoardReducedMotionMode
  freePlacement: boolean
}

const DEFAULT_PIECE: BoardEditorPiece = { color: 'w', type: 'P' }

export function useBoardEditorPanelView(props: BoardEditorPanelProps) {
  const panelRoot = ref<HTMLElement | null>(null)
  const editorDraft = computed(() => props.draft)
  const whitePieces = computed(() => props.palette.filter((piece) => piece.color === 'w'))
  const blackPieces = computed(() => props.palette.filter((piece) => piece.color === 'b'))
  let gsapContext: ReturnType<typeof gsap.context> | null = null

  function pieceLetter(piece: BoardEditorPiece = DEFAULT_PIECE): string {
    return piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase()
  }

  function pieceImage(piece: BoardEditorPiece): string {
    return resolvePieceImage(props.pieceResolver, pieceLetter(piece))
  }

  function isSelected(piece: BoardEditorPiece = DEFAULT_PIECE): boolean {
    return (
      editorDraft.value.selectedPiece.value?.color === piece.color &&
      editorDraft.value.selectedPiece.value.type === piece.type
    )
  }

  function selectPiece(piece: BoardEditorPiece = DEFAULT_PIECE): void {
    if (!props.freePlacement) return

    editorDraft.value.selectedPiece.value = isSelected(piece) ? null : { ...piece }
  }

  function setSideToMove(side: 'w' | 'b'): void {
    editorDraft.value.sideToMove.value = side
  }

  function setCastlingRight(key: keyof BoardEditorCastlingRights, event: Event): void {
    const target = event.target

    if (target instanceof HTMLInputElement) {
      editorDraft.value.castlingRights.value[key] = target.checked
    }
  }

  function duration(name: string): number {
    if (props.reducedMotion === 'reduce') return 0

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return 0
    }

    const owner = panelRoot.value ?? document.documentElement
    const value = window.getComputedStyle(owner).getPropertyValue(name).trim()

    return value.endsWith('ms') ? Number.parseFloat(value) / 1000 : Number.parseFloat(value) || 0
  }

  function ease(name: string): string {
    const owner = panelRoot.value ?? document.documentElement

    return window.getComputedStyle(owner).getPropertyValue(name).trim() || 'none'
  }

  onMounted(() => {
    if (!panelRoot.value) return

    gsapContext = gsap.context(() => {
      gsap.fromTo(
        panelRoot.value,
        { autoAlpha: 0, scale: 0.9 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: duration('--board-editor-intro-duration'),
          ease: ease('--board-editor-intro-ease'),
          overwrite: true,
        }
      )
    }, panelRoot.value)
  })

  onBeforeUnmount(() => {
    gsapContext?.revert()
    gsapContext = null
  })

  return {
    blackPieces,
    editorDraft,
    isSelected,
    panelRoot,
    pieceImage,
    selectPiece,
    setCastlingRight,
    setSideToMove,
    whitePieces,
  }
}
