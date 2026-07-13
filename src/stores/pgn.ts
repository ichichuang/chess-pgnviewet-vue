import { Chess } from 'chess.js'
import { defineStore } from 'pinia'

import {
  cloneAnnotation,
  type AnnotationDrawPayload,
  type BoardAnnotation,
} from '@/features/annotations/domain/annotationTypes'
import { serializeAnnotation } from '@/features/annotations/domain/ycdw'
import {
  applyMove,
  computeDests,
  createNode,
  findChildBySan,
  needsPromotion,
  type PromotionPiece,
} from '@/features/pgn/domain/mutations'
import {
  mainlineMoves,
  parsePgnCollection,
  STANDARD_START_FEN,
} from '@/features/pgn/domain/parsePgn'
import {
  filterItems,
  findNode,
  pageCount,
  paginate,
  pathToNode,
  pgnTitle,
} from '@/features/pgn/domain/pgnStorage'
import type { DataSource, MoveNode, PgnItem } from '@/features/pgn/domain/types'

interface PendingPromotion {
  from: string
  to: string
  color: 'w' | 'b'
}

interface PendingBranch {
  parentId: number
  from: string
  to: string
  promotion?: PromotionPiece | undefined
  san: string
}

interface DrawSnapshot {
  arrows: BoardAnnotation['arrows']
  squares: BoardAnnotation['squares']
}

interface DrawHistoryEntry {
  nodeId: number
  before: DrawSnapshot
  after: DrawSnapshot
}

interface PgnState {
  items: PgnItem[]
  selectedIndex: number
  selectedNodeId: number | null
  searchKey: string
  page: number
  pageSize: number
  source: DataSource
  lastError: string | null
  pendingPromotion: PendingPromotion | null
  pendingBranch: PendingBranch | null
  drawUndo: DrawHistoryEntry[]
  drawRedo: DrawHistoryEntry[]
}

function defaultPgnState(): PgnState {
  return {
    items: [],
    selectedIndex: -1,
    selectedNodeId: null,
    searchKey: '',
    page: 0,
    pageSize: 12,
    source: { type: 'null' },
    lastError: null,
    pendingPromotion: null,
    pendingBranch: null,
    drawUndo: [],
    drawRedo: [],
  }
}

function parseStrictCollection(text: string): PgnItem[] {
  const items = parsePgnCollection(text)

  if (items.length === 0) {
    throw new Error('PGN 中未找到棋谱')
  }

  if (items.some((item) => item.parseError)) {
    throw new Error('PGN 包含非法走法，未加载')
  }

  return items
}

