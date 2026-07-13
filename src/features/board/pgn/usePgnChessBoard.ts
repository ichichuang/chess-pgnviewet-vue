import { computed, ref } from 'vue'

import {
  clearAnnotationDrawings,
  cloneAnnotation,
  type BoardAnnotation,
} from '@/features/annotations/domain/annotationTypes'
import { serializeAnnotation } from '@/features/annotations/domain/ycdw'
import { applyMove, createNode, findChildBySan } from '@/features/pgn/domain/mutations'
import { parsePgnCollection } from '@/features/pgn/domain/parsePgn'
import { findNode, pathToNode, pgnTitle } from '@/features/pgn/domain/pgnStorage'
import type { GameTree, MoveNode, PgnItem } from '@/features/pgn/domain/types'

import { isAcceptedMoveDecision, type BoardMoveRequestDecision } from '../domain/boardCapabilities'
import type { BoardMoveRequest, ExecutedBoardMove } from '../domain/boardTypes'
import type {
  PgnChessBoardError,
  PgnChessBoardErrorCode,
  PgnChessBoardSource,
  PgnGameSummary,
  PgnNavigationEvent,
  PgnNavigationReason,
  PgnNodeSnapshot,
  PgnSourceChangeEvent,
} from './pgnChessBoardTypes'

interface AnnotationHistoryEntry {
  nodeId: number
  before: BoardAnnotation
  after: BoardAnnotation
}

interface PgnChessBoardControllerOptions {
  initialGameIndex: () => number | undefined
  initialNodeId: () => number | null | undefined
  preserveOnInvalid: () => boolean
  onBeforeMove: (payload: BoardMoveRequest) => BoardMoveRequestDecision
  onMoveExecuted: (move: ExecutedBoardMove) => void
  onPgnChange: (event: PgnSourceChangeEvent) => void
  onPgnRemove: () => void
  onPgnError: (error: PgnChessBoardError) => void
  onGameChange: (game: PgnGameSummary) => void
  onCurrentNodeChange: (node: PgnNodeSnapshot) => void
  onNavigation: (event: PgnNavigationEvent) => void
  onUpdateGameIndex: (index: number) => void
  onUpdateNodeId: (nodeId: number | null) => void
  onAnnotationChange: (annotation: BoardAnnotation) => void
}

class PgnSourceError extends Error {
  readonly code: PgnChessBoardErrorCode

  constructor(code: PgnChessBoardErrorCode, message: string) {
    super(message)
    this.name = 'PgnSourceError'
    this.code = code
  }
}

