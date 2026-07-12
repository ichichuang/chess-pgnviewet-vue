import { displayToSquare } from './boardGeometry'
import { fenToGrid } from './fenBoard'
import type { BoardCell, BoardOrientation } from './boardTypes'

export function buildBoardCells(fen: string, orientation: BoardOrientation): BoardCell[] {
  const grid = fenToGrid(fen)
  const cells: BoardCell[] = []

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const square = displayToSquare(row, col, orientation)
      const file = square.charCodeAt(0) - 97
      const rank = Number(square[1])
      const letter = grid[8 - rank]?.[file] ?? ''

      cells.push({
        row,
        col,
        square,
        letter,
        white: letter === letter.toUpperCase() && letter !== '',
        light: (row + col) % 2 === 0,
      })
    }
  }

  return cells
}
