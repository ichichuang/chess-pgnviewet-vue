import { computed, ref, watch, type ComputedRef } from 'vue'

import { fenToGrid, type Grid } from '../domain/fenBoard'
import { STANDARD_START_FEN } from '../domain/boardTypes'
import type {
  BoardEditorCastlingRights,
  BoardEditorDraftSnapshot,
  BoardEditorPiece,
} from '../domain/boardCapabilities'

const VALID_PIECES = new Set(['K', 'Q', 'R', 'B', 'N', 'P'])
const STARTING_CASTLING: BoardEditorCastlingRights = {
  wK: true,
  wQ: true,
  bK: true,
  bQ: true,
}

function emptyGrid(): Grid {
  return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => ''))
}

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice())
}

function squareToRC(square: string): [number, number] | null {
  if (!/^[a-h][1-8]$/u.test(square)) {
    return null
  }

  return [8 - Number(square[1]), square.charCodeAt(0) - 97]
}

function castlingFromFen(fen: string): BoardEditorCastlingRights {
  const token = fen.trim().split(/\s+/u)[2] ?? 'KQkq'

  return {
    wK: token.includes('K'),
    wQ: token.includes('Q'),
    bK: token.includes('k'),
    bQ: token.includes('q'),
  }
}

function sideFromFen(fen: string): 'w' | 'b' {
  return fen.trim().split(/\s+/u)[1] === 'b' ? 'b' : 'w'
}

function pieceToLetter(piece: BoardEditorPiece): string | null {
  const normalized = piece.type.trim().toUpperCase()

  if (!VALID_PIECES.has(normalized)) {
    return null
  }

  return piece.color === 'w' ? normalized : normalized.toLowerCase()
}

function letterToPiece(letter: string): BoardEditorPiece {
  return {
    color: letter === letter.toUpperCase() ? 'w' : 'b',
    type: letter.toUpperCase() as BoardEditorPiece['type'],
  }
}

function castlingToken(rights: BoardEditorCastlingRights): string {
  const token = [
    rights.wK ? 'K' : '',
    rights.wQ ? 'Q' : '',
    rights.bK ? 'k' : '',
    rights.bQ ? 'q' : '',
  ].join('')

  return token || '-'
}

function gridToPlacement(grid: Grid): string {
  return grid
    .map((row) => {
      let empty = 0
      let text = ''

      for (const cell of row) {
        if (!cell) {
          empty += 1
          continue
        }

        if (empty > 0) {
          text += String(empty)
          empty = 0
        }

        text += cell
      }

      return text + (empty > 0 ? String(empty) : '')
    })
    .join('/')
}

export function useBoardEditorDraft(active: ComputedRef<boolean>, initialFen: () => string) {
  const selectedPiece = ref<BoardEditorPiece | null>(null)
  const sideToMove = ref<'w' | 'b'>('w')
  const castlingRights = ref<BoardEditorCastlingRights>({ ...STARTING_CASTLING })
  const board = ref<Grid>(fenToGrid(STANDARD_START_FEN))
  const editing = ref(false)

  const fen = computed(() => generateFenString())
  const snapshot = computed<BoardEditorDraftSnapshot>(() => ({
    fen: fen.value,
    sideToMove: sideToMove.value,
    castlingRights: { ...castlingRights.value },
  }))

  function start(fromFen = STANDARD_START_FEN): void {
    editing.value = true
    selectedPiece.value = null
    board.value = fenToGrid(fromFen || STANDARD_START_FEN)
    sideToMove.value = sideFromFen(fromFen || STANDARD_START_FEN)
    castlingRights.value = castlingFromFen(fromFen || STANDARD_START_FEN)
  }

  function stop(): void {
    editing.value = false
    selectedPiece.value = null
  }

  function clearBoard(): void {
    board.value = emptyGrid()
  }

  function resetToStartingPosition(): void {
    board.value = fenToGrid(STANDARD_START_FEN)
    sideToMove.value = 'w'
    castlingRights.value = { ...STARTING_CASTLING }
    selectedPiece.value = null
  }

  function pieceAt(square: string): string {
    const rc = squareToRC(square)

    return rc ? (board.value[rc[0]]?.[rc[1]] ?? '') : ''
  }

  function placePieceAt(square: string, piece: BoardEditorPiece): void {
    const rc = squareToRC(square)
    const letter = pieceToLetter(piece)

    if (!rc || !letter) {
      return
    }

    const next = cloneGrid(board.value)
    next[rc[0]]![rc[1]] = letter
    board.value = next
  }

  function removePieceAt(square: string): void {
    const rc = squareToRC(square)

    if (!rc) {
      return
    }

    const next = cloneGrid(board.value)
    next[rc[0]]![rc[1]] = ''
    board.value = next
  }

  function handleSquareClick(square: string): void {
    const current = pieceAt(square)

    if (selectedPiece.value) {
      placePieceAt(square, selectedPiece.value)
      return
    }

    if (!current) {
      return
    }

    selectedPiece.value = letterToPiece(current)
    removePieceAt(square)
  }

  function generateFenString(): string {
    return `${gridToPlacement(cloneGrid(board.value))} ${sideToMove.value} ${castlingToken(
      castlingRights.value
    )} - 0 1`
  }

  watch(
    active,
    (isActive) => {
      if (isActive) {
        start(initialFen())
      } else if (editing.value) {
        stop()
      }
    },
    { immediate: true }
  )

  return {
    board,
    castlingRights,
    clearBoard,
    editing,
    fen,
    generateFenString,
    handleSquareClick,
    pieceAt,
    placePieceAt,
    removePieceAt,
    resetToStartingPosition,
    selectedPiece,
    sideToMove,
    snapshot,
    start,
    stop,
  }
}

export type BoardEditorDraft = ReturnType<typeof useBoardEditorDraft>