export function usePgnChessBoard(options: PgnChessBoardControllerOptions) {
  const items = ref<PgnItem[]>([])
  const selectedGameIndex = ref(-1)
  const selectedNodeId = ref<number | null>(null)
  const undoHistory = ref<AnnotationHistoryEntry[]>([])
  const redoHistory = ref<AnnotationHistoryEntry[]>([])

  const hasPgn = computed(
    () => selectedGameIndex.value >= 0 && currentItem.value?.tree !== undefined
  )
  const currentItem = computed(() => items.value[selectedGameIndex.value] ?? null)
  const currentNode = computed(() => {
    const tree = currentItem.value?.tree

    if (!tree) return null
    if (selectedNodeId.value === null) return tree.root

    return findNode(tree, selectedNodeId.value) ?? tree.root
  })
  const currentFen = computed(() => currentNode.value?.fen ?? null)
  const currentAnnotations = computed(() => currentNode.value?.annotation ?? null)
  const currentLastMove = computed<readonly [string, string] | undefined>(() => {
    const node = currentNode.value

    return node?.from && node.to ? [node.from, node.to] : undefined
  })
  const games = computed<readonly PgnGameSummary[]>(() =>
    items.value.flatMap((item, index) => {
      const tree = item.tree

      return tree ? [gameSummary(item, index, tree)] : []
    })
  )
  const canUndoAnnotations = computed(() =>
    historyContainsNode(undoHistory.value, currentNode.value?.id)
  )
  const canRedoAnnotations = computed(() =>
    historyContainsNode(redoHistory.value, currentNode.value?.id)
  )
  const canClearAnnotations = computed(() => {
    const annotation = currentAnnotations.value

    return Boolean(annotation && (annotation.arrows.length > 0 || annotation.squares.length > 0))
  })

  function replacePgn(source: Exclude<PgnChessBoardSource, null>): boolean {
    try {
      const nextItems = materializeSource(source)
      const requestedIndex = options.initialGameIndex() ?? 0
      const nextIndex =
        requestedIndex >= 0 && requestedIndex < nextItems.length ? requestedIndex : 0
      const tree = nextItems[nextIndex]?.tree

      if (!tree) throw new PgnSourceError('missing-tree', 'PGN 数据缺少可导航棋局树')

      items.value = nextItems
      selectedGameIndex.value = nextIndex
      selectedNodeId.value = resolveInitialNodeId(tree, options.initialNodeId())
      clearAnnotationHistory()
      emitSourceChange()
      options.onUpdateGameIndex(nextIndex)
      notifyNavigation('load', null)

      return true
    } catch (error) {
      const failure = normalizePgnError(error)

      if (!options.preserveOnInvalid()) removePgn()
      options.onPgnError(failure)

      return false
    }
  }

  function removePgn(): void {
    const hadPgn = items.value.length > 0
    items.value = []
    selectedGameIndex.value = -1
    selectedNodeId.value = null
    clearAnnotationHistory()
    options.onUpdateGameIndex(-1)
    options.onUpdateNodeId(null)

    if (hadPgn) options.onPgnRemove()
  }

  function selectGame(index: number): boolean {
    const item = items.value[index]

    if (!item?.tree) {
      reportSelectionError('invalid-game-index', `棋局索引 ${index} 不存在`)
      return false
    }

    const previousNodeId = currentNode.value?.id ?? null
    selectedGameIndex.value = index
    selectedNodeId.value = item.tree.root.id
    clearAnnotationHistory()
    options.onUpdateGameIndex(index)
    options.onGameChange(gameSummary(item, index, item.tree))
    notifyNavigation('game', previousNodeId)

    return true
  }

  function selectNode(nodeId: number, reason: PgnNavigationReason = 'node'): boolean {
    const tree = currentItem.value?.tree
    const node = tree ? findNode(tree, nodeId) : null

    if (!node) {
      reportSelectionError('invalid-node', `节点 ${nodeId} 不存在于当前棋局`)
      return false
    }

    return navigateTo(node, reason)
  }

  function goToStart(): boolean {
    const root = currentItem.value?.tree?.root

    return root ? navigateTo(root, 'start') : false
  }

  function goToEnd(): boolean {
    let node = currentNode.value

    if (!node) return false

    while (node.children[0]) node = node.children[0]

    return navigateTo(node, 'end')
  }

  function previous(): boolean {
    const parent = currentNode.value?.parent

    return parent ? navigateTo(parent, 'previous') : false
  }

  function next(): boolean {
    const child = currentNode.value?.children[0]

    return child ? navigateTo(child, 'next') : false
  }

  function selectVariation(index: number): boolean {
    const child = currentNode.value?.children[index]

    if (!child) {
      reportSelectionError('invalid-node', `当前节点不存在索引为 ${index} 的分支`)
      return false
    }

    return navigateTo(child, 'variation')
  }

  function tryMove(payload: BoardMoveRequest): BoardMoveRequestDecision {
    const node = currentNode.value

    if (!node) return 'illegal'

    const consumerDecision = options.onBeforeMove(payload)

    if (!isAcceptedMoveDecision(consumerDecision)) return consumerDecision

    const applied = applyMove(node.fen, payload.from, payload.to, payload.promotion)

    if (!applied) return 'illegal'

    const existing = findChildBySan(node, applied.san)

    if (existing) {
      navigateTo(existing, 'move')
      options.onMoveExecuted(toExecutedMove(applied))
      return 'applied'
    }

    const isVariation = node.children.length > 0
    const child = createNode(node, applied)
    node.children.push(child)
    navigateTo(child, 'move')
    options.onMoveExecuted(toExecutedMove(applied))

    return isVariation ? 'branch' : 'applied'
  }

  function updateAnnotations(annotation: BoardAnnotation): boolean {
    const node = currentNode.value

    if (!node) return false

    const before = cloneAnnotation(node.annotation)
    const after = cloneAnnotation(annotation)

    if (sameAnnotations(before, after)) return false

    node.annotation = after
    node.rawComments = serializeAnnotation(after)
    undoHistory.value.push({ nodeId: node.id, before, after: cloneAnnotation(after) })
    redoHistory.value = []
    options.onAnnotationChange(cloneAnnotation(after))

    return true
  }

  function undoAnnotations(): boolean {
    return restoreAnnotation(undoHistory.value, redoHistory.value, 'before')
  }

  function redoAnnotations(): boolean {
    return restoreAnnotation(redoHistory.value, undoHistory.value, 'after')
  }

  function clearAnnotations(): boolean {
    const annotation = currentAnnotations.value

    return annotation ? updateAnnotations(clearAnnotationDrawings(annotation)) : false
  }

  function getCurrentNode(): PgnNodeSnapshot | null {
    return currentNode.value ? nodeSnapshot(currentNode.value) : null
  }

  function emitSourceChange(): void {
    const node = currentNode.value

    if (!node) return

    options.onPgnChange({
      games: games.value,
      selectedGameIndex: selectedGameIndex.value,
      currentNode: nodeSnapshot(node),
    })

    const item = currentItem.value
    const tree = item?.tree

    if (item && tree) options.onGameChange(gameSummary(item, selectedGameIndex.value, tree))
  }

  function navigateTo(node: MoveNode, reason: PgnNavigationReason): boolean {
    const previousNodeId = currentNode.value?.id ?? null

    if (previousNodeId === node.id && reason !== 'load') return false

    selectedNodeId.value = node.id
    notifyNavigation(reason, previousNodeId)

    return true
  }

  function notifyNavigation(reason: PgnNavigationReason, previousNodeId: number | null): void {
    const node = currentNode.value

    if (!node) return

    const snapshot = nodeSnapshot(node)
    options.onCurrentNodeChange(snapshot)
    options.onUpdateNodeId(node.id)
    options.onNavigation({
      reason,
      gameIndex: selectedGameIndex.value,
      previousNodeId,
      currentNode: snapshot,
      pathNodeIds: pathToNode(node).map((entry) => entry.id),
    })
  }

  function restoreAnnotation(
    source: AnnotationHistoryEntry[],
    target: AnnotationHistoryEntry[],
    state: 'before' | 'after'
  ): boolean {
    const node = currentNode.value

    if (!node) return false

    const index = findLastHistoryIndex(source, node.id)

    if (index < 0) return false

    const [entry] = source.splice(index, 1)

    if (!entry) return false

    node.annotation = cloneAnnotation(entry[state])
    node.rawComments = serializeAnnotation(node.annotation)
    target.push(entry)
    options.onAnnotationChange(cloneAnnotation(node.annotation))

    return true
  }

  function clearAnnotationHistory(): void {
    undoHistory.value = []
    redoHistory.value = []
  }

  function reportSelectionError(code: PgnChessBoardErrorCode, message: string): void {
    options.onPgnError({ code, message, recoverable: true })
  }

  return {
    canClearAnnotations,
    canRedoAnnotations,
    canUndoAnnotations,
    clearAnnotations,
    currentAnnotations,
    currentFen,
    currentLastMove,
    currentNode,
    games,
    getCurrentNode,
    goToEnd,
    goToStart,
    hasPgn,
    next,
    previous,
    redoAnnotations,
    removePgn,
    replacePgn,
    selectGame,
    selectedGameIndex,
    selectedNodeId,
    selectNode,
    selectVariation,
    tryMove,
    undoAnnotations,
    updateAnnotations,
  }
}

