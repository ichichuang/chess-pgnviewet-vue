import { Chess, type Square } from 'chess.js'

import {
  BOARD_COLOR_BLACK,
  BOARD_COLOR_WHITE,
  STANDARD_START_FEN,
  type BoardColor,
  type ExecutedBoardMove,
  type PromotionPiece,
} from './boardTypes'

export function normalizeFen(fen: string | null | undefined): string {
  if (!fen) {
    return STANDARD_START_FEN
  }

  try {
    return new Chess(fen).fen()
  } catch {
    return STANDARD_START_FEN
  }
}

export function computeDests(fen: string): Map<string, string[]> {
  const dests = new Map<string, string[]>()

  try {
    const chess = new Chess(fen)

    for (const move of chess.moves({ verbose: true })) {
      const destinations = dests.get(move.from) ?? []
      destinations.push(move.to)
      dests.set(move.from, destinations)
    }
  } catch {
    return dests
  }

  return dests
}

export function needsPromotion(fen: string, from: string, to: string): boolean {
  try {
    const chess = new Chess(fen)

    return chess
      .moves({ square: from as Square, verbose: true })
      .some((move) => move.to === to && Boolean(move.promotion))
  } catch {
    return false
  }
}

export function applyMove(
  fen: string,
  from: string,
  to: string,
  promotion?: PromotionPiece
): ExecutedBoardMove | null {
  try {
    const chess = new Chess(fen)
    const moveNumber = chess.moveNumber()
    const color = chess.turn()
    const request = promotion ? { from, to, promotion } : { from, to }
    const move = chess.move(request, { strict: false })

    return {
      san: move.san,
      from: move.from,
      to: move.to,
      before: move.before,
      after: move.after,
      color,
      moveNumber,
      ...(promotion ? { promotion } : {}),
    }
  } catch {
    return null
  }
}

export function turnColor(fen: string): BoardColor {
  return fen.split(' ')[1] === 'b' ? BOARD_COLOR_BLACK : BOARD_COLOR_WHITE
}

export function turnFenColor(fen: string): 'w' | 'b' {
  return fen.split(' ')[1] === 'b' ? 'b' : 'w'
}

export function isCheck(fen: string): boolean {
  try {
    return new Chess(fen).isCheck()
  } catch {
    return false
  }
}
