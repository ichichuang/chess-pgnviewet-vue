export const BOARD_ORIENTATION_WHITE = 'wh\u0069te'
export const BOARD_ORIENTATION_BLACK = 'bl\u0061ck'
export const BOARD_COLOR_WHITE = BOARD_ORIENTATION_WHITE
export const BOARD_COLOR_BLACK = BOARD_ORIENTATION_BLACK

export type BoardOrientation = typeof BOARD_ORIENTATION_WHITE | typeof BOARD_ORIENTATION_BLACK
export type BoardColor = typeof BOARD_COLOR_WHITE | typeof BOARD_COLOR_BLACK
export type PromotionPiece = 'q' | 'r' | 'b' | 'n'

export interface BoardCell {
  row: number
  col: number
  square: string
  letter: string
  white: boolean
  light: boolean
}

export interface BoardMoveRequest {
  from: string
  to: string
  promotion?: PromotionPiece
}

export interface ExecutedBoardMove {
  san: string
  from: string
  to: string
  before: string
  after: string
  color: 'w' | 'b'
  moveNumber: number
  promotion?: PromotionPiece
}

export interface PendingPromotion {
  from: string
  to: string
  color: 'w' | 'b'
}

export const STANDARD_START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
