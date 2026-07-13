import { fenToGrid } from './fenBoard'

export interface PieceMove {
  from: string
  to: string
}

function colorOf(piece: string): 'w' | 'b' {
  return piece === piece.toUpperCase() ? 'w' : 'b'
}

export function detectMoves(prevFen: string, newFen: string): PieceMove[] | null {
  const prev = fenToGrid(prevFen)
  const next = fenToGrid(newFen)
  const disappeared: { square: string; piece: string }[] = []
  const appeared: { square: string; piece: string }[] = []
  let changed = 0

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const oldPiece = prev[row]?.[col] ?? ''
      const nextPiece = next[row]?.[col] ?? ''

      if (oldPiece === nextPiece) {
        continue
      }

      changed += 1
      const square = String.fromCharCode(97 + col) + (8 - row)

      if (oldPiece) {
        disappeared.push({ square, piece: oldPiece })
      }

      if (nextPiece) {
        appeared.push({ square, piece: nextPiece })
      }
    }
  }

  if (changed === 0 || changed > 4) {
    return null
  }

  const used = new Set<number>()
  const moves: PieceMove[] = []

  for (const nextPiece of appeared) {
    let matchedIndex = disappeared.findIndex(
      (piece, index) => !used.has(index) && piece.piece === nextPiece.piece
    )

    if (matchedIndex === -1) {
      matchedIndex = disappeared.findIndex(
        (piece, index) => !used.has(index) && colorOf(piece.piece) === colorOf(nextPiece.piece)
      )
    }

    if (matchedIndex === -1) {
      continue
    }

    used.add(matchedIndex)
    const source = disappeared[matchedIndex]

    if (source) {
      moves.push({ from: source.square, to: nextPiece.square })
    }
  }

  return moves
}
