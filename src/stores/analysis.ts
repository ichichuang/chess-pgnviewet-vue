import { Chess } from 'chess.js'
import { defineStore } from 'pinia'

import { serializeAnnotation } from '@/features/annotations/domain/ycdw'
import { computeEvalResult, normalizeEngineScore } from '@/features/analysis/domain/classifyMove'
import type { EngineEval } from '@/features/analysis/domain/engine'
import {
  candidateInsertionPresentation,
  createAnalysisPresentation,
  type AnalysisExecutionPhase,
  type AnalysisPresentation,
  type AnalysisProductOutcome,
  type AnalysisScope,
  type CandidateInsertionPresentation,
  type CandidateInsertionProductKind,
  type CandidateInsertionProductOutcome,
} from '@/features/analysis/domain/analysisPresentation'
import {
  AnalysisStoppedError,
  createSearchEngine,
  type SearchEngine,
} from '@/features/analysis/domain/searchEngine'
import { effectiveDepth } from '@/features/analysis/domain/search'
import { mainlineMoves } from '@/features/pgn/domain/parsePgn'
import { findNode } from '@/features/pgn/domain/pgnStorage'
import type { MoveNode } from '@/features/pgn/domain/types'

import { usePgnStore } from './pgn'

export type { AnalysisScope } from '@/features/analysis/domain/analysisPresentation'

type WorkerMode = 'worker' | 'main-thread-fallback' | 'unavailable'

interface AnalysisPositionSnapshot {
  nodeId: number
  nodeKey: string
  positionId: string
  fen: string
  label: string
  ply: number
  parentFen: string | null
  moveFromTo: string | null
}

interface AnalysisTaskSnapshot {
  requestId: number
  scope: AnalysisScope
  sourceSession: number
  sourceId: string
  sourceRevision: number
  gameId: number
  positions: readonly AnalysisPositionSnapshot[]
}

interface AnalysisScore {
  kind: 'cp' | 'mate'
  value: number
  whiteValue: number
}

export interface AnalysisLine {
  id: string
  move: string
  san: string
  pv: string
  pvLegal: boolean
  score: AnalysisScore
}

export interface AnalysisPositionResult {
  requestId: number
  scope: AnalysisScope
  sourceSession: number
  sourceId: string
  sourceRevision: number
  gameId: number
  nodeId: number
  nodeKey: string
  positionId: string
  fen: string
  label: string
  ply: number
  raw: EngineEval
  score: AnalysisScore
  pv: string
  pvLegal: boolean
  bestMove: string
  bestMoveSan: string
  lines: AnalysisLine[]
  analyzedAt: string
}

export interface AnalysisCandidateSelection {
  requestId: number
  scope: AnalysisScope
  nodeKey: string
  candidateId: string
  candidateMove: string
  candidatePv: string
}

export type AnalysisCandidateInsertionOutcome =
  | { kind: 'inserted'; terminalNodeId: number; createdCount: number }
  | { kind: 'existing' | 'illegal' | 'readonly' | 'busy' | 'stale' }

export interface FullGameAnalysis {
  requestId: number
  scope: 'full'
  sourceSession: number
  sourceId: string
  sourceRevision: number
  gameId: number
  total: number
  results: readonly AnalysisPositionResult[]
  analyzedAt: string
}

interface FullGameProgress {
  requestId: number
  scope: 'full'
  completed: number
  total: number
  percentage: number
  currentIndex: number
  currentNodeId: number
  currentNodeKey: string
  currentLabel: string
}

interface AnalysisState {
  phase: AnalysisExecutionPhase
  workerMode: WorkerMode
  workerCount: number
  firstUseAccepted: boolean
  activeRequest: AnalysisTaskSnapshot | null
  lastRequestedScope: AnalysisScope | null
  lastCompletedScope: AnalysisScope | null
  current: AnalysisPositionResult | null
  fullGame: FullGameAnalysis | null
  progress: FullGameProgress | null
  error: string | null
  unavailableReason: string | null
  staleRejected: number
  completedRequests: number
  cancelledRequests: number
  retryCount: number
  outcome: AnalysisProductOutcome | null
  outcomeSequence: number
  candidateOutcome: CandidateInsertionProductOutcome | null
  candidateOutcomeSequence: number
}

const MATE_SCORE = 9000
const MATE_SCORE_FLOOR = MATE_SCORE - 100
const DEFAULT_DEPTH = effectiveDepth(16, '1.8')
const DEFAULT_THINK_MS = 900

