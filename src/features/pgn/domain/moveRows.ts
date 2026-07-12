import type { MoveNode } from './types'

interface MoveChip {
  node: MoveNode
  san: string
  caretId: number | null
}

export interface MoveRow {
  key: number
  moveNumber: number
  whiteChip?: MoveChip
  blackChip?: MoveChip
  isVariation: boolean
  indentLevel: number
}

function hasVariations(node: MoveNode): boolean {
  const parent = node.parent

  return Boolean(parent && parent.children[0] === node && parent.children.length > 1)
}

function makeChip(node: MoveNode): MoveChip {
  return {
    node,
    san: node.san,
    caretId: hasVariations(node) ? node.id : null,
  }
}

function emitExpandedVariations(row: MoveRow, expanded: Set<number>, out: MoveRow[]): void {
  const chips = [row.whiteChip, row.blackChip].filter((chip): chip is MoveChip => Boolean(chip))

  for (const chip of chips) {
    if (chip.caretId == null || !expanded.has(chip.caretId)) {
      continue
    }

    const parent = chip.node.parent

    if (!parent) {
      continue
    }

    for (const variation of parent.children.slice(1)) {
      emitTurnRows(variation, row.indentLevel + 1, expanded, out)
    }
  }
}

function emitTurnRows(
  firstNode: MoveNode,
  indentLevel: number,
  expanded: Set<number>,
  out: MoveRow[]
): void {
  let current: MoveNode | null = firstNode

  while (current) {
    const row: MoveRow = {
      key: current.id,
      moveNumber: current.moveNumber,
      isVariation: indentLevel > 0,
      indentLevel,
    }

    if (current.color === 'w') {
      row.whiteChip = makeChip(current)
      const reply: MoveNode | undefined = current.children[0]

      if (reply?.color === 'b' && reply.moveNumber === current.moveNumber) {
        row.blackChip = makeChip(reply)
        current = reply.children[0] ?? null
      } else {
        current = reply ?? null
      }
    } else {
      row.blackChip = makeChip(current)
      current = current.children[0] ?? null
    }

    out.push(row)
    emitExpandedVariations(row, expanded, out)
  }
}

export function buildMoveRows(root: MoveNode | null | undefined, expanded: Set<number>): MoveRow[] {
  const start = root?.children[0]

  if (!start) {
    return []
  }

  const rows: MoveRow[] = []
  emitTurnRows(start, 0, expanded, rows)

  return rows
}
