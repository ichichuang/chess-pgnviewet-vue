import { BOARD_ORIENTATION_WHITE, type BoardOrientation } from './boardTypes'

export function squareToDisplay(
  square: string,
  orientation: BoardOrientation
): [number, number] | null {
  if (!/^[a-h][1-8]$/u.test(square)) {
    return null
  }

  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1])

  if (orientation === BOARD_ORIENTATION_WHITE) {
    return [8 - rank, file]
  }

  return [rank - 1, 7 - file]
}

export function displayToSquare(row: number, col: number, orientation: BoardOrientation): string {
  if (orientation === BOARD_ORIENTATION_WHITE) {
    return String.fromCharCode(97 + col) + (8 - row)
  }

  return String.fromCharCode(97 + (7 - col)) + (row + 1)
}

export function squareCenter(
  square: string,
  orientation: BoardOrientation
): [number, number] | null {
  const display = squareToDisplay(square, orientation)

  if (!display) {
    return null
  }

  return [display[1] + 0.5, display[0] + 0.5]
}

export function squareRect(
  square: string,
  orientation: BoardOrientation
): { x: number; y: number; w: number; h: number } | null {
  const display = squareToDisplay(square, orientation)

  if (!display) {
    return null
  }

  return { x: display[1], y: display[0], w: 1, h: 1 }
}
