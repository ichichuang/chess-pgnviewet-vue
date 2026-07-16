import { Chess, type Square } from 'chess.js'

import { emptyAnnotation } from '@/features/annotations/domain/annotationTypes'

import type { MoveNode } from './types'

export type PromotionPiece = 'q' | 'r' | 'b' | 'n'

export function computeDests(fen: string): Map<string, string[]> {
  const dests = new Map<string, string[]>()

  try {
    const chess = new Chess(fen)

    for (const move of chess.moves({ verbose: true })) {
      const targets = dests.get(move.from) ?? []
      targets.push(move.to)
      dests.set(move.from, targets)
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

export interface AppliedMove {
  san: string
  from: string
  to: string
  before: string
  after: string
  color: 'w' | 'b'
  moveNumber: number
  promotion?: PromotionPiece | undefined
}

function appliedMoveFromResult(
  move: ReturnType<Chess['move']>,
  moveNumber: number,
  color: 'w' | 'b'
): AppliedMove {
  const promotion = move.promotion as PromotionPiece | undefined

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
}

export function applyMove(
  fen: string,
  from: string,
  to: string,
  promotion?: PromotionPiece
): AppliedMove | null {
  try {
    const chess = new Chess(fen)
    const moveNumber = chess.moveNumber()
    const color = chess.turn()
    const request = promotion ? { from, to, promotion } : { from, to }
    const move = chess.move(request, { strict: false })

    return appliedMoveFromResult(move, moveNumber, color)
  } catch {
    return null
  }
}

export function applySanContinuation(fen: string, pv: string): AppliedMove[] | null {
  const sanMoves = pv.trim().split(/\s+/u).filter(Boolean)

  if (sanMoves.length === 0) {
    return null
  }

  try {
    const chess = new Chess(fen)
    const applied: AppliedMove[] = []

    for (const san of sanMoves) {
      const moveNumber = chess.moveNumber()
      const color = chess.turn()
      const move = chess.move(san, { strict: true })
      applied.push(appliedMoveFromResult(move, moveNumber, color))
    }

    return applied
  } catch {
    return null
  }
}

export function createNode(parent: MoveNode, move: AppliedMove): MoveNode {
  return {
    id: nextTreeNodeId(parent),
    san: move.san,
    from: move.from,
    to: move.to,
    promotion: move.promotion,
    fen: move.after,
    prevFen: move.before,
    ply: parent.ply + 1,
    moveNumber: move.moveNumber,
    color: move.color,
    rawComments: [],
    annotation: emptyAnnotation(),
    nags: [],
    parent,
    children: [],
  }
}

export function findChildBySan(node: MoveNode, san: string): MoveNode | null {
  return node.children.find((child) => child.san === san) ?? null
}

function nextTreeNodeId(parent: MoveNode): number {
  let root = parent

  while (root.parent) {
    root = root.parent
  }

  let maxId = root.id
  const stack = [...root.children]

  while (stack.length > 0) {
    const node = stack.pop()

    if (!node) {
      continue
    }

    maxId = Math.max(maxId, node.id)
    stack.push(...node.children)
  }

  return maxId + 1
}