function materializeSource(source: Exclude<PgnChessBoardSource, null>): PgnItem[] {
  if (typeof source === 'string') return parseStrictSource(source)

  const rawItems = Array.isArray(source) ? source : [source]

  if (rawItems.length === 0) {
    throw new PgnSourceError('empty-pgn', 'PGN 数据中未找到棋局')
  }

  return rawItems.map(materializeItem)
}

function materializeItem(item: PgnItem): PgnItem {
  if (item.parseError) {
    throw new PgnSourceError('invalid-pgn', 'PGN 包含非法走法')
  }

  if (item.tree) return clonePgnItem(item)

  const text = [...item.headers, '', item.PGN].join('\n')
  const parsed = parseStrictSource(text)[0]

  if (!parsed) throw new PgnSourceError('missing-tree', 'PGN 数据缺少可导航棋局树')

  return parsed
}

function parseStrictSource(text: string): PgnItem[] {
  if (!text.trim()) throw new PgnSourceError('empty-pgn', 'PGN 文本为空')

  const parsed = parsePgnCollection(text)

  if (parsed.length === 0) throw new PgnSourceError('empty-pgn', 'PGN 文本中未找到棋局')
  if (parsed.some((item) => item.parseError)) {
    throw new PgnSourceError('invalid-pgn', 'PGN 包含非法走法')
  }

  return parsed.map(clonePgnItem)
}

