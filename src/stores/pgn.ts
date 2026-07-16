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
  applySanContinuation,
  computeDests,
  createNode,
  findChildBySan,
  needsPromotion,
  type AppliedMove,
  type PromotionPiece,
} from '@/features/pgn/domain/mutations'
import {
  mainlineMoves,
  parseStrictPgnCollection,
  STANDARD_START_FEN,
} from '@/features/pgn/domain/parsePgn'
import {
  canCopyReadonlySnapshot,
  editableLocalCopyDataSource,
  emptyDataSource,
  isLocalEditableDataSource,
  manualPositionDataSource,
} from '@/features/pgn/domain/sourceOwnership'
import {
  filterItems,
  findNode,
  pageCount,
  paginate,
  pathToNode,
  pgnTitle,
} from '@/features/pgn/domain/pgnStorage'
import {
  gameTeachingNoteKey,
  nodeCommentsFromText,
  nodeCommentText,
  teachingDraftContextIdentity,
  teachingDraftIsDirty,
  type TeachingDraft,
  type TeachingDraftEditIdentity,
  type TeachingDraftSaveResult,
  type TeachingDraftScope,
} from '@/features/pgn/domain/teachingDraft'
import type { DataSource, GameTree, MoveNode, PgnItem } from '@/features/pgn/domain/types'
import type { WorkspaceMode } from '@/features/workspace-mode/workspaceModeTypes'

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

export interface VariationContinuationCommand {
  expected: {
    sourceSession: number
    sourceId: string
    sourceRevision: number
    gameId: number
    nodeId: number
    fen: string
  }
  candidateMove: string
  pv: string
}