let engine: SearchEngine | null = null
let requestSeq = 0
let firstUseAcceptedForApplicationSession = false

function nextRequestId(): number {
  requestSeq += 1
  return requestSeq
}

function createEngine(): SearchEngine {
  const cores =
    typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 4

  return createSearchEngine(Math.max(1, Math.min(Math.floor(cores / 2), 4)))
}

function getEngine(): SearchEngine {
  if (!engine) {
    engine = createEngine()
  }

  return engine
}

function disposeEngine(): void {
  engine?.dispose()
  engine = null
}

function hashString(input: string): string {
  let hash = 2166136261

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

function nodeKeyFor(gameId: number, nodeId: number, positionId: string): string {
  return `${gameId}:${nodeId}:${positionId}`
}

function moveFromNode(node: MoveNode): string | null {
  if (!node.from || !node.to) {
    return null
  }

  return `${node.from}${node.to}${node.promotion ?? ''}`
}

function positionLabel(node: MoveNode): string {
  if (!node.parent) {
    return '初始局面'
  }

  return node.color === 'b'
    ? `${node.moveNumber}... ${node.san}`
    : `${node.moveNumber}. ${node.san}`
}

function positionSnapshot(gameId: number, node: MoveNode): AnalysisPositionSnapshot | null {
  try {
    new Chess(node.fen)
  } catch {
    return null
  }

  const positionId = hashString(node.fen)

  return Object.freeze({
    nodeId: node.id,
    nodeKey: nodeKeyFor(gameId, node.id, positionId),
    positionId,
    fen: node.fen,
    label: positionLabel(node),
    ply: node.ply,
    parentFen: node.parent?.fen ?? null,
    moveFromTo: moveFromNode(node),
  })
}

function captureTaskSnapshot(scope: AnalysisScope): Omit<AnalysisTaskSnapshot, 'requestId'> | null {
  const pgn = usePgnStore()
  const item = pgn.selectedItem
  const gameId = pgn.currentGameId

  if (
    !pgn.hasGame ||
    !pgn.canMutateCurrentSource ||
    pgn.manualDraft ||
    gameId === null ||
    !item?.tree
  ) {
    return null
  }

  const nodes =
    scope === 'full'
      ? [item.tree.root, ...mainlineMoves(item.tree)]
      : pgn.currentNode
        ? [pgn.currentNode]
        : []
  const positions: AnalysisPositionSnapshot[] = []
  const nodeIds = new Set<number>()

  for (const node of nodes) {
    if (nodeIds.has(node.id)) {
      return null
    }

    const position = positionSnapshot(gameId, node)

    if (!position) {
      return null
    }

    nodeIds.add(node.id)
    positions.push(position)
  }

  if (positions.length === 0) {
    return null
  }

  return Object.freeze({
    scope,
    sourceSession: pgn.sourceSession,
    sourceId: pgn.source.id,
    sourceRevision: pgn.sourceRevision,
    gameId,
    positions: Object.freeze(positions),
  })
}

function scoreFromEval(fen: string, evalResult: EngineEval): AnalysisScore {
  const normalized = normalizeEngineScore(evalResult.score)
  const turn = fen.split(' ')[1] === 'b' ? 'b' : 'w'
  const whiteValue = turn === 'w' ? normalized : -normalized

  if (Math.abs(normalized) >= MATE_SCORE_FLOOR) {
    const distance = Math.max(0, MATE_SCORE - Math.abs(normalized))

    return {
      kind: 'mate',
      value: Math.sign(normalized) * distance,
      whiteValue: Math.sign(whiteValue) * distance,
    }
  }

  return {
    kind: 'cp',
    value: normalized,
    whiteValue,
  }
}

function validatePv(fen: string, pv: string): boolean {
  const moves = pv.trim().split(/\s+/u).filter(Boolean)

  if (moves.length === 0) {
    return true
  }

  try {
    const chess = new Chess(fen)

    for (const san of moves) {
      const applied = chess.move(san)

      if (!applied) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

function candidateLineIdentity(move: string, pv: string): string {
  return hashString(`${move}\u0000${pv}`)
}

function candidateLineDetails(
  fen: string,
  move: string,
  pv: string
): { san: string; legal: boolean } {
  const sanMoves = pv.trim().split(/\s+/u).filter(Boolean)
  const firstSan = sanMoves[0] ?? ''

  if (!firstSan) {
    return { san: '', legal: false }
  }

  try {
    const chess = new Chess(fen)
    let firstMoveIdentity = ''

    for (const [index, san] of sanMoves.entries()) {
      const applied = chess.move(san, { strict: true })

      if (index === 0) {
        firstMoveIdentity = `${applied.from}${applied.to}${applied.promotion ?? ''}`
      }
    }

    return { san: firstSan, legal: firstMoveIdentity === move }
  } catch {
    return { san: firstSan, legal: false }
  }
}

function sortedLines(fen: string, evalResult: EngineEval): AnalysisLine[] {
  return Object.entries(evalResult.candidates ?? {})
    .map(([move, candidate]) => {
      const details = candidateLineDetails(fen, move, candidate.pv)

      return {
        id: candidateLineIdentity(move, candidate.pv),
        move,
        san: details.san,
        pv: candidate.pv,
        pvLegal: details.legal,
        score: scoreFromEval(fen, {
          fen,
          score: candidate.score,
          pv: candidate.pv,
          bestMove: move,
        }),
      }
    })
    .sort((left, right) => right.score.value - left.score.value)
    .slice(0, 5)
}

function stopped(error: unknown): boolean {
  return error instanceof AnalysisStoppedError
}

function taskMatchesBase(task: AnalysisTaskSnapshot): boolean {
  const pgn = usePgnStore()

  return (
    pgn.canMutateCurrentSource &&
    pgn.sourceSession === task.sourceSession &&
    pgn.source.id === task.sourceId &&
    pgn.sourceRevision === task.sourceRevision &&
    pgn.currentGameId === task.gameId
  )
}

function taskMatchesCurrentPosition(task: AnalysisTaskSnapshot): boolean {
  const pgn = usePgnStore()
  const position = task.positions[0]

  return Boolean(
    position &&
    taskMatchesBase(task) &&
    pgn.currentNode?.id === position.nodeId &&
    pgn.currentFen === position.fen &&
    hashString(pgn.currentFen) === position.positionId
  )
}

function resultMatchesBase(result: AnalysisPositionResult | FullGameAnalysis): boolean {
  const pgn = usePgnStore()

  return (
    pgn.canMutateCurrentSource &&
    pgn.sourceSession === result.sourceSession &&
    pgn.source.id === result.sourceId &&
    pgn.sourceRevision === result.sourceRevision &&
    pgn.currentGameId === result.gameId
  )
}

function resultMatchesCurrentPosition(result: AnalysisPositionResult): boolean {
  const pgn = usePgnStore()

  return (
    result.scope === 'current' &&
    resultMatchesBase(result) &&
    pgn.currentNode?.id === result.nodeId &&
    pgn.currentFen === result.fen &&
    hashString(pgn.currentFen) === result.positionId
  )
}

function fullGameMatchesCurrentTree(result: FullGameAnalysis): boolean {
  const pgn = usePgnStore()
  const gameIndex = pgn.gameIds.indexOf(result.gameId)
  const tree = gameIndex >= 0 ? pgn.items[gameIndex]?.tree : undefined

  if (!resultMatchesBase(result) || !tree || result.total !== result.results.length) {
    return false
  }

  return result.results.every((position) => {
    const node = findNode(tree, position.nodeId)

    return (
      position.scope === 'full' &&
      position.requestId === result.requestId &&
      position.sourceSession === result.sourceSession &&
      position.sourceId === result.sourceId &&
      position.sourceRevision === result.sourceRevision &&
      position.gameId === result.gameId &&
      position.positionId === hashString(position.fen) &&
      position.nodeKey === nodeKeyFor(position.gameId, position.nodeId, position.positionId) &&
      node?.fen === position.fen
    )
  })
}

function sameCapturedTask(
  active: AnalysisTaskSnapshot,
  captured: Omit<AnalysisTaskSnapshot, 'requestId'>
): boolean {
  return (
    active.scope === captured.scope &&
    active.sourceSession === captured.sourceSession &&
    active.sourceId === captured.sourceId &&
    active.sourceRevision === captured.sourceRevision &&
    active.gameId === captured.gameId &&
    active.positions.length === captured.positions.length &&
    active.positions.every(
      (position, index) =>
        position.nodeKey === captured.positions[index]?.nodeKey &&
        position.fen === captured.positions[index]?.fen
    )
  )
}

function resultFromEval(
  task: AnalysisTaskSnapshot,
  position: AnalysisPositionSnapshot,
  evalResult: EngineEval
): AnalysisPositionResult {
  const pvLegal = validatePv(position.fen, evalResult.pv)
  const lines = sortedLines(position.fen, evalResult)
  const matchingBestLine = lines.find((line) => line.move === evalResult.bestMove && line.pvLegal)
  const fallbackBestLine = candidateLineDetails(position.fen, evalResult.bestMove, evalResult.pv)
  const bestMoveSan = matchingBestLine?.san ?? (fallbackBestLine.legal ? fallbackBestLine.san : '')

  return Object.freeze({
    requestId: task.requestId,
    scope: task.scope,
    sourceSession: task.sourceSession,
    sourceId: task.sourceId,
    sourceRevision: task.sourceRevision,
    gameId: task.gameId,
    nodeId: position.nodeId,
    nodeKey: position.nodeKey,
    positionId: position.positionId,
    fen: position.fen,
    label: position.label,
    ply: position.ply,
    raw: evalResult,
    score: scoreFromEval(position.fen, evalResult),
    pv: pvLegal ? evalResult.pv : '',
    pvLegal,
    bestMove: evalResult.bestMove,
    bestMoveSan,
    lines,
    analyzedAt: new Date().toISOString(),
  })
}

function percentage(completed: number, total: number): number {
  return total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0
}

function defaultAnalysisState(): AnalysisState {
  return {
    phase: 'idle',
    workerMode: 'unavailable',
    workerCount: 0,
    firstUseAccepted: firstUseAcceptedForApplicationSession,
    activeRequest: null,
    lastRequestedScope: null,
    lastCompletedScope: null,
    current: null,
    fullGame: null,
    progress: null,
    error: null,
    unavailableReason: null,
    staleRejected: 0,
    completedRequests: 0,
    cancelledRequests: 0,
    retryCount: 0,
    outcome: null,
    outcomeSequence: 0,
    candidateOutcome: null,
    candidateOutcomeSequence: 0,
  }
}

export const useAnalysisStore = defineStore('analysis', {
  state: (): AnalysisState => defaultAnalysisState(),

  getters: {
    running(state): boolean {
      return state.phase === 'initializing' || state.phase === 'analyzing'
    },
    runningScope(state): AnalysisScope | null {
      return state.activeRequest?.scope ?? null
    },
    matchingCurrent(state): AnalysisPositionResult | null {
      return state.current && resultMatchesCurrentPosition(state.current) ? state.current : null
    },
    matchingFullGame(state): FullGameAnalysis | null {
      return state.fullGame && fullGameMatchesCurrentTree(state.fullGame) ? state.fullGame : null
    },
    completedScope(): AnalysisScope | null {
      if (this.lastCompletedScope === 'full' && this.matchingFullGame) return 'full'
      if (this.lastCompletedScope === 'current' && this.matchingCurrent) return 'current'
      if (this.matchingFullGame) return 'full'
      if (this.matchingCurrent) return 'current'
      return null
    },
    presentation(): AnalysisPresentation {
      return createAnalysisPresentation({
        phase: this.phase,
        activeScope: this.runningScope,
        completedScope: this.completedScope,
        lastRequestedScope: this.lastRequestedScope,
        hasResult: this.hasResult,
        outcome: this.outcome,
      })
    },
    candidatePresentation(): CandidateInsertionPresentation | null {
      return candidateInsertionPresentation(this.candidateOutcome)
    },
    selectedPositionResult(): AnalysisPositionResult | null {
      const fullGame = this.matchingFullGame
      const pgn = usePgnStore()
      const node = pgn.currentNode
      const fullPosition =
        fullGame && node
          ? (fullGame.results.find(
              (result) =>
                result.nodeId === node.id &&
                result.fen === node.fen &&
                result.positionId === hashString(node.fen)
            ) ?? null)
          : null

      if (this.completedScope === 'full') {
        return fullPosition ?? this.matchingCurrent
      }

      if (this.completedScope === 'current') {
        return this.matchingCurrent ?? fullPosition
      }

      return null
    },
    resultFreshness(): 'current' | 'retained' | null {
      const result = this.selectedPositionResult
      if (!result) return null

      return this.running ||
        this.outcome ||
        this.phase === 'error' ||
        this.phase === 'unavailable' ||
        result.scope !== this.completedScope
        ? 'retained'
        : 'current'
    },
    canRetry(state): boolean {
      return Boolean(
        state.lastRequestedScope && (state.phase === 'error' || state.phase === 'unavailable')
      )
    },
    hasResult(): boolean {
      return Boolean(this.matchingCurrent || this.matchingFullGame)
    },
  },

  actions: {
    acceptFirstUse(): void {
      firstUseAcceptedForApplicationSession = true
      this.firstUseAccepted = true
    },

    clearProductFeedback(): void {
      this.outcome = null
      this.candidateOutcome = null
    },

    recordProductOutcome(
      kind: AnalysisProductOutcome['kind'],
      scope: AnalysisScope,
      origin: AnalysisProductOutcome['origin']
    ): void {
      this.outcomeSequence += 1
      this.outcome = {
        sequence: this.outcomeSequence,
        kind,
        origin,
        scope,
      }
      this.candidateOutcome = null
    },

    recordCandidateOutcome(kind: CandidateInsertionProductKind): void {
      this.candidateOutcomeSequence += 1
      this.candidateOutcome = {
        sequence: this.candidateOutcomeSequence,
        kind,
      }
      this.outcome = null
    },

    cancelActive(): boolean {
      const scope = this.activeRequest?.scope

      if (!scope) {
        return false
      }

      this.cancelledRequests += 1
      this.stop()
      this.recordProductOutcome('cancelled', scope, 'task')
      return true
    },

    analyzeCurrent(force = false): Promise<boolean> {
      return this.runTask('current', force)
    },

    analyzeFullGame(force = false): Promise<boolean> {
      return this.runTask('full', force)
    },

    async runTask(scope: AnalysisScope, force = false): Promise<boolean> {
      if (!this.firstUseAccepted) {
        return false
      }

      this.clearProductFeedback()

      const captured = captureTaskSnapshot(scope)

      if (!captured) {
        this.stop()
        this.phase = this.hasResult ? 'available' : 'idle'
        this.error = null
        this.unavailableReason = null
        return false
      }

      if (!force && this.activeRequest && sameCapturedTask(this.activeRequest, captured)) {
        return true
      }

      if (!force && scope === 'current' && this.matchingCurrent) {
        const [position] = captured.positions

        if (position?.nodeKey === this.matchingCurrent.nodeKey) {
          return true
        }
      }

      if (!force && scope === 'full' && this.matchingFullGame) {
        const completedKeys = this.matchingFullGame.results.map((result) => result.nodeKey)
        const capturedKeys = captured.positions.map((position) => position.nodeKey)

        if (
          completedKeys.length === capturedKeys.length &&
          completedKeys.every((key, index) => key === capturedKeys[index])
        ) {
          return true
        }
      }

      this.stop()
      const request = Object.freeze({ ...captured, requestId: nextRequestId() })
      this.activeRequest = request
      this.lastRequestedScope = scope
      this.phase = 'initializing'
      this.error = null
      this.unavailableReason = null

      if (scope === 'full') {
        const firstPosition = request.positions[0]

        if (!firstPosition) {
          this.rejectStaleRequest(request)
          return false
        }

        this.progress = {
          requestId: request.requestId,
          scope: 'full',
          completed: 0,
          total: request.positions.length,
          percentage: 0,
          currentIndex: 1,
          currentNodeId: firstPosition.nodeId,
          currentNodeKey: firstPosition.nodeKey,
          currentLabel: firstPosition.label,
        }
      } else {
        this.progress = null
      }

      try {
        const activeEngine = getEngine()
        activeEngine.init()

        if (!this.accepts(request)) {
          this.rejectStaleRequest(request)
          return false
        }

        this.workerMode = activeEngine.workerBacked ? 'worker' : 'main-thread-fallback'
        this.workerCount = activeEngine.workerCount
        this.phase = 'ready'
        this.phase = 'analyzing'

        if (scope === 'current') {
          const position = request.positions[0]

          if (!position) {
            this.rejectStaleRequest(request)
            return false
          }

          const currentEval = await activeEngine.evalFen(position.fen, {
            depth: DEFAULT_DEPTH,
            maxthinktimes: DEFAULT_THINK_MS,
          })

          if (!this.accepts(request)) {
            this.rejectStaleRequest(request)
            return false
          }

          if (currentEval.fen !== position.fen) {
            this.rejectStaleRequest(request)
            return false
          }

          this.current = resultFromEval(request, position, currentEval)
        } else {
          const results: AnalysisPositionResult[] = []

          for (const [index, position] of request.positions.entries()) {
            if (!this.accepts(request)) {
              this.rejectStaleRequest(request)
              return false
            }

            this.progress = {
              requestId: request.requestId,
              scope: 'full',
              completed: results.length,
              total: request.positions.length,
              percentage: percentage(results.length, request.positions.length),
              currentIndex: index + 1,
              currentNodeId: position.nodeId,
              currentNodeKey: position.nodeKey,
              currentLabel: position.label,
            }

            const currentEval = await activeEngine.evalFen(position.fen, {
              depth: DEFAULT_DEPTH,
              maxthinktimes: DEFAULT_THINK_MS,
            })

            if (!this.accepts(request)) {
              this.rejectStaleRequest(request)
              return false
            }

            if (currentEval.fen !== position.fen) {
              this.rejectStaleRequest(request)
              return false
            }

            results.push(resultFromEval(request, position, currentEval))
            this.progress = {
              requestId: request.requestId,
              scope: 'full',
              completed: results.length,
              total: request.positions.length,
              percentage: percentage(results.length, request.positions.length),
              currentIndex: index + 1,
              currentNodeId: position.nodeId,
              currentNodeKey: position.nodeKey,
              currentLabel: position.label,
            }
          }

          if (!this.accepts(request)) {
            this.rejectStaleRequest(request)
            return false
          }

          this.fullGame = Object.freeze({
            requestId: request.requestId,
            scope: 'full' as const,
            sourceSession: request.sourceSession,
            sourceId: request.sourceId,
            sourceRevision: request.sourceRevision,
            gameId: request.gameId,
            total: request.positions.length,
            results: Object.freeze(results),
            analyzedAt: new Date().toISOString(),
          })
        }

        this.phase = 'available'
        this.lastCompletedScope = scope
        this.completedRequests += 1
        this.activeRequest = null
        this.progress = null
        return true
      } catch (error) {
        if (stopped(error) || this.activeRequest?.requestId !== request.requestId) {
          return false
        }

        if (!this.accepts(request)) {
          this.rejectStaleRequest(request)
          return false
        }

        this.phase = typeof Worker === 'undefined' ? 'unavailable' : 'error'
        this.workerMode = this.phase === 'unavailable' ? 'unavailable' : this.workerMode
        this.unavailableReason = this.phase === 'unavailable' ? '当前浏览器不支持分析 Worker' : null
        this.error = error instanceof Error ? error.message : '分析失败'
        this.activeRequest = null
        this.progress = null
        return false
      }
    },

    retry(): Promise<boolean> {
      this.retryCount += 1
      return this.lastRequestedScope === 'full'
        ? this.analyzeFullGame(true)
        : this.analyzeCurrent(true)
    },

    stop(): void {
      this.activeRequest = null
      this.progress = null
      engine?.stop()
      this.workerCount = 0

      if (this.phase === 'initializing' || this.phase === 'analyzing' || this.phase === 'ready') {
        this.phase = this.hasResult ? 'available' : 'idle'
      }
    },

    dispose(): void {
      this.stop()
      disposeEngine()
      this.workerCount = 0
      this.workerMode = 'unavailable'
    },

    reconcileContext(canRunAnalysis: boolean): void {
      this.candidateOutcome = null
      const request = this.activeRequest

      if (!request) return
      if (!canRunAnalysis || !this.accepts(request)) {
        this.rejectStaleRequest(request)
      }
    },

    accepts(request: AnalysisTaskSnapshot): boolean {
      if (this.activeRequest?.requestId !== request.requestId) {
        return false
      }

      return request.scope === 'full'
        ? taskMatchesBase(request)
        : taskMatchesCurrentPosition(request)
    },

    rejectStaleRequest(request: AnalysisTaskSnapshot): void {
      if (this.activeRequest?.requestId !== request.requestId) return

      this.staleRejected += 1
      this.activeRequest = null
      this.progress = null
      engine?.stop()
      this.workerCount = 0
      this.phase = this.hasResult ? 'available' : 'idle'
      this.recordProductOutcome('stale', request.scope, 'task')
    },

    insertCandidate(selection: AnalysisCandidateSelection): AnalysisCandidateInsertionOutcome {
      if (this.running) {
        this.recordCandidateOutcome('busy')
        return { kind: 'busy' }
      }

      const result =
        selection.scope === 'current'
          ? this.current
          : (this.fullGame?.results.find(
              (entry) =>
                entry.requestId === selection.requestId && entry.nodeKey === selection.nodeKey
            ) ?? null)
      const resultIsCurrent =
        result !== null &&
        result.requestId === selection.requestId &&
        result.scope === selection.scope &&
        result.nodeKey === selection.nodeKey &&
        result.nodeKey === nodeKeyFor(result.gameId, result.nodeId, result.positionId) &&
        result.positionId === hashString(result.fen) &&
        (result.scope === 'current'
          ? result === this.current && resultMatchesCurrentPosition(result)
          : this.fullGame?.requestId === result.requestId &&
            fullGameMatchesCurrentTree(this.fullGame))

      if (!resultIsCurrent || !result) {
        this.recordProductOutcome('stale', selection.scope, 'candidate')
        return { kind: 'stale' }
      }

      const candidate = result.lines.find(
        (line) =>
          line.id === selection.candidateId &&
          line.move === selection.candidateMove &&
          line.pv === selection.candidatePv &&
          line.id === candidateLineIdentity(line.move, line.pv)
      )

      if (!candidate) {
        this.recordProductOutcome('stale', selection.scope, 'candidate')
        return { kind: 'stale' }
      }

      if (!candidate.pvLegal) {
        this.recordCandidateOutcome('illegal')
        return { kind: 'illegal' }
      }

      const pgn = usePgnStore()
      const mutation = pgn.insertVariationContinuation({
        expected: {
          sourceSession: result.sourceSession,
          sourceId: result.sourceId,
          sourceRevision: result.sourceRevision,
          gameId: result.gameId,
          nodeId: result.nodeId,
          fen: result.fen,
        },
        candidateMove: candidate.move,
        pv: candidate.pv,
      })

      if (mutation.status === 'inserted') {
        this.phase = 'idle'
        this.recordCandidateOutcome('inserted')
        return {
          kind: 'inserted',
          terminalNodeId: mutation.terminalNodeId,
          createdCount: mutation.createdCount,
        }
      }

      if (mutation.status === 'existing') {
        this.recordCandidateOutcome('existing')
        return { kind: 'existing' }
      }

      if (mutation.status !== 'rejected') {
        this.recordCandidateOutcome('illegal')
        return { kind: 'illegal' }
      }

      if (mutation.reason === 'readonly') {
        this.recordCandidateOutcome('readonly')
        return { kind: 'readonly' }
      }

      if (mutation.reason === 'busy') {
        this.recordCandidateOutcome('busy')
        return { kind: 'busy' }
      }

      if (mutation.reason === 'stale') {
        this.phase = this.hasResult ? 'available' : 'idle'
        this.recordProductOutcome('stale', selection.scope, 'candidate')
        return { kind: 'stale' }
      }

      this.recordCandidateOutcome('illegal')
      return { kind: 'illegal' }
    },

    writeMoveAssessment(
      request: AnalysisTaskSnapshot,
      currentEval: EngineEval,
      parentEval: EngineEval | null
    ): void {
      const position = request.positions[0]

      if (
        request.scope !== 'current' ||
        !position?.parentFen ||
        !position.moveFromTo ||
        !parentEval
      ) {
        return
      }

      const pgn = usePgnStore()
      const node = pgn.currentNode

      if (
        !pgn.canMutateCurrentSource ||
        pgn.sourceSession !== request.sourceSession ||
        pgn.source.id !== request.sourceId ||
        pgn.sourceRevision !== request.sourceRevision ||
        pgn.currentGameId !== request.gameId ||
        !node ||
        node.id !== position.nodeId ||
        node.fen !== position.fen
      ) {
        return
      }

      const result = computeEvalResult({
        r1: currentEval,
        r2: parentEval,
        moveFromTo: position.moveFromTo,
        moveFen: position.fen,
      })

      if (!result) {
        return
      }

      const analysis = {
        ...result,
        analysisScope: 'single' as const,
      }

      if (JSON.stringify(node.annotation.analysis) === JSON.stringify(analysis)) {
        return
      }

      node.annotation = {
        ...node.annotation,
        analysis,
      }
      node.rawComments = serializeAnnotation(node.annotation)
      pgn.markCurrentSourceChanged(request.sourceId, request.sourceSession, request.sourceRevision)
    },
  },
})