function clonePgnItem(item: PgnItem): PgnItem {
  const cloned: PgnItem = {
    ...item,
    headers: [...item.headers],
    tags: { ...item.tags },
    dataSource: item.dataSource ? { ...item.dataSource } : undefined,
  }

  if (item.tree) cloned.tree = cloneGameTree(item.tree)

  return cloned
}

function cloneGameTree(tree: GameTree): GameTree {
  return {
    startFen: tree.startFen,
    fromFen: tree.fromFen,
    root: cloneMoveNode(tree.root, null),
  }
}

function cloneMoveNode(node: MoveNode, parent: MoveNode | null): MoveNode {
  const cloned: MoveNode = {
    ...node,
    rawComments: [...node.rawComments],
    annotation: cloneAnnotation(node.annotation),
    nags: [...node.nags],
    parent,
    children: [],
  }

  cloned.children = node.children.map((child) => cloneMoveNode(child, cloned))

  return cloned
}

function resolveInitialNodeId(tree: GameTree, requested: number | null | undefined): number {
  return requested !== null && requested !== undefined && findNode(tree, requested)
    ? requested
    : tree.root.id
}

function gameSummary(item: PgnItem, index: number, tree: GameTree): PgnGameSummary {
  return {
    index,
    title: pgnTitle(item, index),
    white: item.White ?? null,
    black: item.Black ?? null,
    result: item.Result ?? null,
    rootNodeId: tree.root.id,
  }
}

function nodeSnapshot(node: MoveNode): PgnNodeSnapshot {
  return {
    id: node.id,
    san: node.san,
    from: node.from ?? null,
    to: node.to ?? null,
    promotion: node.promotion ?? null,
    fen: node.fen,
    ply: node.ply,
    moveNumber: node.moveNumber,
    color: node.color,
    parentId: node.parent?.id ?? null,
    childIds: node.children.map((child) => child.id),
    annotation: cloneAnnotation(node.annotation),
  }
}

function normalizePgnError(error: unknown): PgnChessBoardError {
  if (error instanceof PgnSourceError) {
    return { code: error.code, message: error.message, recoverable: true }
  }

  return {
    code: 'invalid-pgn',
    message: error instanceof Error ? error.message : 'PGN 解析失败',
    recoverable: true,
  }
}

function historyContainsNode(
  entries: AnnotationHistoryEntry[],
  nodeId: number | undefined
): boolean {
  return nodeId !== undefined && entries.some((entry) => entry.nodeId === nodeId)
}

function findLastHistoryIndex(entries: AnnotationHistoryEntry[], nodeId: number): number {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (entries[index]?.nodeId === nodeId) return index
  }

  return -1
}

function sameAnnotations(left: BoardAnnotation, right: BoardAnnotation): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function toExecutedMove(move: ReturnType<typeof applyMove> & object): ExecutedBoardMove {
  return {
    san: move.san,
    from: move.from,
    to: move.to,
    before: move.before,
    after: move.after,
    color: move.color,
    moveNumber: move.moveNumber,
    ...(move.promotion ? { promotion: move.promotion } : {}),
  }
}
