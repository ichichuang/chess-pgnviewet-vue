import bb from '@/assets/chess/pieces/merida/bb.png?inline'
import bk from '@/assets/chess/pieces/merida/bk.png?inline'
import bn from '@/assets/chess/pieces/merida/bn.png?inline'
import bp from '@/assets/chess/pieces/merida/bp.png?inline'
import bq from '@/assets/chess/pieces/merida/bq.png?inline'
import br from '@/assets/chess/pieces/merida/br.png?inline'
import wb from '@/assets/chess/pieces/merida/wb.png?inline'
import wk from '@/assets/chess/pieces/merida/wk.png?inline'
import wn from '@/assets/chess/pieces/merida/wn.png?inline'
import wp from '@/assets/chess/pieces/merida/wp.png?inline'
import wq from '@/assets/chess/pieces/merida/wq.png?inline'
import wr from '@/assets/chess/pieces/merida/wr.png?inline'

import type { BoardPieceDescriptor, BoardPieceResolver } from './boardCapabilities'
import { BOARD_COLOR_BLACK, BOARD_COLOR_WHITE } from './boardTypes'

const PIECE_IMAGES: Record<string, string> = {
  B: wb,
  K: wk,
  N: wn,
  P: wp,
  Q: wq,
  R: wr,
  b: bb,
  k: bk,
  n: bn,
  p: bp,
  q: bq,
  r: br,
}

function pieceImg(letter: string): string {
  return PIECE_IMAGES[letter] ?? ''
}

const PIECE_TYPES: Record<string, BoardPieceDescriptor['type']> = {
  b: 'bishop',
  k: 'king',
  n: 'knight',
  p: 'pawn',
  q: 'queen',
  r: 'rook',
}

export function describePiece(letter: string, square?: string): BoardPieceDescriptor | null {
  const type = PIECE_TYPES[letter.toLowerCase()]

  if (!type || !PIECE_IMAGES[letter]) {
    return null
  }

  const piece: BoardPieceDescriptor = {
    letter,
    color: letter === letter.toUpperCase() ? BOARD_COLOR_WHITE : BOARD_COLOR_BLACK,
    type,
  }

  if (square !== undefined) {
    piece.square = square
  }

  return piece
}

export const meridaPieceResolver: BoardPieceResolver = (piece) => pieceImg(piece.letter)

export function resolvePieceImage(
  resolver: BoardPieceResolver,
  letter: string,
  square?: string
): string {
  const piece = describePiece(letter, square)

  return piece ? resolver(piece) : ''
}