function pgnTextFromFen(fen: string): string {
  const escapedFen = fen.replace(/\\/gu, '\\\\').replace(/"/gu, '\\"')
  const date = new Date().toISOString().slice(0, 10).replace(/-/gu, '.')

  return [
    '[Event "manual"]',
    `[Date "${date}"]`,
    '[SetUp "1"]',
    `[FEN "${escapedFen}"]`,
    '',
    '',
  ].join('\n')
}

export const usePgnStore = defineStore('pgn', {
  state: (): PgnState => defaultPgnState(),

  getters: {
    hasGame(state): boolean {
      return state.selectedIndex >= 0 && Boolean(state.items[state.selectedIndex]?.tree)
    },
    filtered(state): PgnItem[] {
      return filterItems(state.items, state.searchKey)
    },
    total(): number {
      return this.filtered.length
    },
    pageTotal(): number {
      return pageCount(this.total, this.pageSize)
    },
    pagedItems(): PgnItem[] {
      return paginate(this.filtered, this.page, this.pageSize)
    },
    selectedItem(state): PgnItem | null {
      return state.items[state.selectedIndex] ?? null
    },
    mainline(): MoveNode[] {
      const item = this.selectedItem

      return item?.tree ? mainlineMoves(item.tree) : []
    },
    currentNode(state): MoveNode | null {
      const item = this.selectedItem

      if (!item?.tree) {
        return null
      }

      if (state.selectedNodeId == null) {
        return item.tree.root
      }

      return findNode(item.tree, state.selectedNodeId) ?? item.tree.root
    },
    currentAnnotation(): BoardAnnotation | null {
      return this.currentNode?.annotation ?? null
    },
    hasCurrentDrawing(): boolean {
      const annotation = this.currentAnnotation

      return Boolean(annotation && (annotation.arrows.length > 0 || annotation.squares.length > 0))
    },
    canUndoCurrentDrawing(): boolean {
      const node = this.currentNode

      return Boolean(node && this.drawUndo.some((entry) => entry.nodeId === node.id))
    },
    canRedoCurrentDrawing(): boolean {
      const node = this.currentNode

      return Boolean(node && this.drawRedo.some((entry) => entry.nodeId === node.id))
    },
    currentFen(): string {
      const node = this.currentNode
      const item = this.selectedItem

      return node?.fen ?? item?.tree?.startFen ?? STANDARD_START_FEN
    },
    activePath(): MoveNode[] {
      const node = this.currentNode

      return node ? pathToNode(node) : []
    },
    dests(): Map<string, string[]> {
      return this.hasGame ? computeDests(this.currentFen) : new Map<string, string[]>()
    },
    lastMove(): [string, string] | undefined {
      const node = this.currentNode

      if (!node?.from || !node.to) {
        return undefined
      }

      return [node.from, node.to]
    },
    inCheck(): boolean {
      try {
        return new Chess(this.currentFen).isCheck()
      } catch {
        return false
      }
    },
    canGoStart(): boolean {
      const node = this.currentNode

      return Boolean(node?.parent)
    },
    canStepBack(): boolean {
      const node = this.currentNode

      return Boolean(node?.parent)
    },
    canStepForward(): boolean {
      const node = this.currentNode

      return Boolean(node?.children[0])
    },
    canGoEnd(): boolean {
      const node = this.currentNode
      const line = this.mainline

      return Boolean(line.length > 0 && node && line[line.length - 1]?.id !== node.id)
    },
    titleFor() {
      return (item: PgnItem, index: number) => pgnTitle(item, index)
    },
  },

  actions: {
    clearPrivateReplay(): void {
      if (this.source.type !== 'production_api') return
      this.$reset()
    },
    openText(text: string, source: DataSource = { type: 'FS' }): boolean {
      try {
        const items = parseStrictCollection(text)
        this.items = items
        this.source = source
        this.page = 0
        this.searchKey = ''
        this.pendingPromotion = null
        this.pendingBranch = null
        this.drawUndo = []
        this.drawRedo = []
        this.selectItem(0)
        this.lastError = null
        return true
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : 'PGN 解析失败'
        return false
      }
    },
    insertText(text: string): boolean {
      try {
        const items = parseStrictCollection(text)
        this.items.push(...items)

        if (this.selectedIndex === -1) {
          this.selectItem(0)
        }

        this.pendingPromotion = null
        this.pendingBranch = null
        this.drawUndo = []
        this.drawRedo = []
        this.lastError = null
        return true
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : 'PGN 解析失败'
        return false
      }
    },
    insertPgnFromFen(fen: string): boolean {
      const normalizedFen = fen.trim().replace(/\s+/gu, ' ')

      try {
        new Chess(normalizedFen)
      } catch {
        this.lastError = 'FEN 格式不正确'
        return false
      }

      try {
        const [item] = parseStrictCollection(pgnTextFromFen(normalizedFen))

        if (!item) {
          this.lastError = 'PGN 中未找到棋谱'
          return false
        }

        item.dataSource = { type: 'manual' }

        const hasSelectedItem = this.selectedIndex >= 0 && this.selectedIndex < this.items.length
        const insertIndex = hasSelectedItem ? this.selectedIndex + 1 : this.items.length
        this.items.splice(insertIndex, 0, item)
        this.source = { type: 'manual' }
        this.selectItem(insertIndex)
        this.pendingPromotion = null
        this.pendingBranch = null
        this.drawUndo = []
        this.drawRedo = []
        this.lastError = null
        return true
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : 'PGN 解析失败'
        return false
      }
    },
    selectItem(index: number): void {
      if (index < 0 || index >= this.items.length) {
        return
      }

      this.selectedIndex = index
      this.selectedNodeId = this.items[index]?.tree?.root.id ?? null
      this.pendingPromotion = null
      this.pendingBranch = null
      this.drawUndo = []
      this.drawRedo = []
    },
    selectNode(nodeId: number): void {
      const item = this.selectedItem

      if (!item?.tree || !findNode(item.tree, nodeId)) {
        return
      }

      this.selectedNodeId = nodeId
      this.pendingPromotion = null
      this.pendingBranch = null
    },
    goToStart(): void {
      const item = this.selectedItem

      if (item?.tree) {
        this.selectedNodeId = item.tree.root.id
      }
    },
    goToEnd(): void {
      const line = this.mainline

      if (line.length > 0) {
        this.selectedNodeId = line[line.length - 1]?.id ?? null
      }
    },
    stepForward(): void {
      const node = this.currentNode
      const next = node?.children[0]

      if (next) {
        this.selectedNodeId = next.id
      }
    },
    stepBack(): void {
      const node = this.currentNode

      if (node?.parent) {
        this.selectedNodeId = node.parent.id
      }
    },
    tryMove(payload: {
      from: string
      to: string
      promotion?: PromotionPiece
    }): 'applied' | 'branch' | 'promotion' | 'illegal' {
      const node = this.currentNode

      if (!node) {
        this.lastError = '请先加载 PGN'
        return 'illegal'
      }

      if (!payload.promotion && needsPromotion(node.fen, payload.from, payload.to)) {
        this.pendingPromotion = {
          from: payload.from,
          to: payload.to,
          color: node.fen.split(' ')[1] === 'b' ? 'b' : 'w',
        }
        this.lastError = null
        return 'promotion'
      }

      const applied = applyMove(node.fen, payload.from, payload.to, payload.promotion)

      if (!applied) {
        this.lastError = '非法走法'
        return 'illegal'
      }

      const existing = findChildBySan(node, applied.san)

      if (existing) {
        this.selectedNodeId = existing.id
        this.pendingPromotion = null
        this.pendingBranch = null
        this.lastError = null
        return 'applied'
      }

      if (node.children.length === 0) {
        const child = createNode(node, applied)
        node.children.push(child)
        this.selectedNodeId = child.id
        this.pendingPromotion = null
        this.pendingBranch = null
        this.lastError = null
        return 'applied'
      }

      this.pendingPromotion = null
      this.pendingBranch = {
        parentId: node.id,
        from: applied.from,
        to: applied.to,
        promotion: payload.promotion,
        san: applied.san,
      }
      this.lastError = null

      return 'branch'
    },
    resolvePromotion(piece: PromotionPiece): void {
      const pending = this.pendingPromotion

      if (!pending) {
        return
      }

      this.pendingPromotion = null
      this.tryMove({ from: pending.from, to: pending.to, promotion: piece })
    },
    cancelPromotion(): void {
      this.pendingPromotion = null
    },
    resolveBranch(asMainline: boolean): void {
      const pending = this.pendingBranch
      const item = this.selectedItem

      if (!pending || !item?.tree) {
        this.pendingBranch = null
        return
      }

      const parent = findNode(item.tree, pending.parentId)

      if (!parent) {
        this.pendingBranch = null
        return
      }

      const applied = applyMove(parent.fen, pending.from, pending.to, pending.promotion)

      if (!applied) {
        this.pendingBranch = null
        return
      }

      const duplicate = findChildBySan(parent, applied.san)

      if (duplicate) {
        this.selectedNodeId = duplicate.id
        this.pendingBranch = null
        return
      }

      const child = createNode(parent, applied)

      if (asMainline) {
        parent.children.unshift(child)
      } else {
        parent.children.push(child)
      }

      this.selectedNodeId = child.id
      this.pendingBranch = null
    },
    cancelBranch(): void {
      this.pendingBranch = null
    },
    drawAnnotation(payload: AnnotationDrawPayload): void {
      if (payload.kind === 'arrow' && payload.to) {
        this.toggleDrawArrow(payload.from, payload.to, payload.color)
        return
      }

      if (payload.kind === 'square' || payload.kind === 'highlight') {
        this.toggleDrawSquare(payload.from, payload.color, payload.kind)
      }
    },
    toggleDrawSquare(
      square: string,
      color: BoardAnnotation['squares'][number]['color'],
      kind: BoardAnnotation['squares'][number]['kind']
    ): void {
      const node = this.currentNode

      if (!node) {
        return
      }

      const before = snapDrawings(node)
      const squares = node.annotation.squares.slice()
      const index = squares.findIndex((mark) => mark.square === square && mark.kind === kind)

      if (index >= 0) {
        squares.splice(index, 1)
      } else {
        squares.push({ square, color, kind })
      }

      node.annotation = { ...cloneAnnotation(node.annotation), squares }
      syncRawComments(node)
      this.recordDrawChange(node, before)
    },
    toggleDrawArrow(
      from: string,
      to: string,
      color: BoardAnnotation['arrows'][number]['color']
    ): void {
      const node = this.currentNode

      if (!node) {
        return
      }

      const before = snapDrawings(node)
      const arrows = node.annotation.arrows.slice()
      const index = arrows.findIndex((arrow) => arrow.from === from && arrow.to === to)

      if (index >= 0) {
        arrows.splice(index, 1)
      } else {
        arrows.push({ from, to, color })
      }

      node.annotation = { ...cloneAnnotation(node.annotation), arrows }
      syncRawComments(node)
      this.recordDrawChange(node, before)
    },
    clearDrawing(): void {
      const node = this.currentNode

      if (!node) {
        return
      }

      const before = snapDrawings(node)

      if (before.arrows.length === 0 && before.squares.length === 0) {
        return
      }

      node.annotation = { ...cloneAnnotation(node.annotation), arrows: [], squares: [] }
      syncRawComments(node)
      this.recordDrawChange(node, before)
    },
    recordDrawChange(node: MoveNode, before: DrawSnapshot): void {
      const after = snapDrawings(node)

      if (sameDrawSnapshot(before, after)) {
        return
      }

      this.drawUndo.push({ nodeId: node.id, before, after })
      this.drawRedo = []
    },
    undoCurrentDrawing(): boolean {
      const node = this.currentNode

      if (!node) {
        return false
      }

      const index = findLastHistoryIndex(this.drawUndo, node.id)

      if (index < 0) {
        return false
      }

      const [entry] = this.drawUndo.splice(index, 1)

      if (!entry) {
        return false
      }

      node.annotation = {
        ...cloneAnnotation(node.annotation),
        arrows: cloneArrows(entry.before.arrows),
        squares: cloneSquares(entry.before.squares),
      }
      syncRawComments(node)
      this.drawRedo.push(entry)

      return true
    },
    redoCurrentDrawing(): boolean {
      const node = this.currentNode

      if (!node) {
        return false
      }

      const index = findLastHistoryIndex(this.drawRedo, node.id)

      if (index < 0) {
        return false
      }

      const [entry] = this.drawRedo.splice(index, 1)

      if (!entry) {
        return false
      }

      node.annotation = {
        ...cloneAnnotation(node.annotation),
        arrows: cloneArrows(entry.after.arrows),
        squares: cloneSquares(entry.after.squares),
      }
      syncRawComments(node)
      this.drawUndo.push(entry)

      return true
    },
    setSearch(key: string): void {
      this.searchKey = key
      this.page = 0
    },
    setPage(page: number): void {
      this.page = Math.max(0, Math.min(page, this.pageTotal - 1))
    },
  },
})

function snapDrawings(node: MoveNode): DrawSnapshot {
  return {
    arrows: node.annotation.arrows.map((arrow) => ({ ...arrow })),
    squares: node.annotation.squares.map((square) => ({ ...square })),
  }
}

function syncRawComments(node: MoveNode): void {
  node.rawComments = serializeAnnotation(node.annotation)
}

function cloneArrows(arrows: DrawSnapshot['arrows']): DrawSnapshot['arrows'] {
  return arrows.map((arrow) => ({ ...arrow }))
}

function cloneSquares(squares: DrawSnapshot['squares']): DrawSnapshot['squares'] {
  return squares.map((square) => ({ ...square }))
}

function sameDrawSnapshot(left: DrawSnapshot, right: DrawSnapshot): boolean {
  return (
    JSON.stringify(left.arrows) === JSON.stringify(right.arrows) &&
    JSON.stringify(left.squares) === JSON.stringify(right.squares)
  )
}

function findLastHistoryIndex(entries: DrawHistoryEntry[], nodeId: number): number {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (entries[index]?.nodeId === nodeId) {
      return index
    }
  }

  return -1
}
