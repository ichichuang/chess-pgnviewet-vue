import type { GameTree, MoveNode, PgnItem } from './types'

export function pgnTitle(item: PgnItem, index: number): string {
  if (item.pgnTitle?.trim()) {
    return item.pgnTitle
  }

  if (item.Event?.trim()) {
    return item.Event
  }

  if (item.White || item.Black) {
    return `${item.White ?? '?'} - ${item.Black ?? '?'}`
  }

  return `棋谱 ${index + 1}`
}

export function filterItems(items: PgnItem[], key: string): PgnItem[] {
  const normalized = key.trim().toLowerCase()

  if (!normalized) {
    return items
  }

  return items.filter((item, index) =>
    [pgnTitle(item, index), item.White ?? '', item.Black ?? '', item.Event ?? '', item.PGN]
      .join(' ')
      .toLowerCase()
      .includes(normalized)
  )
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice(page * pageSize, page * pageSize + pageSize)
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

export function findNode(tree: GameTree, id: number): MoveNode | null {
  const stack: MoveNode[] = [tree.root]

  while (stack.length > 0) {
    const node = stack.pop()

    if (!node) {
      continue
    }

    if (node.id === id) {
      return node
    }

    for (const child of node.children) {
      stack.push(child)
    }
  }

  return null
}

export function pathToNode(node: MoveNode): MoveNode[] {
  const path: MoveNode[] = []
  let current: MoveNode | null = node

  while (current?.parent) {
    path.unshift(current)
    current = current.parent
  }

  return path
}
