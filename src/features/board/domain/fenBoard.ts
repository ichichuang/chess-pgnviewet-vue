import { STANDARD_START_FEN } from './boardTypes'

export type Grid = string[][]

export function fenToGrid(fen: string): Grid {
  const placement = (fen || STANDARD_START_FEN).split(' ')[0] ?? STANDARD_START_FEN.split(' ')[0]!
  const ranks = placement.split('/')
  const grid: Grid = []

  for (let rankIndex = 0; rankIndex < 8; rankIndex += 1) {
    const row: string[] = []
    const rankText = ranks[rankIndex] ?? '8'

    for (const character of rankText) {
      if (/\d/u.test(character)) {
        for (let index = 0; index < Number(character); index += 1) {
          row.push('')
        }
      } else {
        row.push(character)
      }
    }

    while (row.length < 8) {
      row.push('')
    }

    grid.push(row.slice(0, 8))
  }

  while (grid.length < 8) {
    grid.push(Array.from({ length: 8 }, () => ''))
  }

  return grid
}