export type VariationContinuationResult =
  | {
      status: 'inserted' | 'existing'
      terminalNodeId: number
      createdCount: number
      sourceRevision: number
    }
  | {
      status: 'rejected'
      reason:
        | 'readonly'
        | 'stale'
        | 'busy'
        | 'empty-continuation'
        | 'illegal-continuation'
        | 'candidate-mismatch'
        | 'conflicting-tree'
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

interface ManualPositionDraftRevision {
  id: number
  sourceSession: number
  sourceId: string
  baselineFen: string | null
  currentFen: string | null
  revision: number
}

export interface WorkspaceEditIdentity {
  sourceSession: number
  sourceId: string
  sourceRevision: number
  selectedGameId: number | null
  selectedNodeId: number | null
  manualDraftId: number | null
  manualDraftRevision: number
  manualDraftFen: string | null
  teachingDraftId: number | null
  teachingDraftRevision: number
  teachingDraftText: string | null
  teachingDraftContext: string | null
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
  sourceSession: number
  sourceRevision: number
  cleanSourceRevision: number
  manualDraft: ManualPositionDraftRevision | null
  nextManualDraftId: number
  gameIds: number[]
  nextGameId: number
  gameTeachingNotes: Record<string, string>
  teachingDraft: TeachingDraft | null
  nextTeachingDraftId: number
}

function defaultPgnState(): PgnState {
  return {
    items: [],
    selectedIndex: -1,
    selectedNodeId: null,
    searchKey: '',
    page: 0,
    pageSize: 12,
    source: emptyDataSource(),
    lastError: null,
    pendingPromotion: null,
    pendingBranch: null,
    drawUndo: [],
    drawRedo: [],
    sourceSession: 0,
    sourceRevision: 0,
    cleanSourceRevision: 0,
    manualDraft: null,
    nextManualDraftId: 0,
    gameIds: [],
    nextGameId: 0,
    gameTeachingNotes: {},
    teachingDraft: null,
    nextTeachingDraftId: 0,
  }
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
    hasCanonicalPgnSnapshot(): boolean {
      return this.hasGame && this.items.length > 0
    },
    canMutateCurrentSource(state): boolean {
      return this.hasGame && isLocalEditableDataSource(state.source)
    },
    canCreateEditableLocalCopy(state): boolean {
      return this.hasCanonicalPgnSnapshot && canCopyReadonlySnapshot(state.source)
    },
    hasUnsavedSourceChanges(state): boolean {
      return (
        isLocalEditableDataSource(state.source) &&
        state.sourceRevision !== state.cleanSourceRevision
      )
    },
    hasUnsavedManualDraft(state): boolean {
      const draft = state.manualDraft
      return draft !== null && draft.baselineFen !== null && draft.currentFen !== draft.baselineFen
    },
    hasUnsavedTeachingDraft(state): boolean {
      return teachingDraftIsDirty(state.teachingDraft)
    },
    hasUnsavedWorkspaceChanges(): boolean {
      return (
        this.hasUnsavedSourceChanges || this.hasUnsavedManualDraft || this.hasUnsavedTeachingDraft
      )
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
    currentGameId(state): number | null {
      return state.gameIds[state.selectedIndex] ?? null
    },
    currentGameTeachingNote(): string {
      const gameId = this.currentGameId

      return gameId === null
        ? ''
        : (this.gameTeachingNotes[gameTeachingNoteKey(this.sourceSession, gameId)] ?? '')
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
      if (this.source.type !== 'remote_replay') return
      this.discardWorkspaceSession(this.captureWorkspaceEditIdentity())
    },
    captureWorkspaceEditIdentity(): WorkspaceEditIdentity {
      const teachingDraft = this.teachingDraft

      return {
        sourceSession: this.sourceSession,
        sourceId: this.source.id,
        sourceRevision: this.sourceRevision,
        selectedGameId: this.currentGameId,
        selectedNodeId: this.currentNode?.id ?? null,
        manualDraftId: this.manualDraft?.id ?? null,
        manualDraftRevision: this.manualDraft?.revision ?? 0,
        manualDraftFen: this.manualDraft?.currentFen ?? null,
        teachingDraftId: teachingDraft?.id ?? null,
        teachingDraftRevision: teachingDraft?.revision ?? 0,
        teachingDraftText: teachingDraft?.currentText ?? null,
        teachingDraftContext: teachingDraft?.staleContextIdentity ?? null,
      }
    },
    matchesWorkspaceEditIdentity(expected: WorkspaceEditIdentity): boolean {
      const current = this.captureWorkspaceEditIdentity()

      return (
        current.sourceSession === expected.sourceSession &&
        current.sourceId === expected.sourceId &&
        current.sourceRevision === expected.sourceRevision &&
        current.selectedGameId === expected.selectedGameId &&
        current.selectedNodeId === expected.selectedNodeId &&
        current.manualDraftId === expected.manualDraftId &&
        current.manualDraftRevision === expected.manualDraftRevision &&
        current.manualDraftFen === expected.manualDraftFen &&
        current.teachingDraftId === expected.teachingDraftId &&
        current.teachingDraftRevision === expected.teachingDraftRevision &&
        current.teachingDraftText === expected.teachingDraftText &&
        current.teachingDraftContext === expected.teachingDraftContext
      )
    },
    captureTeachingDraftIdentity(): TeachingDraftEditIdentity | null {
      const draft = this.teachingDraft

      if (!draft) return null

      return {
        draftId: draft.id,
        draftRevision: draft.revision,
        currentText: draft.currentText,
        staleContextIdentity: draft.staleContextIdentity,
        ...draft.context,
      }
    },
    matchesTeachingDraftIdentity(expected: TeachingDraftEditIdentity): boolean {
      const current = this.captureTeachingDraftIdentity()

      return (
        current !== null &&
        current.draftId === expected.draftId &&
        current.draftRevision === expected.draftRevision &&
        current.currentText === expected.currentText &&
        current.staleContextIdentity === expected.staleContextIdentity &&
        current.sourceSession === expected.sourceSession &&
        current.sourceId === expected.sourceId &&
        current.gameId === expected.gameId &&
        current.nodeId === expected.nodeId &&
        current.canonicalRevision === expected.canonicalRevision
      )
    },
    validateText(text: string): boolean {
      try {
        parseStrictPgnCollection(text)
        this.lastError = null
        return true
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : 'PGN 解析失败'
        return false
      }
    },
    beginManualEditorDraft(): number | null {
      if (this.hasGame && !isLocalEditableDataSource(this.source)) {
        return null
      }

      this.nextManualDraftId += 1
      this.manualDraft = {
        id: this.nextManualDraftId,
        sourceSession: this.sourceSession,
        sourceId: this.source.id,
        baselineFen: null,
        currentFen: null,
        revision: 0,
      }
      return this.nextManualDraftId
    },
    updateManualEditorDraft(id: number, fen: string): boolean {
      const draft = this.manualDraft

      if (
        !draft ||
        draft.id !== id ||
        draft.sourceSession !== this.sourceSession ||
        draft.sourceId !== this.source.id
      ) {
        return false
      }

      const normalizedFen = normalizeFen(fen)

      if (draft.baselineFen === null) {
        draft.baselineFen = normalizedFen
        draft.currentFen = normalizedFen
        return true
      }

      if (draft.currentFen === normalizedFen) {
        return true
      }

      draft.currentFen = normalizedFen
      draft.revision += 1
      return true
    },
    discardManualEditorDraft(id: number): boolean {
      if (this.manualDraft?.id !== id) {
        return false
      }

      this.manualDraft = null
      return true
    },
    openTeachingDraft(scope: TeachingDraftScope): boolean {
      if (
        !this.canMutateCurrentSource ||
        this.teachingDraft ||
        this.pendingBranch ||
        this.pendingPromotion
      ) {
        return false
      }

      const gameId = this.currentGameId
      const node = this.currentNode

      if (gameId === null || !node) return false

      const context = {
        sourceSession: this.sourceSession,
        sourceId: this.source.id,
        gameId,
        nodeId: scope === 'node-comment' ? node.id : null,
        canonicalRevision: this.sourceRevision,
      }
      const baselineText =
        scope === 'node-comment'
          ? nodeCommentText(node.annotation.plainComments)
          : this.currentGameTeachingNote

      this.nextTeachingDraftId += 1
      this.teachingDraft = {
        id: this.nextTeachingDraftId,
        scope,
        context,
        staleContextIdentity: teachingDraftContextIdentity(context),
        baselineText,
        currentText: baselineText,
        revision: 0,
        feedbackStatus: 'idle',
        feedbackMessage: null,
        canRetry: false,
      }
      return true
    },
    updateTeachingDraft(id: number, text: string): boolean {
      const draft = this.teachingDraft

      if (!draft || draft.id !== id) return false
      if (draft.currentText === text) return true

      draft.currentText = text
      draft.revision += 1
      draft.feedbackStatus = 'idle'
      draft.feedbackMessage = null
      draft.canRetry = false
      return true
    },
    saveTeachingDraft(
      expected: TeachingDraftEditIdentity,
      allowRevisionRefresh = false
    ): TeachingDraftSaveResult {
      const draft = this.teachingDraft

      if (!draft || !this.matchesTeachingDraftIdentity(expected)) return 'missing'
      if (!this.canMutateCurrentSource) {
        setTeachingDraftFeedback(
          draft,
          'error',
          '当前来源不可编辑，草稿内容仍保留。请取消编辑或先创建本地可编辑副本。',
          false
        )
        return 'readonly'
      }

      const node = this.currentNode
      const gameId = this.currentGameId
      const contextMatches =
        this.sourceSession === draft.context.sourceSession &&
        this.source.id === draft.context.sourceId &&
        gameId === draft.context.gameId &&
        (draft.scope === 'game-note' || node?.id === draft.context.nodeId)

      if (!contextMatches || gameId === null || !node) {
        setTeachingDraftFeedback(
          draft,
          'error',
          '编辑上下文已发生变化，草稿内容仍保留。请取消后回到原位置重新打开编辑器。',
          false
        )
        return 'stale'
      }

      if (draft.currentText === draft.baselineText) {
        setTeachingDraftFeedback(draft, 'success', '内容未改变，无需保存。', false)
        return 'unchanged'
      }

      const noteKey = gameTeachingNoteKey(this.sourceSession, gameId)
      const canonicalText =
        draft.scope === 'node-comment'
          ? nodeCommentText(node.annotation.plainComments)
          : (this.gameTeachingNotes[noteKey] ?? '')

      if (this.sourceRevision !== draft.context.canonicalRevision) {
        if (allowRevisionRefresh && canonicalText === draft.baselineText) {
          draft.context.canonicalRevision = this.sourceRevision
          draft.staleContextIdentity = teachingDraftContextIdentity(draft.context)
        } else {
          setTeachingDraftFeedback(
            draft,
            'error',
            canonicalText === draft.baselineText
              ? '棋谱内容在编辑期间发生了变化，草稿内容仍保留。请重试保存或取消编辑。'
              : draft.scope === 'node-comment'
                ? '当前节点批注在编辑期间发生了变化，草稿内容仍保留。请取消后重新打开编辑器以避免覆盖。'
                : '当前对局教学笔记在编辑期间发生了变化，草稿内容仍保留。请取消后重新打开编辑器以避免覆盖。',
            canonicalText === draft.baselineText
          )
          return 'stale'
        }
      }

      const expectedDraftRevision = draft.revision
      const expectedText = draft.currentText
      const expectedSourceRevision = draft.context.canonicalRevision
      const readyToMutate =
        this.teachingDraft === draft &&
        draft.revision === expectedDraftRevision &&
        draft.currentText === expectedText &&
        this.sourceSession === draft.context.sourceSession &&
        this.source.id === draft.context.sourceId &&
        this.currentGameId === draft.context.gameId &&
        this.sourceRevision === expectedSourceRevision &&
        (draft.scope === 'game-note' || this.currentNode?.id === draft.context.nodeId)

      if (!readyToMutate) {
        setTeachingDraftFeedback(
          draft,
          'error',
          '编辑上下文已发生变化，草稿内容仍保留。请取消后回到原位置重新打开编辑器。',
          false
        )
        return 'stale'
      }

      let savedText = expectedText

      if (draft.scope === 'node-comment') {
        const beforeAnnotation = node.annotation
        const beforeRawComments = node.rawComments
        const comments = nodeCommentsFromText(expectedText)
        const afterAnnotation = { ...cloneAnnotation(beforeAnnotation), plainComments: comments }

        node.annotation = afterAnnotation
        node.rawComments = serializeAnnotation(afterAnnotation)
        if (
          !this.markCurrentSourceChanged(
            draft.context.sourceId,
            draft.context.sourceSession,
            expectedSourceRevision
          )
        ) {
          node.annotation = beforeAnnotation
          node.rawComments = beforeRawComments
          setTeachingDraftFeedback(
            draft,
            'error',
            '保存前棋谱上下文发生了变化，草稿内容仍保留。请取消后重新打开编辑器。',
            false
          )
          return 'stale'
        }
        savedText = nodeCommentText(comments)
      } else {
        const hadPreviousNote = Object.hasOwn(this.gameTeachingNotes, noteKey)
        const previousNote = this.gameTeachingNotes[noteKey]

        if (expectedText === '') delete this.gameTeachingNotes[noteKey]
        else this.gameTeachingNotes[noteKey] = expectedText

        if (
          !this.markCurrentSourceChanged(
            draft.context.sourceId,
            draft.context.sourceSession,
            expectedSourceRevision
          )
        ) {
          if (hadPreviousNote && previousNote !== undefined) {
            this.gameTeachingNotes[noteKey] = previousNote
          } else {
            delete this.gameTeachingNotes[noteKey]
          }
          setTeachingDraftFeedback(
            draft,
            'error',
            '保存前棋谱上下文发生了变化，草稿内容仍保留。请取消后重新打开编辑器。',
            false
          )
          return 'stale'
        }
      }

      draft.baselineText = savedText
      draft.currentText = savedText
      draft.context.canonicalRevision = this.sourceRevision
      draft.staleContextIdentity = teachingDraftContextIdentity(draft.context)
      setTeachingDraftFeedback(
        draft,
        'success',
        draft.scope === 'node-comment'
          ? '节点批注已更新到当前本地棋谱；尚未写入外部文件。'
          : '对局教学笔记已在本次工作区会话中更新；不会写入文件或云端。',
        false
      )
      return 'saved'
    },
    discardTeachingDraft(expected?: TeachingDraftEditIdentity): boolean {
      if (!this.teachingDraft) return false
      if (expected && !this.matchesTeachingDraftIdentity(expected)) return false

      this.teachingDraft = null
      return true
    },
    discardWorkspaceDrafts(expected: WorkspaceEditIdentity): boolean {
      if (!this.matchesWorkspaceEditIdentity(expected)) return false

      this.manualDraft = null
      this.teachingDraft = null
      return true
    },
    markCurrentSourceChanged(
      expectedSourceId?: string,
      expectedSourceSession?: number,
      expectedSourceRevision?: number
    ): boolean {
      const sourceId = expectedSourceId ?? this.source.id
      const sourceSession = expectedSourceSession ?? this.sourceSession
      const sourceRevision = expectedSourceRevision ?? this.sourceRevision

      if (
        !isLocalEditableDataSource(this.source) ||
        this.source.id !== sourceId ||
        this.sourceSession !== sourceSession ||
        this.sourceRevision !== sourceRevision
      ) {
        return false
      }

      this.sourceRevision += 1
      return true
    },
    discardWorkspaceSession(expected: WorkspaceEditIdentity): boolean {
      if (!this.matchesWorkspaceEditIdentity(expected)) {
        return false
      }

      const nextSession = this.sourceSession + 1
      const nextManualDraftId = this.nextManualDraftId
      const nextGameId = this.nextGameId
      const nextTeachingDraftId = this.nextTeachingDraftId
      Object.assign(this, defaultPgnState())
      this.sourceSession = nextSession
      this.nextManualDraftId = nextManualDraftId
      this.nextGameId = nextGameId
      this.nextTeachingDraftId = nextTeachingDraftId
      return true
    },
    openText(text: string, source: DataSource): boolean {
      try {
        return this.openParsedCollection(parseStrictPgnCollection(text), source)
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : 'PGN 解析失败'
        return false
      }
    },
    openParsedCollection(items: PgnItem[], source: DataSource): boolean {
      if (items.length === 0 || items.some((item) => item.parseError)) {
        this.lastError = '没有可应用的有效 PGN 棋谱。'
        return false
      }

      assignItemSources(items, source)
      const nextGameIds = items.map((_, index) => this.nextGameId + index + 1)

      this.items = items
      this.source = { ...source }
      this.selectedIndex = 0
      this.selectedNodeId = items[0]?.tree?.root.id ?? null
      this.page = 0
      this.searchKey = ''
      this.pendingPromotion = null
      this.pendingBranch = null
      this.drawUndo = []
      this.drawRedo = []
      this.sourceSession += 1
      this.sourceRevision = 0
      this.cleanSourceRevision = 0
      this.manualDraft = null
      this.teachingDraft = null
      this.gameTeachingNotes = {}
      this.gameIds = nextGameIds
      this.nextGameId += items.length
      this.lastError = null
      return true
    },
    insertText(text: string): boolean {
      if (!this.canMutateCurrentSource) {
        this.lastError = '当前来源不可插入 PGN，请改为打开新的本地来源。'
        return false
      }

      try {
        return this.insertParsedCollection(parseStrictPgnCollection(text), {
          sourceSession: this.sourceSession,
          sourceId: this.source.id,
          sourceRevision: this.sourceRevision,
        })
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : 'PGN 解析失败'
        return false
      }
    },
    insertParsedCollection(
      items: PgnItem[],
      expected: Pick<WorkspaceEditIdentity, 'sourceSession' | 'sourceId' | 'sourceRevision'>
    ): boolean {
      if (
        !this.canMutateCurrentSource ||
        this.sourceSession !== expected.sourceSession ||
        this.source.id !== expected.sourceId ||
        this.sourceRevision !== expected.sourceRevision
      ) {
        this.lastError = '操作目标已变化，请重新选择当前来源。'
        return false
      }

      if (items.length === 0 || items.some((item) => item.parseError)) {
        this.lastError = '没有可应用的有效 PGN 棋谱。'
        return false
      }

      assignItemSources(items, this.source)
      const addedGameIds = items.map((_, index) => this.nextGameId + index + 1)
      const nextItems = [...this.items, ...items]
      const nextGameIds = [...this.gameIds, ...addedGameIds]

      this.items = nextItems
      this.gameIds = nextGameIds
      this.nextGameId += items.length
      this.pendingPromotion = null
      this.pendingBranch = null
      this.drawUndo = []
      this.drawRedo = []
      this.sourceRevision = expected.sourceRevision + 1
      this.lastError = null
      return true
    },
    createEditableLocalCopy(mode: WorkspaceMode): boolean {
      if (
        !this.canCreateEditableLocalCopy ||
        (mode !== 'competition_commentary' && mode !== 'replay')
      ) {
        this.lastError = '当前来源没有可复制的已完成棋谱快照。'
        return false
      }

      const localSource = editableLocalCopyDataSource()
      const copiedItems = cloneApprovedPgnItems(this.items, localSource)

      if (copiedItems.length === 0) {
        this.lastError = '当前来源没有可复制的已完成棋谱快照。'
        return false
      }

      this.items = copiedItems
      this.source = localSource
      this.pendingPromotion = null
      this.pendingBranch = null
      this.drawUndo = []
      this.drawRedo = []
      this.establishCleanSourceSession()
      this.lastError = null
      return true
    },
    insertPgnFromFen(fen: string, draftChanged = true): boolean {
      if (this.hasGame && !this.canMutateCurrentSource) {
        this.lastError = '当前来源为只读，不能插入手动局面。'
        return false
      }

      const normalizedFen = fen.trim().replace(/\s+/gu, ' ')

      try {
        new Chess(normalizedFen)
      } catch {
        this.lastError = 'FEN 格式不正确'
        return false
      }

      try {
        const createsManualSource = !this.hasGame
        const [item] = parseStrictPgnCollection(pgnTextFromFen(normalizedFen))

        if (!item) {
          this.lastError = 'PGN 中未找到棋谱'
          return false
        }

        const activeSource = createsManualSource ? manualPositionDataSource() : this.source
        item.dataSource = { ...activeSource }

        const hasSelectedItem = this.selectedIndex >= 0 && this.selectedIndex < this.items.length
        const insertIndex = hasSelectedItem ? this.selectedIndex + 1 : this.items.length
        this.items.splice(insertIndex, 0, item)
        this.source = { ...activeSource }
        if (!createsManualSource) {
          this.gameIds.splice(insertIndex, 0, this.allocateGameId())
        }
        this.selectItem(insertIndex)
        this.pendingPromotion = null
        this.pendingBranch = null
        this.drawUndo = []
        this.drawRedo = []
        if (createsManualSource) {
          this.establishCleanSourceSession()
        }
        if (!createsManualSource || draftChanged) {
          this.markCurrentSourceChanged(activeSource.id)
        }
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
    insertVariationContinuation(
      command: VariationContinuationCommand
    ): VariationContinuationResult {
      if (!this.canMutateCurrentSource) {
        return { status: 'rejected', reason: 'readonly' }
      }

      const { expected } = command

      if (
        this.sourceSession !== expected.sourceSession ||
        this.source.id !== expected.sourceId ||
        this.sourceRevision !== expected.sourceRevision ||
        this.currentGameId !== expected.gameId
      ) {
        return { status: 'rejected', reason: 'stale' }
      }

      if (this.pendingPromotion || this.pendingBranch || this.manualDraft || this.teachingDraft) {
        return { status: 'rejected', reason: 'busy' }
      }

      if (command.pv.trim() === '') {
        return { status: 'rejected', reason: 'empty-continuation' }
      }

      const gameIndex = this.gameIds.indexOf(expected.gameId)
      const tree = gameIndex >= 0 ? this.items[gameIndex]?.tree : undefined
      const target = tree ? findNode(tree, expected.nodeId) : null

      if (!target || target.fen !== expected.fen) {
        return { status: 'rejected', reason: 'stale' }
      }

      const continuation = applySanContinuation(expected.fen, command.pv)

      if (!continuation) {
        return { status: 'rejected', reason: 'illegal-continuation' }
      }

      const firstMove = continuation[0]

      if (!firstMove || moveIdentity(firstMove) !== command.candidateMove) {
        return { status: 'rejected', reason: 'candidate-mismatch' }
      }

      let parent = target
      let continuationIndex = 0

      for (; continuationIndex < continuation.length; continuationIndex += 1) {
        const move = continuation[continuationIndex]

        if (!move) {
          return { status: 'rejected', reason: 'illegal-continuation' }
        }

        const existing = findChildBySan(parent, move.san)

        if (!existing) {
          break
        }

        if (!nodeMatchesAppliedMove(existing, move)) {
          return { status: 'rejected', reason: 'conflicting-tree' }
        }

        parent = existing
      }

      if (continuationIndex === continuation.length) {
        return {
          status: 'existing',
          terminalNodeId: parent.id,
          createdCount: 0,
          sourceRevision: this.sourceRevision,
        }
      }

      const attachmentParent = parent
      let firstCreated: MoveNode | null = null
      let createdCount = 0

      for (; continuationIndex < continuation.length; continuationIndex += 1) {
        const move = continuation[continuationIndex]

        if (!move) {
          if (firstCreated) removeAttachedContinuation(attachmentParent, firstCreated)
          return { status: 'rejected', reason: 'illegal-continuation' }
        }

        const child = createNode(parent, move)
        parent.children.push(child)
        firstCreated ??= child
        parent = child
        createdCount += 1
      }

      if (
        !firstCreated ||
        !this.markCurrentSourceChanged(
          expected.sourceId,
          expected.sourceSession,
          expected.sourceRevision
        )
      ) {
        if (firstCreated) removeAttachedContinuation(attachmentParent, firstCreated)
        return { status: 'rejected', reason: 'stale' }
      }

      this.selectedIndex = gameIndex
      this.selectedNodeId = parent.id
      this.lastError = null

      return {
        status: 'inserted',
        terminalNodeId: parent.id,
        createdCount,
        sourceRevision: this.sourceRevision,
      }
    },
    tryMove(payload: {
      from: string
      to: string
      promotion?: PromotionPiece
    }): 'applied' | 'branch' | 'promotion' | 'illegal' {
      if (!this.canMutateCurrentSource) {
        this.lastError = '当前来源为只读，不能修改棋谱。'
        return 'illegal'
      }

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
        this.markCurrentSourceChanged()
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
      if (!this.canMutateCurrentSource) return
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
      if (!this.canMutateCurrentSource) {
        this.pendingBranch = null
        return
      }

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
      this.markCurrentSourceChanged()
    },
    cancelBranch(): void {
      this.pendingBranch = null
    },
    drawAnnotation(payload: AnnotationDrawPayload): boolean {
      if (!this.canMutateCurrentSource) return false
      if (payload.kind === 'arrow' && payload.to) {
        return this.toggleDrawArrow(payload.from, payload.to, payload.color)
      }

      if (payload.kind === 'square' || payload.kind === 'highlight') {
        return this.toggleDrawSquare(payload.from, payload.color, payload.kind)
      }

      return false
    },
    toggleDrawSquare(
      square: string,
      color: BoardAnnotation['squares'][number]['color'],
      kind: BoardAnnotation['squares'][number]['kind']
    ): boolean {
      if (!this.canMutateCurrentSource) return false
      const node = this.currentNode

      if (!node) {
        return false
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
      return this.recordDrawChange(node, before)
    },
    toggleDrawArrow(
      from: string,
      to: string,
      color: BoardAnnotation['arrows'][number]['color']
    ): boolean {
      if (!this.canMutateCurrentSource) return false
      const node = this.currentNode

      if (!node) {
        return false
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
      return this.recordDrawChange(node, before)
    },
    clearDrawing(): boolean {
      if (!this.canMutateCurrentSource) return false
      const node = this.currentNode

      if (!node) {
        return false
      }

      const before = snapDrawings(node)

      if (before.arrows.length === 0 && before.squares.length === 0) {
        return false
      }

      node.annotation = { ...cloneAnnotation(node.annotation), arrows: [], squares: [] }
      syncRawComments(node)
      return this.recordDrawChange(node, before)
    },
    recordDrawChange(node: MoveNode, before: DrawSnapshot): boolean {
      const after = snapDrawings(node)

      if (sameDrawSnapshot(before, after)) {
        return false
      }

      this.drawUndo.push({ nodeId: node.id, before, after })
      this.drawRedo = []
      this.markCurrentSourceChanged()
      return true
    },
    undoCurrentDrawing(): boolean {
      if (!this.canMutateCurrentSource) return false
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
      this.markCurrentSourceChanged()

      return true
    },
    redoCurrentDrawing(): boolean {
      if (!this.canMutateCurrentSource) return false
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
      this.markCurrentSourceChanged()

      return true
    },
    setSearch(key: string): void {
      this.searchKey = key
      this.page = 0
    },
    setPage(page: number): void {
      this.page = Math.max(0, Math.min(page, this.pageTotal - 1))
    },
    allocateGameId(): number {
      this.nextGameId += 1
      return this.nextGameId
    },
    establishCleanSourceSession(): void {
      this.sourceSession += 1
      this.sourceRevision = 0
      this.cleanSourceRevision = 0
      this.manualDraft = null
      this.teachingDraft = null
      this.gameTeachingNotes = {}
      this.gameIds = this.items.map(() => this.allocateGameId())
    },
  },
})

function normalizeFen(fen: string): string {
  return fen.trim().replace(/\s+/gu, ' ')
}

function moveIdentity(move: AppliedMove): string {
  return `${move.from}${move.to}${move.promotion ?? ''}`
}

function nodeMatchesAppliedMove(node: MoveNode, move: AppliedMove): boolean {
  return (
    node.san === move.san &&
    node.from === move.from &&
    node.to === move.to &&
    node.promotion === move.promotion &&
    node.prevFen === move.before &&
    node.fen === move.after &&
    node.color === move.color &&
    node.moveNumber === move.moveNumber
  )
}

function removeAttachedContinuation(parent: MoveNode, child: MoveNode): void {
  const index = parent.children.indexOf(child)

  if (index >= 0) {
    parent.children.splice(index, 1)
  }
}

function setTeachingDraftFeedback(
  draft: TeachingDraft,
  status: TeachingDraft['feedbackStatus'],
  message: string,
  canRetry: boolean
): void {
  draft.feedbackStatus = status
  draft.feedbackMessage = message
  draft.canRetry = canRetry
}

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

function assignItemSources(items: PgnItem[], source: DataSource): void {
  for (const item of items) {
    item.dataSource = { ...source }
  }
}

function cloneApprovedPgnItems(items: PgnItem[], source: DataSource): PgnItem[] {
  return items.map((item) => ({
    headers: [...item.headers],
    tags: { ...item.tags },
    PGN: item.PGN,
    ...(item.FEN === undefined ? {} : { FEN: item.FEN }),
    ...(item.Event === undefined ? {} : { Event: item.Event }),
    ...(item.White === undefined ? {} : { White: item.White }),
    ...(item.Black === undefined ? {} : { Black: item.Black }),
    ...(item.Result === undefined ? {} : { Result: item.Result }),
    ...(item.pgnTitle === undefined ? {} : { pgnTitle: item.pgnTitle }),
    ...(item.description === undefined ? {} : { description: item.description }),
    ...(item.last_fen === undefined ? {} : { last_fen: item.last_fen }),
    dataSource: { ...source },
    ...(item.tree === undefined ? {} : { tree: cloneGameTree(item.tree) }),
    ...(item.parseError === undefined ? {} : { parseError: item.parseError }),
  }))
}

function cloneGameTree(tree: GameTree): GameTree {
  return {
    startFen: tree.startFen,
    fromFen: tree.fromFen,
    root: cloneMoveNode(tree.root, null),
  }
}

function cloneMoveNode(node: MoveNode, parent: MoveNode | null): MoveNode {
  const copy: MoveNode = {
    id: node.id,
    san: node.san,
    fen: node.fen,
    ply: node.ply,
    moveNumber: node.moveNumber,
    color: node.color,
    rawComments: [...node.rawComments],
    annotation: cloneAnnotation(node.annotation),
    nags: [...node.nags],
    parent,
    children: [],
    ...(node.from === undefined ? {} : { from: node.from }),
    ...(node.to === undefined ? {} : { to: node.to }),
    ...(node.promotion === undefined ? {} : { promotion: node.promotion }),
    ...(node.prevFen === undefined ? {} : { prevFen: node.prevFen }),
  }
  copy.children = node.children.map((child) => cloneMoveNode(child, copy))
  return copy
}
